// Chat between a creator and a business. A chat only exists once someone sends something.
//
// Two ways a deal starts here, kept separate:
//  A. The creator applied to a job post. The post's terms are pinned at the top ("Applied to …").
//     The business can propose those terms as they are, or change them first. Applying is not an offer.
//  B. A casual chat (no application). The business can talk first, then tap Offer next to the
//     message box. A message is never treated as an offer or an application.
// Either way the business reviews the terms before sending, and no message is added for them.
// Then: the creator accepts the terms, the business confirms. Every version of the terms stays
// in the chat as a small grey line. Live via Supabase Realtime.
//
// via=feed: opened from a post, profile or the map. A creator sees a short note pointing to the
// Inbox instead of offer buttons, so it doesn't look like a reply to the post they tapped.
// offer=1: open the offer sheet straight away (Request collab on a creator's profile or video).
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ErrorNote, isOpenOffer, Loading, OfferSummary, offerStep, TopBar } from '../../components';
import { OfferSheet, OfferSheetMode } from '../../components/OfferSheet';
import { formatTerms } from '../../data/catalog';
import { backend, useMessages, usePost, useProfile, useThread } from '../../data/hooks';
import { deliverablesLabel, hiresLabel, jobSummary, offerTermsLine, payLabel, termsFromJob } from '../../data/jobs';
import { useMe } from '../../data/session';
import { Message, Offer, Profile, ThreadWithPeople } from '../../data/types';
import { colors, fonts, radius, spacing, type } from '../../theme';

// id=new&with=<profile id>: you've never talked. Shows an empty chat; the chat is created
// when you send the first message or an offer (nothing is created by just opening this screen).
export default function Chat() {
  const { id, with: withId } = useLocalSearchParams<{ id: string; with?: string }>();
  return id === 'new' && withId ? <NewChat otherId={withId} /> : <ThreadChat id={id} />;
}

function NewChat({ otherId }: { otherId: string }) {
  const me = useMe();
  const { draft: startDraft, offer: openOffer } = useLocalSearchParams<{ draft?: string; offer?: string }>();
  const other = useProfile(otherId);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState(openOffer === '1');
  const o = other.data;
  if (!o) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar />
        {other.loading ? <Loading /> : <ErrorNote message="Profile not found" />}
      </SafeAreaView>
    );
  }
  const goTo = (tid: string) => router.replace({ pathname: '/chat/[id]', params: { id: tid } });
  const canOffer = me.role === 'business' && o.role === 'creator';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ChatTopBar other={o} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, padding: spacing.screen, justifyContent: 'center' }}>
          <Text style={[type.small, { textAlign: 'center' }]}>
            {me.role === 'creator' && o.role === 'business' ? `Say hi to ${o.name}. To apply to one of their jobs, tap Apply on the post.` : `Say hi to ${o.name}.`}
          </Text>
        </View>
        {error ? <ErrorNote message={error} /> : null}
        <Composer initial={startDraft} onSend={async (body) => goTo(await backend.startChat(me, o.id, body))} onError={setError} onOffer={canOffer ? () => setSheet(true) : undefined} />
      </KeyboardAvoidingView>
      {sheet && canOffer ? <OfferSheet me={me} creator={o} mode={{ kind: 'new' }} onClose={() => setSheet(false)} onSent={goTo} /> : null}
    </SafeAreaView>
  );
}

