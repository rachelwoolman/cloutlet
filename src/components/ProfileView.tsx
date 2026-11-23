// A creator's or business's profile, exactly as other people see it.
// Used by profile/[id] and by the Profile tab (your own profile, with a Settings button).
// Creators see a bell on business profiles: turn it on to get an update when they post a job.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatFollowers, offeredServices, priceFor } from '../data/catalog';
import { backend, setLastFeed, useFollowingIds, usePostsFor, useProfile } from '../data/hooks';
import { useMe } from '../data/session';
import { Profile } from '../data/types';
import { colors, radius, spacing, type } from '../theme';
import { Button } from './Button';
import { ProfileAvatar } from './CreatorStatus';
import { Photo } from './Photo';
import { PostTile } from './PostTile';
import { Empty, Loading } from './States';
import { Divider, TopBar } from './TopBar';
import { Verified } from './Verified';

export function ProfileView({ id, asTab = false }: { id: string; asTab?: boolean }) {
  const me = useMe();
  const profile = useProfile(id);
  const posts = usePostsFor(id);
  const following = useFollowingIds(me);
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
  const message = async () => router.push(`/chat/${await backend.openThread(me, p.id)}`);

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

          {canDeal ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {me.role === 'business' ? <Button title="Request collab" style={{ flex: 1 }} onPress={() => router.push(`/request/${p.id}`)} /> : null}
              <Button title="Message" variant={me.role === 'business' ? 'secondary' : 'primary'} style={me.role === 'business' ? undefined : { flex: 1 }} onPress={message} />
            </View>
          ) : null}


          <Text style={[type.label, { marginTop: spacing.md }]}>Posts</Text>
          {posts.loading && !posts.data ? <Loading /> : null}
          {posts.data && posts.data.length === 0 ? <Empty title="No posts yet" /> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.lg }}>
            {(posts.data ?? []).map((post) => (
              <View key={post.id} style={{ width: '48.5%' }}>
                <PostTile
                  post={post}
                  onPress={() => {
                    setLastFeed(posts.data ?? []);
                    router.push({ pathname: '/reels', params: { start: post.id } });
                  }}
                />
              </View>
            ))}
          </View>
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
