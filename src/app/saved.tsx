// Saved: posts you bookmarked to look at later.
// Creators see two tabs, Jobs and Videos, so job posts and reference videos stay apart.
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, Empty, Loading, PostTile, TopBar } from '../components';
import { setLastFeed, useSavedPosts } from '../data/hooks';
import { useMe } from '../data/session';
import { colors, spacing } from '../theme';

export default function Saved() {
  const me = useMe();
  const saved = useSavedPosts(me);
  const [tab, setTab] = useState<'job' | 'video'>(me.role === 'creator' ? 'job' : 'video');
  const posts = (saved.data ?? []).filter((p) => p.kind === tab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TopBar title="Saved" />
      {me.role === 'creator' ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.screen, paddingBottom: spacing.sm }}>
          <Chip label="Jobs" selected={tab === 'job'} onPress={() => setTab('job')} />
          <Chip label="Videos" selected={tab === 'video'} onPress={() => setTab('video')} />
        </View>
      ) : null}
      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.sm, paddingBottom: spacing.xxl }}>
        {saved.loading && !saved.data ? <Loading /> : null}
        {saved.data && posts.length === 0 ? (
          <Empty
            title={tab === 'job' ? 'No saved jobs' : 'No saved videos'}
            note={tab === 'job' ? 'Tap the bookmark on a job post to save it.' : 'Tap the bookmark on a video to keep it for reference.'}
          />
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.lg }}>
          {posts.map((post) => (
            <View key={post.id} style={{ width: '48.5%' }}>
              <PostTile
                post={post}
                onPress={() => {
                  setLastFeed(posts);
                  router.push({ pathname: '/reels', params: { start: post.id } });
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