function ThreadChat({ id }: { id: string }) {
  const me = useMe();
  const { via, offer: openOffer } = useLocalSearchParams<{ via?: string; offer?: string }>();
  const thread = useThread(id);
  const messages = useMessages(id);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<OfferSheetMode | null>(openOffer === '1' ? { kind: 'new' } : null);
  const scroll = useRef<ScrollViewInstance>(null);

  const t = thread.data;
  // The post the creator applied to most recently (path A)
  const latestApplication = t ? [...t.applications].sort((a, b) => b.createdAt - a.createdAt)[0] : undefined;
  const appliedPost = usePost(latestApplication?.postId ?? '');

  if (!t) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar />
        {thread.loading ? <Loading /> : <ErrorNote message="Chat not found" />}
      </SafeAreaView>
    );
  }

  const other = me.role === 'creator' ? t.business : t.creator;
  const titles = new Map(t.applications.map((a) => [a.postId, a.title]));
  const post = latestApplication && appliedPost.data?.id === latestApplication.postId ? appliedPost.data : undefined;
  const isBusiness = me.role === 'business';
  // Path A: an application and no offer yet. The post's terms are the starting point.
  const showPostTerms = !t.offer && post?.job;
  // A new offer from this chat. After an application it starts from that post's terms.
  const newOfferMode = (): OfferSheetMode =>
    post?.job ? { kind: 'new', postId: post.id, postTitle: post.caption, start: termsFromJob(post.job) } : { kind: 'new' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ChatTopBar other={other} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {t.offer && via === 'feed' && me.role === 'creator' && isOpenOffer(t.offer) ? (
          <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.sm }}>
            <OfferInInboxNote />
          </View>
        ) : t.offer ? (
          <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.sm }}>
            <OfferPanel
              offer={t.offer}
              other={other}
              me={me}
              onError={setError}
              onChangeTerms={() => setSheet({ kind: 'revise', offer: t.offer! })}
              onNewOffer={() => setSheet(newOfferMode())}
            />
          </View>
        ) : showPostTerms && post ? (
          <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.sm }}>
            <PostTermsCard
              thread={t}
              title={post.caption}
              summary={jobSummary(post.job!)}
              pay={payLabel(post.job!)}
              hires={hiresLabel(post.job!)}
              isBusiness={isBusiness}
              onPropose={() => setSheet({ ...(newOfferMode() as Extract<OfferSheetMode, { kind: 'new' }>), review: true })}
              onChange={() => setSheet(newOfferMode())}
            />
          </View>
        ) : null}

        <ScrollView
          ref={scroll}
          contentContainerStyle={{ padding: spacing.screen, gap: spacing.sm }}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.loading && !messages.data ? <Loading /> : null}
          {(messages.data ?? []).map((m) => (
            <Bubble key={m.id} message={m} mine={m.senderId === me.id} postTitle={m.postId ? titles.get(m.postId) : undefined} />
          ))}
        </ScrollView>

        {error ? <ErrorNote message={error} /> : null}
        <Composer
          onSend={(body) => backend.sendMessage(me, t.id, body)}
          onError={setError}
          // Path B: no application, no open offer. The offer button sits next to the message box.
          onOffer={isBusiness && !t.offer && !showPostTerms ? () => setSheet({ kind: 'new' }) : undefined}
        />
      </KeyboardAvoidingView>

      {sheet && isBusiness ? <OfferSheet me={me} creator={other} mode={sheet} onClose={() => setSheet(null)} onSent={() => setSheet(null)} /> : null}
    </SafeAreaView>
  );
}

// Path A: what the creator applied to, pinned at the top until there's an offer.
// Business: propose these terms as they are, or change them first. Creator: read only.
function PostTermsCard({ title, summary, pay, hires, isBusiness, onPropose, onChange }: { thread: ThreadWithPeople; title: string; summary: string; pay: string; hires: string | null; isBusiness: boolean; onPropose: () => void; onChange: () => void }) {
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ gap: 2 }}>
        <Text style={[type.small, { fontSize: 12 }]}>{isBusiness ? 'Applied to' : 'You applied to'}</Text>
        <Text style={type.bodyStrong} numberOfLines={1}>
          {title}
        </Text>
        <Text style={type.small}>{summary}</Text>
        <Text style={[type.small, { color: colors.text }]}>
          {pay}
          {hires ? ` · ${hires}` : ''}
        </Text>
      </View>
      {isBusiness ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button title="Change terms" variant="secondary" size="sm" style={{ flex: 1 }} onPress={onChange} />
          <Button title="Propose these terms" size="sm" style={{ flex: 1 }} onPress={onPropose} />
        </View>
      ) : (
        <Text style={[type.small, { fontSize: 12 }]}>The business proposes final terms here.</Text>
      )}
    </Card>
  );
}

function ChatTopBar({ other }: { other: Profile }) {
  return (
    <TopBar
      title={other.name}
      right={
        <Pressable onPress={() => router.push(`/profile/${other.id}`)} hitSlop={10} accessibilityLabel="View profile">
          <Ionicons name="person-circle-outline" size={24} color={colors.text} />
        </Pressable>
      }
    />
  );
}

