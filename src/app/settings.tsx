// Settings (gear on your profile). Everything about your account lives here, and only here:
// Saved, status and pitch (creators), portfolio (creators), verification, location, sign out.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, CheckBadge, Divider, MyCreatorSettings, ToggleRow, TopBar } from '../components';
import { isVerified } from '../data/catalog';
import { useLocationStatus } from '../data/location';
import { signOut, useMe } from '../data/session';
import { isLive } from '../lib/config';
import { colors, spacing, type } from '../theme';

export default function Settings() {
  const me = useMe();
  const location = useLocationStatus(me);

  const checks =
    me.role === 'creator'
      ? [
          { label: 'Instagram', done: Boolean(me.instagram), detail: me.instagram ? `@${me.instagram.username}` : 'Not connected' },
          { label: 'TikTok', done: Boolean(me.tiktok), detail: me.tiktok ? `@${me.tiktok.username}` : 'Not connected' },
        ]
      : [
          { label: 'Google listing', done: Boolean(me.google), detail: me.google?.address ?? 'Not picked' },
          { label: 'Owner verified', done: Boolean(me.google?.ownerVerified), detail: me.google?.ownerVerified ? 'Verified' : 'Not yet' },
        ];

  const leave = async () => {
    await signOut();
    router.replace('/');
  };

  const locationNote =
    location.status === 'listing'
      ? 'Using your Google listing’s address'
      : location.status === 'blocked'
        ? Platform.OS === 'web'
          ? 'Blocked. Allow location in your browser settings.'
          : 'Blocked. Allow it in your phone’s Settings.'
        : 'Shows spots near you. Saved within about half a mile.';

  const onLocation = (on: boolean) => {
    if (on && location.status === 'blocked' && Platform.OS !== 'web') Linking.openSettings();
    else location.setEnabled(on);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TopBar title="Settings" />
      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.sm, gap: spacing.xl, paddingBottom: spacing.xxl }}>
        {/* Saved first: the most common reason to open Settings */}
        <Row
          icon="bookmark"
          title="Saved"
          note={me.role === 'creator' ? 'Job posts and videos you bookmarked' : 'Videos you bookmarked'}
          onPress={() => router.push('/saved')}
        />
        {me.role === 'creator' ? (
          <Row icon="notifications" title="Notifications" note="Businesses you get job updates from" onPress={() => router.push('/notifications')} />
        ) : null}

        {me.role === 'creator' ? <MyCreatorSettings me={me} /> : null}

        {me.role === 'creator' ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={type.label}>Portfolio</Text>
            <Row icon="videocam" title="Add a video" note="Sample work or a video from a Cloutlet collab" onPress={() => router.push('/add-video')} />
          </View>
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <Text style={type.label}>Verification</Text>
          <Card style={{ padding: 0 }}>
            {checks.map((c, i) => (
              <View key={c.label}>
                {i > 0 ? <Divider /> : null}
                <Pressable onPress={() => router.push('/verify')} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
                  {c.done ? <CheckBadge size={20} label="Done" /> : <Ionicons name="ellipse-outline" size={20} color={colors.textSecondary} />}
                  <View style={{ flex: 1 }}>
                    <Text style={type.bodyStrong}>{c.label}</Text>
                    <Text style={type.small} numberOfLines={1}>
                      {c.detail}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
          </Card>
          {!isVerified(me) ? (
            <Button title={me.role === 'creator' ? 'Verify your socials' : 'Verify with Google'} onPress={() => router.push('/verify')} />
          ) : null}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={type.label}>Privacy</Text>
          <ToggleRow
            title="Location"
            note={locationNote}
            value={location.status === 'listing' || location.enabled}
            disabled={location.status === 'listing' || location.status === 'checking' || (location.status === 'blocked' && Platform.OS === 'web')}
            onChange={onLocation}
          />
        </View>

        <Button title={isLive ? 'Sign out' : 'Switch side (demo)'} variant="secondary" onPress={leave} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, title, note, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; note: string; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={type.bodyStrong}>{title}</Text>
        <Text style={type.small}>{note}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Card>
  );
}
