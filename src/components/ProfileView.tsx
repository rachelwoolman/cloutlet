// A creator's or business's profile, exactly as other people see it.
// Used by profile/[id] and by the Profile tab (your own profile, with a Settings button).
// Creators see a bell on business profiles: turn it on to get an update when they post a job.
// Business profiles: "Active jobs" (the 3 newest, View all opens the full list with Archived),
// then their collab videos. On your own profile a job opens Manage post; for others it opens the post.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatFollowers, offeredServices, priceFor } from '../data/catalog';
import { backend, setLastFeed, useFollowingIds, useOffers, usePostsFor, useProfile } from '../data/hooks';
import { applicationCountLabel, jobSummary, payLabel } from '../data/jobs';
import { openChat, requestCollab } from '../lib/openChat';
import { useMe } from '../data/session';
import { FeedPost, Profile } from '../data/types';
import { colors, radius, spacing, type } from '../theme';
import { Button } from './Button';
import { Card } from './Card';
import { ProfileAvatar } from './CreatorStatus';
import { isOpenOffer } from './OfferSummary';
import { Photo } from './Photo';
import { PostTile } from './PostTile';
import { Empty, Loading } from './States';
import { Divider, TopBar } from './TopBar';
import { Verified } from './Verified';

const GRID_PREVIEW = 6; // more than this: "Show all"

