// Business > edit one of its job posts (from Manage post). Same form as New job.
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Empty, Loading, TopBar } from '../../components';
import { JobForm } from '../../components/PostForms';
import { usePost } from '../../data/hooks';
import { useMe } from '../../data/session';
import { colors, spacing } from '../../theme';

export default function EditJob() {
  const me = useMe();
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const p = post.data;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <TopBar icon="close" title="Edit job" />
      {!p ? (
        post.loading ? <Loading /> : <Empty title="Job post not found" />
      ) : p.authorId !== me.id || p.kind !== 'job' ? (
        <Empty title="You can only edit your own job posts" />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingTop: spacing.sm, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
            {/* key: start the form over if the post loads again with different values */}
            <JobForm key={p.id} post={p} onDone={() => router.back()} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