// The message box. Clears when you send, and puts the text back if sending fails.
// onOffer: business only, in a chat with no application and no open offer (path B)
function Composer({ initial, onSend, onError, onOffer }: { initial?: string; onSend: (body: string) => Promise<unknown>; onError: (m: string | null) => void; onOffer?: () => void }) {
  const [draft, setDraft] = useState(initial ?? '');
  const [inputWidth, setInputWidth] = useState(280);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const body = draft.trim();
    if (!body || busy) return;
    setDraft('');
    setBusy(true);
    onError(null);
    try {
      await onSend(body);
    } catch (e) {
      setDraft(body);
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.screen, paddingVertical: spacing.sm, borderTopWidth: 1, borderColor: colors.divider }}>
      {onOffer ? (
        <Pressable
          onPress={onOffer}
          accessibilityRole="button"
          accessibilityLabel="Send an offer"
          style={({ pressed }) => ({ height: 40, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, borderRadius: 20, borderWidth: 1, borderColor: colors.accent, backgroundColor: pressed ? colors.accentSoft : 'transparent' })}
        >
          <Ionicons name="pricetag-outline" size={16} color={colors.accentPressed} />
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accentPressed }}>Offer</Text>
        </Pressable>
      ) : null}
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onLayout={(e) => setInputWidth(e.nativeEvent.layout.width)}
        placeholder="Message"
        placeholderTextColor={colors.textSecondary}
        multiline
        onSubmitEditing={send}
        style={{
          flex: 1,
          height: inputHeightFor(draft, inputWidth),
          paddingHorizontal: spacing.lg,
          paddingVertical: 10,
          borderRadius: 20,
          backgroundColor: colors.buttonFill,
          fontFamily: fonts.body,
          fontSize: 15,
          color: colors.text,
          outlineStyle: 'none',
        } as any}
      />
      <Pressable
        onPress={send}
        disabled={!draft.trim() || busy}
        accessibilityLabel="Send"
        style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: draft.trim() && !busy ? 1 : 0.4 }}
      >
        <Ionicons name="arrow-up" size={20} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

// The pinned offer. Shows the terms and the one next step for whoever's turn it is:
//   accept      (creator) Decline · Accept terms
//   waiting     (business) waiting on them · Change terms (same offer, opens the offer sheet here)
//   confirm     (business) they accepted: Decline · Confirm deal
//   confirming  (creator) you accepted, waiting on them to confirm
//   deal        confirmed: the collab can start
function OfferPanel({ offer, other, me, onError, onChangeTerms, onNewOffer }: { offer: Offer; other: Profile; me: Profile; onError: (m: string) => void; onChangeTerms: () => void; onNewOffer: () => void }) {
  const step = offerStep(offer, me.role);
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const decline = () => run(() => backend.respondToOffer(me, offer.id, 'declined'));
  // Business: change the terms of this same offer (the creator then accepts the new terms)
  const updateOffer = me.role === 'business' ? onChangeTerms : undefined;

  return (
    <OfferSummary offer={offer} other={other} myRole={me.role} compact>
      {step === 'accept' ? (
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title="Decline" variant="secondary" size="sm" style={{ flex: 1 }} disabled={busy} onPress={decline} />
            <Button title="Accept terms" size="sm" style={{ flex: 1 }} disabled={busy} onPress={() => run(() => backend.respondToOffer(me, offer.id, 'agreed'))} />
          </View>
          <Text style={[type.small, { fontSize: 12 }]}>{other.name} confirms after you accept. Not a deal until then.</Text>
        </View>
      ) : step === 'waiting' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <Text style={[type.small, { flex: 1 }]}>Waiting on {other.name} to accept</Text>
          {updateOffer ? <Button title="Change terms" variant="ghost" size="sm" onPress={updateOffer} /> : null}
        </View>
      ) : step === 'confirm' ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.small, { color: colors.text }]}>{other.name} accepted these terms. Confirm to start the collab.</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title="Decline" variant="secondary" size="sm" style={{ flex: 1 }} disabled={busy} onPress={decline} />
            <Button title="Confirm deal" size="sm" style={{ flex: 1 }} disabled={busy} onPress={() => run(() => backend.confirmOffer(me, offer.id))} />
          </View>
          {updateOffer ? <Button title="Change terms instead" variant="ghost" size="sm" disabled={busy} onPress={updateOffer} /> : null}
        </View>
      ) : step === 'confirming' ? (
        <Text style={type.small}>You accepted these terms. Waiting on {other.name} to confirm.</Text>
      ) : step === 'deal' ? (
        <Text style={[type.small, { color: colors.text }]}>Deal confirmed. Share details here.</Text>
      ) : me.role === 'business' ? (
        <Button title="Send a new offer" variant="secondary" size="sm" onPress={onNewOffer} />
      ) : null}
    </OfferSummary>
  );
}

// Opened from a post or profile while this business has an open offer to you.
// The offer itself (and accepting it) lives in the Inbox, so we just point there.
function OfferInInboxNote() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.buttonFill }}>
      <Ionicons name="mail-unread-outline" size={18} color={colors.textSecondary} />
      <Text style={[type.small, { flex: 1, color: colors.text }]}>This business has already sent you an offer. Check your inbox.</Text>
      <Button title="Inbox" variant="ghost" size="sm" onPress={() => router.push('/inbox')} />
    </View>
  );
}

