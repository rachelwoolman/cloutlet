// Sign in with an emailed code, then set up your profile (first time only).
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, ErrorNote, OpenToWorkToggle, TopBar } from '../components';
import { backend } from '../data/hooks';
import { refreshMe, sendLoginCode, useSession, verifyLoginCode } from '../data/session';
import { Availability, Role } from '../data/types';
import { colors, fonts, radius, spacing, type } from '../theme';

export default function SignIn() {
  const session = useSession();
  const params = useLocalSearchParams<{ role?: Role }>();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.status === 'ready') return <Redirect href="/explore" />;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.screen, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          {session.status === 'needsProfile' ? (
            <ProfileSetup userId={session.userId} initialRole={params.role ?? 'creator'} />
          ) : !codeSent ? (
            <>
              <Text style={type.h1}>Sign in</Text>
              <Text style={[type.body, { color: colors.textSecondary }]}>We’ll email you a code.</Text>
              <Field value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoFocus />
              <Button title="Send code" disabled={busy || !email.includes('@')} onPress={() => run(async () => {
                await sendLoginCode(email.trim());
                setCodeSent(true);
              })} />
            </>
          ) : (
            <>
              <Text style={type.h1}>Enter code</Text>
              <Text style={[type.body, { color: colors.textSecondary }]}>Sent to {email}.</Text>
              <Field value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" autoFocus />
              <Button title="Continue" disabled={busy || code.length < 6} onPress={() => run(() => verifyLoginCode(email.trim(), code.trim()))} />
              <Button title="Use a different email" variant="ghost" onPress={() => setCodeSent(false)} />
            </>
          )}
          {error ? <ErrorNote message={error} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProfileSetup({ userId, initialRole }: { userId: string; initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [detail, setDetail] = useState(''); // niche (creator) or kind (business)
  const [availability, setAvailability] = useState<Availability>('open');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await backend.createProfile(userId, {
        role,
        name: name.trim(),
        handle: handle.trim().replace(/^@/, ''),
        neighborhood: neighborhood.trim(),
        ...(role === 'creator' ? { niche: detail.trim(), availability } : { kind: detail.trim() }),
      });
      await refreshMe();
      // Creators can add sample videos first (skippable), then verify
      router.replace(role === 'creator' ? { pathname: '/add-video', params: { onboarding: '1' } } : '/verify');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <>
      <Text style={type.h1}>Your profile</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Chip label="Creator" selected={role === 'creator'} onPress={() => setRole('creator')} />
        <Chip label="Business" selected={role === 'business'} onPress={() => setRole('business')} />
      </View>
      <Field value={name} onChangeText={setName} placeholder={role === 'creator' ? 'Your name' : 'Business name'} />
      <Field value={handle} onChangeText={setHandle} placeholder="@handle" autoCapitalize="none" />
      <Field value={neighborhood} onChangeText={setNeighborhood} placeholder="Neighborhood" />
      <Field value={detail} onChangeText={setDetail} placeholder={role === 'creator' ? 'What you film (e.g. cafe vlogs)' : 'Type (e.g. Bakery)'} />
      {role === 'creator' ? (
        <View style={{ gap: spacing.sm }}>
          <OpenToWorkToggle value={availability} onChange={setAvailability} />
          <Text style={type.small}>You can change this any time in Settings.</Text>
        </View>
      ) : null}
      <Button title="Continue" disabled={busy || !name.trim() || !handle.trim()} onPress={save} />
      {error ? <ErrorNote message={error} /> : null}
    </>
  );
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      autoCapitalize={props.keyboardType === 'email-address' ? 'none' : props.autoCapitalize}
      {...props}
      style={{
        height: 52,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: colors.surface,
        fontFamily: fonts.body,
        fontSize: 16,
        color: colors.text,
      }}
    />
  );
}
