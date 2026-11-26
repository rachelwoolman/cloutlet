// Inbox.
// Creators: Offers (from businesses; accept inside the chat), Messages, Updates ("posted a new job"
//   notices from businesses whose bell you turned on, a separate channel from messages).
// Businesses: Messages, one list with simple filters: All · Applicants · DMs.
//   Applicants keeps the applicant rows (newest first) and can be narrowed by job post and follower size.
//   Requested collabs: offers they made (creators don't make formal offers).
// Newest first everywhere.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Chip, Empty, ErrorNote, Loading, needsMyMove, OfferSummary, StatusPill, Verified } from '../../components';
import { conversationLabel } from '../../data/deals';
import { formatFollowers, getService, timeAgo } from '../../data/catalog';
import { backend, setLastFeed, useAlerts, useApplications, useOffers, useThreads } from '../../data/hooks';
import { useMe } from '../../data/session';
import { OfferWithPeople, Profile, ThreadWithPeople } from '../../data/types';
import { colors, fonts, spacing, type } from '../../theme';

export default function Inbox() {
  const me = useMe();
  const [tab, setTab] = useState<'offers' | 'messages' | 'updates'>(me.role === 'business' ? 'messages' : 'offers');
  const alerts = useAlerts(me);
  const unread = (alerts.data ?? []).filter((a) => !a.read).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.lg, gap: spacing.md }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 26, color: colors.text }}>Inbox</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {me.role === 'business' ? (
            <>
              <Chip label="Messages" selected={tab === 'messages'} onPress={() => setTab('messages')} />
              <Chip label="Requested collabs" selected={tab === 'offers'} onPress={() => setTab('offers')} />
            </>
          ) : (
            <>
              <Chip label="Offers" selected={tab === 'offers'} onPress={() => setTab('offers')} />
              <Chip label="Messages" selected={tab === 'messages'} onPress={() => setTab('messages')} />
            </>
          )}
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
          title={me.role === 'business' ? 'No requested collabs yet' : 'No offers yet'}
          note={me.role === 'creator' ? 'Post your work so spots can find you.' : 'Send one from a chat or a creator’s profile.'}
        />
      ) : null}
      {list.map((o) => (
        <OfferCard key={o.id} offer={o} me={me} />
      ))}
    </ScrollView>
  );
}

