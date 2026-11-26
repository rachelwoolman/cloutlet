// Business > Manage post: one of its job posts, with who applied, the numbers we really measure,
// Edit, and Archive (hides it from the feed; it stays under Archived on the jobs list).
// Opened from Active jobs on the business's profile, the jobs list, or "Manage post" on the post.
// Applicants are only creators who sent an application message; tapping Apply alone isn't recorded.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Divider, Empty, Loading, StatusPill, TopBar, Verified } from '../../components';
import { formatFollowers, timeAgo } from '../../data/catalog';
import { conversationLabel } from '../../data/deals';
import { backend, setLastFeed, useApplications, usePost, useThreads } from '../../data/hooks';
import { hiresLabel, jobSummary, payLabel } from '../../data/jobs';
import { useMe } from '../../data/session';
import { colors, spacing, type } from '../../theme';

export default function ManagePost() {
  const me = useMe();
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const applications = useApplications(me);
  const threads = useThreads(me);
  const p = post.data;

  if (!p) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar />
        {post.loading ? <Loading /> : <Empty title="Job post not found" />}
      </SafeAreaView>
    );
  }
  if (p.authorId !== me.id || !p.job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar />
        <Empty title="Only the business that posted this can manage it" />
      </SafeAreaView>
    );
  }

  const job = p.job;
  const applicants = (applications.data ?? []).filter((a) => a.postId === p.id);
  const threadById = new Map((threads.data ?? []).map((t) => [t.id, t]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TopBar title="Manage post" />
      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing.xxl }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={type.h1}>{p.caption}</Text>
          <Text style={type.small}>{jobSummary(job)}</Text>
          <Text style={[type.small, { color: colors.text }]}>
            {payLabel(job)}
            {hiresLabel(job) ? ` · ${hiresLabel(job)}` : ''}
          </Text>
          <Text style={[type.small, { fontSize: 12 }]}>
            Posted {ago(p.createdAt)}
            {p.archived ? ' · Archived' : ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <Button title="Edit" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push(`/edit-job/${p.id}`)} />
            <Button title={p.archived ? 'Reopen' : 'Archive'} variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => backend.setArchived(me, p.id, !p.archived)} />
            <Button
              title="View post"
              variant="secondary"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => {
                setLastFeed([p]);
                router.push({ pathname: '/reels', params: { start: p.id } });
              }}
            />
          </View>
        </View>

        {/* Only numbers we actually record */}
        <View style={{ gap: spacing.sm }}>
          <Text style={type.label}>Stats</Text>
          <Card style={{ padding: 0 }}>
            <StatRow label="Views" value={String(p.viewCount ?? 0)} />
            <Divider />
            <StatRow label="Applications" value={String(p.applicationCount ?? applicants.length)} />
          </Card>
          <Text style={[type.small, { fontSize: 12 }]}>Views: people who opened this job, once a day each, counted since view tracking started. Applications: messages sent with Apply.</Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={type.label}>Applicants</Text>
          {applications.loading && !applications.data ? <Loading /> : null}
          {applications.data && applicants.length === 0 ? <Empty title="No applications yet" note="Creators who send an application to this post show up here." /> : null}
          {applicants.map((a) => {
            const t = threadById.get(a.threadId);
            const status = t ? conversationLabel(t, me.role) : null;
            return (
              <Pressable
                key={a.id}
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: a.threadId } })}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, opacity: pressed ? 0.7 : 1 })}
              >
                <Avatar uri={a.creator.avatar} initials={a.creator.initials} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[type.bodyStrong, { flexShrink: 1 }]} numberOfLines={1}>
                      {a.creator.name}
                    </Text>
                    <Verified profile={a.creator} size={13} />
                  </View>
                  <Text style={[type.small, { fontSize: 12 }]} numberOfLines={1}>
                    {[a.creator.niche, a.creator.followers != null ? `${formatFollowers(a.creator.followers)} followers` : null, `applied ${ago(a.createdAt)}`].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {status ? <StatusPill {...status} /> : null}
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// "3h ago", "just now"
function ago(ms: number) {
  const t = timeAgo(ms);
  return t === 'Just now' ? 'just now' : `${t} ago`;
}

function StatRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg }}>
      <Text style={type.body}>{label}</Text>
      <Text style={muted ? type.small : type.bodyStrong}>{value}</Text>
    </View>
  );
}