function Bubble({ message, mine, postTitle }: { message: Message; mine: boolean; postTitle?: string }) {
  // Offer events show as a small neutral line with the terms. Any note the sender
  // added shows right after it as a regular message, like the rest of the chat.
  if (message.kind === 'application') {
    return (
      <>
        <EventLine text={`Applied · ${postTitle ?? 'a job post'}`} />
        <TextBubble body={message.body} mine={mine} />
      </>
    );
  }
  const note = message.body && !['Deal', 'Declined', 'New terms', 'Terms accepted'].includes(message.body) ? message.body : null;
  // A proposal (new or changed terms): a small card with the terms, on the sender's side
  if (message.kind === 'offer' || message.kind === 'counter') {
    const heading = message.kind === 'counter' ? 'Updated terms' : message.postId ? 'Proposed terms' : 'Offer';
    return (
      <>
        <TermsCard message={message} heading={heading} from={message.kind === 'offer' && message.postId ? postTitle : undefined} mine={mine} />
        {note ? <TextBubble body={note} mine={mine} /> : null}
      </>
    );
  }
  // Answers to a proposal: a short pill. The terms are already in the card above.
  if (message.kind !== 'text') {
    const label = { agreed: 'Terms accepted', accepted: 'Deal confirmed', declined: 'Declined' }[message.kind];
    return (
      <>
        <EventLine text={label} />
        {note ? <TextBubble body={note} mine={mine} /> : null}
      </>
    );
  }
  return <TextBubble body={message.body} mine={mine} />;
}

// One version of the terms, readable at a glance:
//   PROPOSED TERMS                (small orange label)
//   From Finals-week study Reels  (only when it came from a job post)
//   3 Instagram Reels
//   $50
//   + 2 pastries · Free refills all week
//   📅 Due Dec 9
function TermsCard({ message: m, heading, from, mine }: { message: Message; heading: string; from?: string; mine: boolean }) {
  const perks = m.perks ?? [];
  const due = m.postBy && m.postBy !== 'Flexible' ? m.postBy : null;
  return (
    <View
      accessibilityLabel={`${heading}${from ? ` from ${from}` : ''}: ${m.serviceId ? offerTermsLine({ serviceId: m.serviceId, quantity: m.quantity ?? 1, price: m.price ?? 0, perks, postBy: m.postBy }) : formatTerms(m.price ?? 0, perks)}`}
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        width: '78%',
        padding: spacing.md,
        gap: 2,
        borderRadius: 18,
        borderBottomRightRadius: mine ? 4 : 18,
        borderBottomLeftRadius: mine ? 18 : 4,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
      }}
    >
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.accentPressed }}>{heading.toUpperCase()}</Text>
      {from ? (
        <Text style={[type.small, { fontSize: 12 }]} numberOfLines={1}>
          From {from}
        </Text>
      ) : null}
      {m.serviceId ? <Text style={[type.bodyStrong, { marginTop: spacing.xs }]}>{deliverablesLabel(m.serviceId, m.quantity ?? 1)}</Text> : null}
      <Text style={[type.h2, { marginTop: m.serviceId ? 0 : spacing.xs }]}>{m.price && m.price > 0 ? `$${m.price}` : 'Perks only'}</Text>
      {perks.length ? <Text style={type.small}>+ {perks.join(' · ')}</Text> : null}
      {due ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs }}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={[type.small, { fontSize: 12 }]}>Due {due}</Text>
        </View>
      ) : null}
    </View>
  );
}

// A small neutral line in the middle of the chat for things that happened (applied, offer, deal)
function EventLine({ text }: { text: string }) {
  return (
    <View style={{ alignSelf: 'center', maxWidth: '85%', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.buttonFill }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

// The message box grows with what you type (up to about 6 lines) and shrinks back as you delete.
// Worked out from the text itself so it behaves the same on phones and web.
function inputHeightFor(text: string, width: number): number {
  const perLine = Math.max(10, Math.floor((width - 2 * spacing.lg) / 8.2)); // ~8px per character at 15px
  const lines = text.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / perLine)), 0);
  return Math.min(160, Math.max(40, lines * 21 + 20));
}

function TextBubble({ body, mine }: { body: string; mine: boolean }) {
  return (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 18,
        borderBottomRightRadius: mine ? 4 : 18,
        borderBottomLeftRadius: mine ? 18 : 4,
        backgroundColor: mine ? colors.accent : colors.surface,
        borderWidth: mine ? 0 : 1,
        borderColor: colors.divider,
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: mine ? colors.onAccent : colors.text }}>{body}</Text>
    </View>
  );
}
