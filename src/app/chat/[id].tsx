// Chat between a creator and a business, with the offer pinned on top.
// Terms are talked through in messages (no bargaining controls). The creator accepts or declines;
// if they agree on something new, the business taps "Update offer" to send the new terms. Live via Supabase Realtime.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorNote, Loading, OfferSummary, offerStatus, TopBar } from '../../components';
import { formatTerms } from '../../data/catalog';
import { backend, useMessages, useThread } from '../../data/hooks';
import { useMe } from '../../data/session';
import { Message, Offer, Profile } from '../../data/types';
import { colors, fonts, radius, spacing, type } from '../../theme';

export default function Chat() {
  const me = useMe();
  const { id, draft: startDraft } = useLocalSearchParams<{ id: string; draft?: string }>();
  const thread = useThread(id);
  const messages = useMessages(id);
  const [draft, setDraft] = useState(startDraft ?? ''); // pre-filled when a creator messages about a job
  const [inputWidth, setInputWidth] = useState(280);
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);

  const t = thread.data;
  if (!t) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar />
        {thread.loading ? <Loading /> : <ErrorNote message="Chat not found" />}
      </SafeAreaView>
    );
  }

  const other = me.role === 'creator' ? t.business : t.creator;

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    try {
      await backend.sendMessage(me, t.id, body);
    } catch (e) {
      setDraft(body);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <TopBar
        title={other.name}
        right={
          <Pressable onPress={() => router.push(`/profile/${other.id}`)} hitSlop={10} accessibilityLabel="View profile">
            <Ionicons name="person-circle-outline" size={24} color={colors.text} />
          </Pressable>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {t.offer ? (
          <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.sm }}>
            <OfferPanel offer={t.offer} other={other} me={me} onError={setError} />
          </View>
        ) : me.role === 'business' ? (
          <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.sm }}>
            <Button title="Send an offer" size="sm" onPress={() => router.push(`/request/${other.id}`)} />
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
            <Bubble key={m.id} message={m} mine={m.senderId === me.id} />
          ))}
        </ScrollView>

        {error ? <ErrorNote message={error} /> : null}

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.screen, paddingVertical: spacing.sm, borderTopWidth: 1, borderColor: colors.divider }}>
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
            disabled={!draft.trim()}
            accessibilityLabel="Send"
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, opacity: draft.trim() ? 1 : 0.4 }}
          >
            <Ionicons name="arrow-up" size={20} color={colors.onAccent} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// The pinned offer. Creator: Accept or Decline. Business: wait, or send updated terms
// after agreeing on them in the chat.
function OfferPanel({ offer, other, me, onError }: { offer: Offer; other: Profile; me: Profile; onError: (m: string) => void }) {
  const yourMove = offerStatus(offer, me.role).label === 'Your move';
  const [busy, setBusy] = useState(false);
  const respond = async (answer: 'accepted' | 'declined') => {
    setBusy(true);
    try {
      await backend.respondToOffer(me, offer.id, answer);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <OfferSummary offer={offer} other={other} myRole={me.role} compact>
      {yourMove ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button title="Decline" variant="secondary" size="sm" style={{ flex: 1 }} disabled={busy} onPress={() => respond('declined')} />
          <Button title="Accept" size="sm" style={{ flex: 1 }} disabled={busy} onPress={() => respond('accepted')} />
        </View>
      ) : offer.status === 'pending' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <Text style={type.small}>Waiting on {other.name}</Text>
          {me.role === 'business' ? <Button title="Update offer" variant="ghost" size="sm" onPress={() => router.push(`/request/${other.id}`)} /> : null}
        </View>
      ) : offer.status === 'accepted' ? (
        <Text style={[type.small, { color: colors.text }]}>Deal done. Share details here.</Text>
      ) : me.role === 'business' ? (
        <Button title="Send a new offer" variant="secondary" size="sm" onPress={() => router.push(`/request/${other.id}`)} />
      ) : null}
    </OfferSummary>
  );
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  // Offer events show as a small neutral line with the terms. Any note the sender
  // added shows right after it as a regular message, like the rest of the chat.
  if (message.kind !== 'text') {
    const label = { offer: 'Offer', counter: 'Updated offer', accepted: 'Accepted', declined: 'Declined' }[message.kind];
    const terms = message.price != null && message.kind !== 'declined' ? formatTerms(message.price, message.perks ?? []) : null;
    const note = message.body && !['Deal', 'Declined', 'New terms'].includes(message.body) ? message.body : null;
    return (
      <>
        <View style={{ alignSelf: 'center', maxWidth: '85%', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.buttonFill }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
            {label}
            {terms ? ` · ${terms}` : ''}
          </Text>
        </View>
        {note ? <TextBubble body={note} mine={mine} /> : null}
      </>
    );
  }
  return <TextBubble body={message.body} mine={mine} />;
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
