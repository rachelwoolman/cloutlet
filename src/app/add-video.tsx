// Creators: add a video to your portfolio. Opened from Settings > Portfolio,
// and once at sign-up ("Add sample videos", which can be skipped).
// Creators don't post anything else.
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Empty, TopBar } from '../components';
import { VideoForm } from '../components/PostForms';
import { useMe } from '../data/session';
import { colors, spacing, type } from '../theme';

export default function AddVideo() {
  const me = useMe();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const atSignUp = onboarding === '1';
  const done = () => (atSignUp ? router.replace('/verify') : router.back());

  if (me.role !== 'creator') return <Empty title="Only creators add portfolio videos" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <TopBar icon="close" title={atSignUp ? 'Sample videos' : 'Add a video'} onBack={done} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.sm, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          {atSignUp ? (
            <Text style={[type.body, { color: colors.textSecondary }]}>Show businesses what you make. Add a few of your best videos, or skip and add them later in Settings.</Text>
          ) : null}
          <VideoForm onDone={done} />
          {atSignUp ? <Button title="Skip for now" variant="ghost" onPress={done} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
