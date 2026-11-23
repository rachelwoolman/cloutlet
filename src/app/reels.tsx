// Full-screen vertical viewer. Swipe up/down, one post per screen, like Reels.
// Opens at the post you tapped, in the same order as Explore.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, ListViewToken, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Loading, Reel } from '../components';
import { backend, getLastFeed, markSeen, useFeed, useSavedIds } from '../data/hooks';
import { useMe } from '../data/session';
import { FeedPost } from '../data/types';
import { useMouseSwipe } from '../lib/useMouseSwipe';
import { colors, spacing } from '../theme';

export default function Reels() {
  const me = useMe();
  const { start } = useLocalSearchParams<{ start?: string }>();
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const height = size.height;
  const saved = useSavedIds(me);
  const savedIds = new Set(saved.data ?? []);

  // Use the exact list Explore showed; if the app was opened straight here, load it
  const shared = useMemo(() => getLastFeed(), []);
  const fallback = useFeed(me);
  const posts: FeedPost[] = shared.length ? shared : (fallback.data ?? []);

  const startIndex = Math.max(0, posts.findIndex((p) => p.id === start));
  const [active, setActive] = useState(startIndex);
  const list = useRef<FlatList<FeedPost>>(null);
  useMouseSwipe(list, height, active, posts.length);

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) {
      setActive(first.index);
      markSeen((first.item as FeedPost).id);
    }
  }, []);

  const message = useCallback(
    async (otherId: string, draft?: string) => {
      const threadId = await backend.openThread(me, otherId);
      router.push({ pathname: '/chat/[id]', params: { id: threadId, ...(draft ? { draft } : {}) } });
    },
    [me],
  );

  // Anyone can save someone else's video to look at later. Creators can also save job posts.
  const saveProps = (item: FeedPost) => {
    const canSave = item.authorId !== me.id && (item.kind === 'video' || me.role === 'creator');
    return { canSave, saved: savedIds.has(item.id), onToggleSave: (on: boolean) => backend.setSaved(me, item.id, on) };
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.reelBackground }} onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {height === 0 || posts.length === 0 ? (
        <Loading />
      ) : (
        <FlatList
          ref={list}
          data={posts}
          keyExtractor={(p) => p.id}
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          renderItem={({ item, index }) => (
            <Reel
              post={item}
              me={me}
              active={index === active}
              width={size.width}
              height={height}
              topInset={insets.top}
              bottomInset={insets.bottom}
              {...saveProps(item)}
              onOpenReviews={(id) => router.push(`/reviews/${id}`)}
              onOpenProfile={(id) => router.push(`/profile/${id}`)}
              onMessage={message}
              onRequest={(id) => router.push(`/request/${id}`)}
              onLike={(id) => backend.likePost(id)}
            />
          )}
        />
      )}

      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))}
        hitSlop={12}
        accessibilityLabel="Close"
        style={{ position: 'absolute', top: insets.top + spacing.sm, left: spacing.md, padding: spacing.sm }}
      >
        <Ionicons name="close" size={28} color={colors.reelText} />
      </Pressable>
    </View>
  );
}
