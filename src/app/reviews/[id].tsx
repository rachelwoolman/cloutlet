// Cloutlet reviews for a business: a summary (average, stars, 5-to-1 breakdown),
// then each review from a creator who closed a deal with them.
// Opened from the star on a job post, or the Cloutlet rating on their profile.
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Divider, Empty, Loading, TopBar, Verified } from '../../components';
import { getService, timeAgo } from '../../data/catalog';
import { useProfile, useReviews } from '../../data/hooks';
import { colors, fonts, radius, spacing, type } from '../../theme';

export default function Reviews() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile(id);
  const reviews = useReviews(id);
  const p = profile.data;
  const list = reviews.data ?? [];
  const avg = list.length ? list.reduce((n, r) => n + r.stars, 0) / list.length : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TopBar title="Cloutlet reviews" />
      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.xl }}>
        {p ? (
          <Pressable onPress={() => router.push(`/profile/${p.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Avatar uri={p.avatar} initials={p.initials} size={44} shape={p.role === 'business' ? 'square' : 'circle'} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={type.h3}>{p.name}</Text>
                <Verified profile={p} size={16} />
              </View>
              <Text style={type.small}>{[p.kind, p.neighborhood].filter(Boolean).join(' · ')}</Text>
            </View>
          </Pressable>
        ) : null}

        {reviews.loading && !reviews.data ? <Loading /> : null}

        {reviews.data && list.length === 0 ? (
          <Empty title="No reviews yet" note="Creators can leave a review after a deal on Cloutlet." />
        ) : null}

        {list.length ? (
          <View style={{ flexDirection: 'row', gap: spacing.xl, alignItems: 'center' }}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 48, lineHeight: 52, color: colors.text }}>{avg.toFixed(1)}</Text>
              <Stars value={avg} size={14} />
              <Text style={[type.small, { fontSize: 12 }]}>
                {list.length} {list.length === 1 ? 'review' : 'reviews'}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              {[5, 4, 3, 2, 1].map((n) => {
                const c = list.filter((r) => r.stars === n).length;
                return (
                  <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={[type.small, { fontSize: 12, width: 10, textAlign: 'right' }]}>{n}</Text>
                    <View style={{ flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.buttonFill, overflow: 'hidden' }}>
                      <View style={{ width: `${(c / list.length) * 100}%`, height: '100%', backgroundColor: colors.accent }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {list.length ? (
          <View>
            {list.map((r, i) => (
              <View key={r.id}>
                {i > 0 ? <Divider /> : null}
                <View style={{ paddingVertical: spacing.lg, gap: spacing.sm }}>
                  <Pressable onPress={() => router.push(`/profile/${r.reviewer.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Avatar uri={r.reviewer.avatar} initials={r.reviewer.initials} size={36} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text style={type.bodyStrong}>{r.reviewer.name}</Text>
                        <Verified profile={r.reviewer} size={14} />
                      </View>
                      <Text style={[type.small, { fontSize: 12 }]}>
                        {ago(r.createdAt)}{r.serviceId ? ` · ${getService(r.serviceId).name}` : ''}
                      </Text>
                    </View>
                    <Stars value={r.stars} size={13} />
                  </Pressable>
                  {r.body ? <Text style={type.body}>{r.body}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {list.length ? <Text style={[type.small, { textAlign: 'center' }]}>Only creators who closed a deal with them can leave a review.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const ago = (ms: number) => {
  const t = timeAgo(ms);
  return t === 'Just now' ? t : `${t} ago`;
};

function Stars({ value, size }: { value: number; size: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }} accessibilityLabel={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={value >= n - 0.25 ? 'star' : value >= n - 0.75 ? 'star-half' : 'star-outline'} size={size} color={colors.accent} />
      ))}
    </View>
  );
}