export function ProfileView({ id, asTab = false }: { id: string; asTab?: boolean }) {
  const me = useMe();
  const profile = useProfile(id);
  const posts = usePostsFor(id);
  const following = useFollowingIds(me);
  const offers = useOffers(me);
  const [showAllGrid, setShowAllGrid] = useState(false);
  const p = profile.data;

  if (!p) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar hideBack={asTab} />
        {profile.loading ? <Loading /> : <Empty title="Profile not found" />}
      </SafeAreaView>
    );
  }

  const isMe = p.id === me.id;
  const canFollow = me.role === 'creator' && p.role === 'business';
  const isFollowing = (following.data ?? []).includes(p.id);
  const canDeal = p.role !== me.role;
  // A casual message: the chat is only created when you send something
  const message = () => openChat(me, p.id, { via: 'feed' });
  // Business looking at a creator it already has an open offer with: change that offer instead of a new one
  const openOfferToThem = me.role === 'business' && (offers.data ?? []).some((o) => o.creatorId === p.id && isOpenOffer(o));
  const isBusiness = p.role === 'business';
  // Newest first. Archived jobs only show on the full jobs list (owner only).
  const activeJobs = isBusiness ? (posts.data ?? []).filter((x) => x.kind === 'job' && x.authorId === p.id && !x.archived).sort((a, b) => b.createdAt - a.createdAt) : [];
  const gridPosts = isBusiness ? (posts.data ?? []).filter((x) => x.kind === 'video') : (posts.data ?? []);
  const shownGrid = showAllGrid ? gridPosts : gridPosts.slice(0, GRID_PREVIEW);
  const openJob = (j: FeedPost) => {
    if (isMe) return router.push(`/post/${j.id}`);
    setLastFeed(activeJobs);
    router.push({ pathname: '/reels', params: { start: j.id } });
  };
  // Creator looking at a business that already sent them an offer: point to the Inbox, no offer buttons here
  const openOfferFromThem = me.role === 'creator' && p.role === 'business' && (offers.data ?? []).some((o) => o.businessId === p.id && isOpenOffer(o));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TopBar
        title={p.handle}
        hideBack={asTab}
        right={
          isMe ? (
            <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityLabel="Settings">
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          ) : canFollow ? (
            <BellButton on={isFollowing} name={p.name} onChange={(on) => backend.setFollowing(me, p.id, on)} />
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {p.role === 'business' && p.cover ? (
          <Photo uri={p.cover} style={{ height: 140, marginHorizontal: spacing.screen, borderRadius: radius.lg }} />
        ) : null}

        <View style={{ alignItems: 'center', paddingHorizontal: spacing.screen, gap: spacing.xs, marginTop: p.cover ? -36 : 0 }}>
          <View style={{ borderWidth: 3, borderColor: colors.background, borderRadius: p.role === 'business' ? radius.lg : 999 }}>
            <ProfileAvatar profile={p} size={80} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: spacing.sm }}>
            <Text style={type.h1}>{p.name}</Text>
            <Verified profile={p} size={20} />
          </View>
          <Text style={type.small}>
            {[p.kind ?? p.niche, p.neighborhood].filter(Boolean).join(' · ')}
          </Text>
          {p.bio ? <Text style={[type.body, { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xs }]}>{p.bio}</Text> : null}
        </View>

        <View style={{ paddingHorizontal: spacing.screen, marginTop: spacing.xl, gap: spacing.lg }}>
          <View>
            <Divider />
            <StatsRow profile={p} />
            <Divider />
          </View>

          {p.role === 'creator' && p.followers != null ? (
            <View>
              <Text style={[type.label, { marginBottom: spacing.sm }]}>Rates</Text>
              {offeredServices(p).map((s) => {
                const price = priceFor(s.id, p.followers!);
                return (
                  <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                    <Text style={type.body}>{s.name}</Text>
                    <Text style={type.bodyStrong}>{price === null ? 'Ask' : `$${price}`}</Text>
                  </View>
                );
              })}
              {p.openToPerksOnly ? <Text style={[type.small, { marginTop: spacing.xs }]}>Open to perks-only deals.</Text> : null}
            </View>
          ) : null}

          {openOfferFromThem ? (
            <Pressable
              onPress={() => router.push('/inbox')}
              accessibilityRole="button"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.buttonFill, opacity: pressed ? 0.7 : 1 })}
            >
              <Ionicons name="mail-unread-outline" size={18} color={colors.textSecondary} />
              <Text style={[type.small, { flex: 1, color: colors.text }]}>This business has already sent you an offer. Check your inbox.</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          ) : null}

          {canDeal ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {me.role === 'business' ? <Button title={openOfferToThem ? 'Update offer' : 'Request collab'} style={{ flex: 1 }} onPress={() => requestCollab(me, p)} /> : null}
              <Button title="Message" variant={me.role === 'business' ? 'secondary' : 'primary'} style={me.role === 'business' ? undefined : { flex: 1 }} onPress={message} />
            </View>
          ) : null}


          {/* Business, own profile: its job posts, with applicants. Tap one to manage it. */}
          {isBusiness && (activeJobs.length || isMe) ? (
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={type.label}>Active jobs</Text>
                {isMe ? <Button title="New job" variant="ghost" size="sm" onPress={() => router.push('/new-job')} /> : null}
              </View>
              {posts.data && activeJobs.length === 0 ? <Text style={type.small}>No active jobs.</Text> : null}
              {activeJobs.slice(0, 3).map((j) => (
                <Card key={j.id} onPress={() => openJob(j)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
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
              {/* Owners always get the link, so archived jobs are reachable */}
              {activeJobs.length > 3 || isMe ? <Button title={activeJobs.length > 3 ? `View all ${activeJobs.length}` : 'View all and archived'} variant="ghost" size="sm" onPress={() => router.push(`/jobs/${p.id}`)} /> : null}
            </View>
          ) : null}

          <Text style={[type.label, { marginTop: spacing.md }]}>{isBusiness ? 'Collab videos' : 'Posts'}</Text>
          {posts.loading && !posts.data ? <Loading /> : null}
          {posts.data && gridPosts.length === 0 ? <Empty title={isBusiness ? 'No collab videos yet' : 'No posts yet'} /> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.lg }}>
            {shownGrid.map((post) => (
              <View key={post.id} style={{ width: '48.5%' }}>
                <PostTile
                  post={post}
                  onPress={() => {
                    setLastFeed(gridPosts);
                    router.push({ pathname: '/reels', params: { start: post.id } });
                  }}
                />
              </View>
            ))}
          </View>
          {gridPosts.length > GRID_PREVIEW ? (
            <Button title={showAllGrid ? 'Show fewer' : `Show all ${gridPosts.length}`} variant="ghost" size="sm" onPress={() => setShowAllGrid((v) => !v)} />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// One row of numbers. Creators: followers on each connected account, then collabs on Cloutlet.
// Businesses: Google rating (blue star, opens their Google reviews), Cloutlet rating (orange star,
// opens Cloutlet reviews), then collabs.
function StatsRow({ profile: p }: { profile: Profile }) {
  const cells: { key: string; icon?: keyof typeof Ionicons.glyphMap; iconColor?: string; value: string; label: string; onPress?: () => void }[] = [];
  if (p.role === 'creator') {
    if (p.instagram) cells.push({ key: 'ig', icon: 'logo-instagram', value: p.instagram.followers != null ? formatFollowers(p.instagram.followers) : '—', label: 'followers' });
    if (p.tiktok) cells.push({ key: 'tt', icon: 'logo-tiktok', value: p.tiktok.followers != null ? formatFollowers(p.tiktok.followers) : '—', label: 'followers' });
  } else {
    if (p.google?.rating) {
      const n = p.google.reviewCount ?? 0;
      cells.push({ key: 'google', icon: 'star', iconColor: colors.google, value: p.google.rating.toFixed(1), label: `${n.toLocaleString('en-US')} Google ${n === 1 ? 'review' : 'reviews'}`, onPress: () => openGoogleReviews(p) });
    }
    const r = p.rating;
    cells.push({
      key: 'cloutlet',
      icon: 'star',
      iconColor: colors.accent,
      value: r ? r.average.toFixed(1) : 'New',
      label: r ? `${r.count} Cloutlet ${r.count === 1 ? 'review' : 'reviews'}` : 'No Cloutlet reviews',
      onPress: () => router.push(`/reviews/${p.id}`),
    });
  }
  cells.push({ key: 'collabs', value: String(p.collabs), label: p.collabs === 1 ? 'collab' : 'collabs' });

  return (
    <View style={{ flexDirection: 'row', paddingVertical: spacing.md }}>
      {cells.map(({ key, ...c }) => (
        <Stat key={key} {...c} />
      ))}
    </View>
  );
}

// Their reviews on Google Maps, in an in-app browser. Free: no Google API or billing needed.
function openGoogleReviews(p: Profile) {
  const q = encodeURIComponent([p.name, p.google?.address].filter(Boolean).join(' '));
  const placeId = p.google?.placeId && !p.google.placeId.startsWith('demo-') ? `&query_place_id=${encodeURIComponent(p.google.placeId)}` : '';
  WebBrowser.openBrowserAsync(`https://www.google.com/maps/search/?api=1&query=${q}${placeId}`);
}

function Stat({ icon, iconColor = colors.text, value, label, onPress }: { icon?: keyof typeof Ionicons.glyphMap; iconColor?: string; value: string; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 2, opacity: pressed ? 0.6 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null}
        <Text style={[type.bodyStrong, { fontSize: 17 }]}>{value}</Text>
      </View>
      <Text style={[type.small, { fontSize: 12, textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  );
}

// The bell on a business profile. Turning it on fills it orange with a quick shake, so it's clear it worked.
function BellButton({ on, name, onChange }: { on: boolean; name: string; onChange: (on: boolean) => void }) {
  const [tilt] = useState(() => new Animated.Value(0));
  const press = () => {
    onChange(!on);
    if (on) return; // only shake when turning on
    tilt.setValue(0);
    const step = (to: number) => Animated.timing(tilt, { toValue: to, duration: 70, useNativeDriver: Platform.OS !== 'web' });
    Animated.sequence([step(1), step(-1), step(0.7), step(-0.7), step(0.3), step(0)]).start();
  };
  const rotate = tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });
  return (
    <Pressable onPress={press} hitSlop={10} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={`Job updates from ${name}`}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name={on ? 'notifications' : 'notifications-outline'} size={22} color={on ? colors.accent : colors.text} />
      </Animated.View>
    </Pressable>
  );
}