// Offers are only looked at here. Accepting and confirming happen inside the chat,
// next to the conversation, so nobody agrees to a deal from a list.
function OfferCard({ offer, me }: { offer: OfferWithPeople; me: Profile }) {
  const other = me.role === 'creator' ? offer.business : offer.creator;
  const openChat = () => router.push(`/chat/${offer.threadId}`);

  return (
    <OfferSummary offer={offer} other={other} myRole={me.role} onPress={openChat}>
      <Button title="Open chat" variant={needsMyMove(offer, me.role) ? 'primary' : 'soft'} size="sm" onPress={openChat} />
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

// Business follower-size filter for applicants (same bands as the pricing tiers)
const sizes = [
  { label: 'Any size', min: 0, max: Infinity },
  { label: 'Under 2K', min: 0, max: 1999 },
  { label: '2K–10K', min: 2000, max: 9999 },
  { label: '10K+', min: 10000, max: Infinity },
];

// One list of chats, newest first. Businesses filter it: All · Applicants · DMs
// (DMs = no application: the creator just wrote, or the business reached out first).
function ThreadsList({ me }: { me: Profile }) {
  const threads = useThreads(me);
  const [show, setShow] = useState<'all' | 'applicants' | 'casual'>('all');
  const all = [...(threads.data ?? [])].sort((a, b) => b.updatedAt - a.updatedAt);
  const list = show === 'casual' ? all.filter((t) => t.applications.length === 0) : all;

  return (
    <ScrollView contentContainerStyle={{ paddingVertical: spacing.md }}>
      {me.role === 'business' ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.screen, paddingBottom: spacing.sm }}>
          <Chip label="All" selected={show === 'all'} onPress={() => setShow('all')} />
          <Chip label="Applicants" selected={show === 'applicants'} onPress={() => setShow('applicants')} />
          <Chip label="DMs" selected={show === 'casual'} onPress={() => setShow('casual')} />
        </View>
      ) : null}
      {show === 'applicants' ? (
        <ApplicantsList me={me} threads={all} />
      ) : (
        <>
          {threads.loading && !threads.data ? <Loading /> : null}
          {threads.error ? <ErrorNote message={threads.error} /> : null}
          {threads.data && all.length === 0 ? <Empty title="No messages yet" /> : null}
          {threads.data && all.length > 0 && list.length === 0 ? <Empty title="No DMs" /> : null}
          {list.map((t) => (
            <ThreadRow key={t.id} thread={t} me={me} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

// Business: who applied, newest first. Tap someone to open the chat.
// Narrow by job post and follower size; both default to everything.
function ApplicantsList({ me, threads }: { me: Profile; threads: ThreadWithPeople[] }) {
  const applications = useApplications(me);
  const [postId, setPostId] = useState<string>('all');
  const [size, setSize] = useState(0);
  const all = [...(applications.data ?? [])].sort((a, b) => b.createdAt - a.createdAt);
  const posts = new Map(all.map((a) => [a.postId, a.post.caption]));
  const band = sizes[size];
  const list = all.filter((a) => (postId === 'all' || a.postId === postId) && (size === 0 || ((a.creator.followers ?? 0) >= band.min && (a.creator.followers ?? 0) <= band.max)));
  const threadById = new Map(threads.map((t) => [t.id, t]));

  return (
    <View>
      {all.length ? (
        <View style={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.screen }}>
            <Chip label="All jobs" selected={postId === 'all'} onPress={() => setPostId('all')} />
            {[...posts].map(([id, title]) => (
              <Chip key={id} label={title} selected={postId === id} onPress={() => setPostId(id)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.screen }}>
            {sizes.map((b, i) => (
              <Chip key={b.label} label={b.label} selected={size === i} onPress={() => setSize(i)} />
            ))}
          </ScrollView>
        </View>
      ) : null}
      {applications.loading && !applications.data ? <Loading /> : null}
      {applications.error ? <ErrorNote message={applications.error} /> : null}
      {applications.data && all.length === 0 ? <Empty title="No applicants yet" note="Creators who apply to your jobs show up here." /> : null}
      {all.length > 0 && list.length === 0 ? <Empty title="No applicants match" /> : null}
      {list.map((a) => {
        const t = threadById.get(a.threadId);
        const status = t ? conversationLabel(t, me.role) : null;
        return (
          <Pressable
            key={a.id}
            onPress={() => router.push(`/chat/${a.threadId}`)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.screen, paddingVertical: spacing.sm, backgroundColor: pressed ? colors.buttonFill : 'transparent' })}
          >
            <Avatar uri={a.creator.avatar} initials={a.creator.initials} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[type.bodyStrong, { flexShrink: 1 }]} numberOfLines={1}>
                  {a.creator.name}
                </Text>
                <Verified profile={a.creator} size={13} />
                <Text style={[type.small, { fontSize: 12, marginLeft: 'auto' }]}>{timeAgo(a.createdAt)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={[type.small, { fontSize: 12, flex: 1 }]} numberOfLines={1}>
                  {[a.creator.followers != null ? `${formatFollowers(a.creator.followers)} followers` : null, a.post.caption].filter(Boolean).join(' · ')}
                </Text>
                {status ? <StatusPill {...status} /> : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ThreadRow({ thread, me }: { thread: ThreadWithPeople; me: Profile }) {
  const other = me.role === 'creator' ? thread.business : thread.creator;
  const status = conversationLabel(thread, me.role);
  const applied = thread.applications.map((a) => a.title).join(', ');
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
        {applied ? (
          <Text style={[type.small, { fontSize: 12, color: colors.accentPressed }]} numberOfLines={1}>
            {me.role === 'creator' ? 'You applied' : 'Applied'}: {applied}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={[type.small, { flex: 1 }]} numberOfLines={1}>
            {thread.lastMessage ?? ''}
          </Text>
          {status ? <StatusPill {...status} /> : null}
        </View>
      </View>
    </Pressable>
  );
}
