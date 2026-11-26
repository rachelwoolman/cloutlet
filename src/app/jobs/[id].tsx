// A business's job posts, newest first ("View all" under Active jobs on its profile).
// The business itself also sees Archived (jobs it closed); others only see active ones.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, Empty, Loading, TopBar } from '../../components';
import { setLastFeed, usePostsFor, useProfile } from '../../data/hooks';
import { applicationCountLabel, jobSummary, payLabel } from '../../data/jobs';
import { useMe } from '../../data/session';
import { colors, spacing, type } from '../../theme';

export default function Jobs() {
  const me = useMe();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile(id);
  const posts = usePostsFor(id);
  const [show, setShow] = useState<'active' | 'archived'>('active');
  const isMe = id === me.id;

  const jobs = (posts.data ?? []).filter((p) => p.kind === 'job' && p.authorId === id).sort((a, b) => b.createdAt - a.createdAt);
  const active = jobs.filter((j) => !j.archived);
  const archived = jobs.filter((j) => j.archived);
  const list = isMe && show === 'archived' ? archived : active;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TopBar title={isMe ? 'Your jobs' : `${profile.data?.name ?? ''} jobs`.trim()} />
      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xxl }}>
        {isMe ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Chip label={`Active · ${active.length}`} selected={show === 'active'} onPress={() => setShow('active')} />
            <Chip label={`Archived · ${archived.length}`} selected={show === 'archived'} onPress={() => setShow('archived')} />
          </View>
        ) : null}
        {posts.loading && !posts.data ? <Loading /> : null}
        {posts.data && list.length === 0 ? <Empty title={show === 'archived' ? 'No archived jobs' : 'No active jobs'} /> : null}
        {list.map((j) => (
          <Card
            key={j.id}
            onPress={() => {
              if (isMe) return router.push(`/post/${j.id}`);
              setLastFeed(active);
              router.push({ pathname: '/reels', params: { start: j.id } });
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={type.bodyStrong} numberOfLines={1}>
                {j.caption}
              </Text>
              <Text style={[type.small, { fontSize: 12 }]} numberOfLines={1}>
                {j.job ? `${jobSummary(j.job)} · ${payLabel(j.job)}` : ''}
              </Text>
            </View>
            {isMe ? <Text style={[type.small, { color: colors.text }]}>{applicationCountLabel(j.applicationCount, true)}</Text> : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
