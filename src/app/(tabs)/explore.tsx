// Explore: the same feed for creators and businesses.
// Creator videos + business job posts, ranked by src/data/rank.ts.
// Tap any post to open the full-screen vertical viewer.
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, Empty, ErrorNote, Loading, MasonryFeed, PostTile, tileHeight } from '../../components';
import { setLastFeed, useFeed, useFollowingIds } from '../../data/hooks';
import { distanceMiles } from '../../data/rank';
import { useMe } from '../../data/session';
import { FeedPost } from '../../data/types';
import { colors, fonts, radius, spacing } from '../../theme';

const NEARBY_MILES = 2;

const filters = ['For you', 'Jobs', 'Collabs', 'Nearby'] as const;
type Filter = (typeof filters)[number] | 'Following';

export default function Explore() {
  const me = useMe();
  const feed = useFeed(me, { rememberTop: true });
  const following = useFollowingIds(me);
  const followingIds = new Set(following.data ?? []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('For you');

  const q = query.trim().toLowerCase();
  const items = (feed.data ?? []).filter((p) => {
    if (filter === 'Jobs' && p.kind !== 'job') return false;
    if (filter === 'Collabs' && !(p.collabBusinessId || p.collabCreatorId)) return false;
    // Bell: only businesses you turned the bell on for
    if (filter === 'Following' && !followingIds.has(p.authorId)) return false;
    if (filter === 'Nearby') {
      const where = p.collabBusiness?.location ?? p.author.location;
      if (!me.location || !where || distanceMiles(me.location, where) > NEARBY_MILES) return false;
    }
    if (!q) return true;
    return [p.caption, p.job?.description, p.author.name, p.author.neighborhood, p.author.niche, p.author.kind, p.collabBusiness?.name]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const open = (post: FeedPost) => {
    setLastFeed(items);
    router.push({ pathname: '/reels', params: { start: post.id } });
  };

  const header = (
    <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 26, color: colors.text }}>cloutlet</Text>
        {me.role === 'business' ? (
          <Pressable
            onPress={() => router.push('/new-job')}
            hitSlop={10}
            accessibilityLabel="Post a job"
            style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.accentPressed : colors.accent })}
          >
            <Feather name="plus" size={20} color={colors.onAccent} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 44, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.buttonFill }}>
        <Feather name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search spots, creators, neighborhoods"
          placeholderTextColor={colors.textSecondary}
          style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text, outlineStyle: 'none' } as any}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Feather name="x" size={16} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {filters.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
        {me.role === 'creator' ? (
          <Chip
            icon={filter === 'Following' ? 'notifications' : 'notifications-outline'}
            accessibilityLabel="From businesses you turned the bell on for"
            selected={filter === 'Following'}
            onPress={() => setFilter('Following')}
          />
        ) : null}
      </ScrollView>

      {feed.loading && !feed.data ? <Loading /> : null}
      {feed.error ? <ErrorNote message={feed.error} /> : null}
      {feed.data && items.length === 0 ? <Empty
          title="Nothing here yet"
          note={q ? 'Try another search.' : filter === 'Following' ? 'Turn on the bell on a business’s profile to see their posts here.' : 'Check back soon.'}
        /> : null}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <MasonryFeed
        items={items}
        header={header}
        getHeight={(p) => tileHeight(p) + (p.kind === 'video' ? 60 : 0)}
        keyExtractor={(p) => p.id}
        renderItem={(p) => <PostTile post={p} onPress={() => open(p)} />}
        refreshing={feed.loading && Boolean(feed.data)}
        onRefresh={feed.reload}
      />
    </SafeAreaView>
  );
}
