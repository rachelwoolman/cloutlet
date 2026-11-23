// Verification.
// Creators: connect Instagram and/or TikTok (we read username + followers).
// Businesses: pick your Google Maps listing, then sign in with the Google
// account that manages it to prove you own it.
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, CheckBadge, ErrorNote, Loading, TopBar } from '../components';
import { SocialPlatform } from '../data/backend';
import { formatFollowers } from '../data/catalog';
import { backend } from '../data/hooks';
import { useSession } from '../data/session';
import { PlaceResult, Profile } from '../data/types';
import { colors, fonts, radius, spacing, type } from '../theme';

export default function Verify() {
  const session = useSession();
  if (session.status === 'loading') return <Loading />;
  if (session.status !== 'ready') return <Redirect href="/" />;
  const me = session.profile;
  // Back to wherever you came from (Me tab, or Welcome after sign-up, which forwards to Explore)
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/explore'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Verify" onBack={leave} />
      <ScrollView contentContainerStyle={{ padding: spacing.screen, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        {me.role === 'creator' ? <CreatorVerify me={me} /> : <BusinessVerify me={me} />}
        <Button title="Done" variant="secondary" onPress={leave} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CreatorVerify({ me }: { me: Profile }) {
  return (
    <>
      <View style={{ gap: spacing.xs }}>
        <Text style={type.h1}>Verify your socials</Text>
        <Text style={[type.body, { color: colors.textSecondary }]}>Connect at least one. Your follower count sets your rates.</Text>
      </View>
      <SocialRow me={me} platform="instagram" label="Instagram" icon="logo-instagram" note="Creator or Business account" />
      <SocialRow me={me} platform="tiktok" label="TikTok" icon="logo-tiktok" />
    </>
  );
}

function SocialRow({ me, platform, label, icon, note }: { me: Profile; platform: SocialPlatform; label: string; icon: keyof typeof Ionicons.glyphMap; note?: string }) {
  const account = me[platform];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      await backend.connectSocial(me, platform);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== 'Cancelled') setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Ionicons name={icon} size={26} color={colors.text} />
        <View style={{ flex: 1 }}>
          <Text style={type.bodyStrong}>{label}</Text>
          <Text style={type.small}>
            {account ? `@${account.username}${account.followers != null ? ` · ${formatFollowers(account.followers)} followers` : ''}` : (note ?? 'Not connected')}
          </Text>
        </View>
        {account ? (
          <CheckBadge size={22} label="Done" />
        ) : (
          <Button title={busy ? '…' : 'Connect'} size="sm" disabled={busy} onPress={connect} />
        )}
      </View>
      {error ? <ErrorNote message={error} /> : null}
    </Card>
  );
}

function BusinessVerify({ me }: { me: Profile }) {
  const [query, setQuery] = useState(me.name);
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== 'Cancelled') setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View style={{ gap: spacing.xs }}>
        <Text style={type.h1}>Verify with Google</Text>
        <Text style={[type.body, { color: colors.textSecondary }]}>Find your listing, then sign in with the Google account that manages it.</Text>
      </View>

      {/* Step 1: pick listing */}
      <Text style={type.label}>1 · Your listing</Text>
      {me.google ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Ionicons name="location" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={type.bodyStrong}>{me.name}</Text>
            <Text style={type.small}>{me.google.address}</Text>
          </View>
          <Button title="Change" variant="ghost" size="sm" onPress={() => setResults([])} />
        </Card>
      ) : null}

      {!me.google || results ? (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Business name and city"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={() => run(async () => setResults(await backend.searchPlaces(query)))}
              style={{ flex: 1, height: 44, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 15, color: colors.text }}
            />
            <Button title="Search" size="sm" disabled={busy || query.trim().length < 2} onPress={() => run(async () => setResults(await backend.searchPlaces(query)))} />
          </View>
          {(results ?? []).map((place) => (
            <Pressable
              key={place.placeId}
              onPress={() => run(async () => {
                await backend.claimPlace(me, place);
                setResults(null);
              })}
              style={({ pressed }) => ({ padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: pressed ? colors.buttonFill : colors.surface })}
            >
              <Text style={type.bodyStrong}>{place.name}</Text>
              <Text style={type.small}>
                {place.address}
                {place.rating ? ` · ★ ${place.rating}` : ''}
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}

      {/* Step 2: prove ownership */}
      <Text style={type.label}>2 · Prove it’s yours</Text>
      {me.google?.ownerVerified ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <CheckBadge size={22} label="Done" />
          <Text style={type.bodyStrong}>Owner verified</Text>
        </Card>
      ) : (
        <Button title="Sign in with Google" disabled={!me.google || busy} onPress={() => run(() => backend.verifyGoogleOwnership(me))} />
      )}

      {error ? <ErrorNote message={error} /> : null}
    </>
  );
}
