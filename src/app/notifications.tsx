// Notifications (Settings): the businesses you turned the bell on for, each with a switch.
// Turning one off keeps it in the list until you leave, so you can switch it back on.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Divider, Empty, Loading, Toggle, TopBar, Verified } from '../components';
import { backend, useBusinesses, useFollowingIds } from '../data/hooks';
import { useMe } from '../data/session';
import { colors, spacing, type } from '../theme';

export default function Notifications() {
  const me = useMe();
  const following = useFollowingIds(me);
  const businesses = useBusinesses();
  const on = new Set(following.data ?? []);

  // Who's listed: everyone followed when you opened this screen, plus anyone turned on since
  const [listed, setListed] = useState<string[] | null>(null);
  if (listed === null && following.data) setListed(following.data);
  const ids = [...new Set([...(listed ?? []), ...on])];
  const rows = ids.map((id) => (businesses.data ?? []).find((b) => b.id === id)).filter((b) => b !== undefined);

  const loading = (following.loading && !following.data) || (businesses.loading && !businesses.data);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TopBar title="Notifications" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text style={[type.small, { paddingHorizontal: spacing.screen, paddingBottom: spacing.sm }]}>Job updates show up in Inbox › Updates.</Text>
        {loading ? <Loading /> : null}
        {!loading && rows.length === 0 ? <Empty title="No notifications on" note="Tap the bell on a business’s profile to get their job updates." /> : null}
        {rows.map((b, i) => (
          <View key={b.id}>
            {i > 0 ? <Divider /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.screen, paddingVertical: spacing.md }}>
              <Pressable onPress={() => router.push(`/profile/${b.id}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar uri={b.avatar} initials={b.initials} size={44} shape="square" />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={[type.bodyStrong, { flexShrink: 1 }]} numberOfLines={1}>
                      {b.name}
                    </Text>
                    <Verified profile={b} size={14} />
                  </View>
                  <Text style={type.small} numberOfLines={1}>
                    {[b.kind, b.neighborhood].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </Pressable>
              <Toggle value={on.has(b.id)} onChange={(v) => backend.setFollowing(me, b.id, v)} label={`Job updates from ${b.name}`} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
