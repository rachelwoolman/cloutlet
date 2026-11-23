// Businesses: post a job (opened from the + on the Explore feed).
// Businesses only post jobs; photos and videos go inside the job as a slideshow.
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Empty, TopBar } from '../components';
import { JobForm } from '../components/PostForms';
import { useMe } from '../data/session';
import { colors, spacing } from '../theme';

export default function NewJob() {
  const me = useMe();
  if (me.role !== 'business') return <Empty title="Only businesses post jobs" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <TopBar icon="close" title="New job" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.sm, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <JobForm onDone={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
