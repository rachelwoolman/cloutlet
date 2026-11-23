// Inbox: offers (accept, or message to talk terms), message threads, and (creators) Updates:
// "posted a new job" notices from businesses whose bell you turned on. Updates are a separate channel from messages.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Chip, Empty, ErrorNote, Loading, OfferSummary, offerStatus, StatusPill, Verified } from '../../components';
import { getService, timeAgo } from '../../data/catalog';
import { backend, setLastFeed, useAlerts, useOffers, useThreads } from '../../data/hooks';
import { useMe } from '../../data/session';
import { OfferWithPeople, Profile, ThreadWithPeople } from '../../data/types';
import { colors, fonts, spacing, type } from '../../theme';

export default function Inbox() {
  const me = useMe();
  const [tab, setTab] = useState<'offers' | 'messages' | 'updates'>('offers');
  const alerts = useAlerts(me);
  const unread = (alerts.data ?? []).filter((a) => !a.read).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.lg, gap: spacing.md }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 26, color: colors.text }}>Inbox</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Chip label="Offers" selected={tab === 'offers'} onPress={() => setTab('offers')} />
          <Chip label="Messages" selected={tab === 'messages'} onPress={() => setTab('messages')} />
          {me.role === 'creator' ? <Chip label={unread ? `Updates · ${unread}` : 'Updates'} selected={tab === 'updates'} onPress={() => setTab('updates')} /> : null}
        </View>
      </View>
      {tab === 'offers' ? <OffersList me={me} /> : tab === 'messages' ? <ThreadsList me={me} /> : <UpdatesList me={me} />}
    </SafeAreaView>
  );
}

function OffersList({ me }: { me: Profile }) {
  const offers = useOffers(me);
  const list = offers.data ?? [];

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.screen, gap: spacing.md }}>
      {offers.loading && !offers.data ? <Loading /> : null}
      {offers.error ? <ErrorNote message={offers.error} /> : null}
      {offers.data && list.length === 0 ? (
        <Empty
          title="No offers yet"
          note={me.role === 'creator' ? 'Post your work so spots can find you.' : 'Find a creator in Explore.'}
        />
      ) : null}
      {list.map((o) => (
        <OfferCard key={o.id} offer={o} me={me} />
      ))}
    </ScrollView>
  );
}

function OfferCard({ offer, me }: { offer: OfferWithPeople; me: Profile }) {
  const other = me.role === 'creator' ? offer.business : offer.creator;
  const yourMove = offerStatus(offer, me.role).label === 'Your move';
  const [busy, setBusy] = useState(false);
  const openChat = () => router.push(`/chat/${offer.threadId}`);

  const accept = async () => {
    setBusy(true);
    try {
      await backend.respondToOffer(me, offer.id, 'accepted');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OfferSummary offer={offer} other={other} myRole={me.role} onPress={() => openChat()}>
      {yourMove ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button title="Message" variant="secondary" size="sm" style={{ flex: 1 }} onPress={openChat} />
          <Button title="Accept" size="sm" style={{ flex: 1 }} disabled={busy} onPress={accept} />
        </View>
      ) : (
        <Button title="Open chat" variant="soft" size="sm" onPress={openChat} />
      )}
    </OfferSummary>
  );
}

// Job updates from businesses you turned the bell on for. Opening this marks them read;
// the ones that were new keep an orange dot until you leave.
function UpdatesList({ me }: { me: Profile }) {
  const alerts = useAlerts(me);
  const list = alerts.data ?? [];
  // Remember which were new when you opened this, before they get marked read
  const [newIds, setNewIds] = useState<Set<string> | null>(null);
  if (newIds === null && alerts.data) setNewIds(new Set(alerts.data.filter((a) => !a.read).map((a) => a.id)));

  const hasUnread = list.some((a) => !a.read);
  useEffect(() => {
    if (hasUnread) backend.markAlertsRead(me);
  }, [hasUnread, me]);

  const open = (postId: string) => {
    setLastFeed(list.map((a) => a.post));
    router.push({ pathname: '/reels', params: { start: postId } });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingVertical: spacing.md }}>
      {alerts.loading && !alerts.data ? <Loading /> : null}
      {alerts.data && list.length === 0 ? (
        <Empty title="No updates yet" note="Tap the bell on a business’s profile to hear when they post a job." />
      ) : null}
      {list.map((a) => {
        const b = a.post.author;
        const isNew = newIds?.has(a.id);
        return (
          <Pressable
            key={a.id}
            onPress={() => open(a.post.id)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.screen, paddingVertical: spacing.md, backgroundColor: pressed ? colors.buttonFill : 'transparent' })}
          >
            <Avatar uri={b.avatar} initials={b.initials} size={48} shape="square" />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[type.bodyStrong, { flexShrink: 1 }]} numberOfLines={1}>
                  {b.name}
                </Text>
                <Verified profile={b} size={14} />
                <Text style={[type.small, { fontSize: 12, marginLeft: 'auto' }]}>{timeAgo(a.createdAt)}</Text>
              </View>
              <Text style={[type.small, { color: colors.text }]} numberOfLines={2}>
                Posted a new job: {a.post.caption}
                {a.post.job ? ` · ${getService(a.post.job.serviceId).name}` : ''}
              </Text>
            </View>
            {isNew ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} accessibilityLabel="New" /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ThreadsList({ me }: { me: Profile }) {
  const threads = useThreads(me);
  const list = threads.data ?? [];

  return (
    <ScrollView contentContainerStyle={{ paddingVertical: spacing.md }}>
      {threads.loading && !threads.data ? <Loading /> : null}
      {threads.error ? <ErrorNote message={threads.error} /> : null}
      {threads.data && list.length === 0 ? <Empty title="No messages yet" /> : null}
      {list.map((t) => (
        <ThreadRow key={t.id} thread={t} me={me} />
      ))}
    </ScrollView>
  );
}

function ThreadRow({ thread, me }: { thread: ThreadWithPeople; me: Profile }) {
  const other = me.role === 'creator' ? thread.business : thread.creator;
  const status = thread.offer ? offerStatus(thread.offer, me.role) : null;
  return (
    <Pressable
      onPress={() => router.push(`/chat/${thread.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.screen,
        paddingVertical: spacing.md,
        backgroundColor: pressed ? colors.buttonFill : 'transparent',
      })}
    >
      <Avatar uri={other.avatar} initials={other.initials} size={48} shape={other.role === 'business' ? 'square' : 'circle'} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[type.bodyStrong, { flexShrink: 1 }]} numberOfLines={1}>
            {other.name}
          </Text>
          <Verified profile={other} size={13} />
          <Text style={[type.small, { fontSize: 12, marginLeft: 'auto' }]}>{timeAgo(thread.updatedAt)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={[type.small, { flex: 1 }]} numberOfLines={1}>
            {thread.lastMessage ?? 'Say hi'}
          </Text>
          {status ? <StatusPill {...status} /> : null}
        </View>
      </View>
    </Pressable>
  );
}
