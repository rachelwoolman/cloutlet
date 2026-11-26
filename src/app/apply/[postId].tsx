// Creator > apply to a job post. Shows what the post asks for and a message to the business that
// starts from a default (greeting, the post, what it asks, their own pitch). They can change all of it.
// Nothing is saved or sent until they tap "Send application": closing this screen leaves no
// application, no chat and no notice to the business.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Empty, ErrorNote, Loading, TopBar } from '../../components';
import { backend, useApplications, usePost } from '../../data/hooks';
import { defaultApplicationMessage, hiresLabel, jobSummary, payLabel } from '../../data/jobs';
import { pitchTips } from '../../data/pitch';
import { useMe } from '../../data/session';
import { colors, fonts, radius, spacing, type } from '../../theme';

export default function Apply() {
  const me = useMe();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const post = usePost(postId);
  const mine = useApplications(me);
  const [edited, setMessage] = useState<string>(); // undefined until they type
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const p = post.data;
  if (me.role !== 'creator') return <Empty title="Only creators apply to jobs" />;
  if (!p || !p.job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar icon="close" />
        {post.loading ? <Loading /> : <Empty title="Job post not found" />}
      </SafeAreaView>
    );
  }

  const already = (mine.data ?? []).find((a) => a.postId === p.id);
  const message = edited ?? defaultApplicationMessage(me, p);
  const job = p.job;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const threadId = await backend.applyToPost(me, p.id, message);
      router.replace({ pathname: '/chat/[id]', params: { id: threadId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <TopBar icon="close" title="Apply" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Card style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar uri={p.author.avatar} initials={p.author.initials} size={36} shape="square" />
              <View style={{ flex: 1 }}>
                <Text style={type.bodyStrong} numberOfLines={1}>
                  {p.caption}
                </Text>
                <Text style={[type.small, { fontSize: 12 }]}>{p.author.name}</Text>
              </View>
            </View>
            <Text style={type.small}>{jobSummary(job)}</Text>
            <Text style={[type.small, { color: colors.text }]}>
              {payLabel(job)}
              {hiresLabel(job) ? ` · ${hiresLabel(job)}` : ''}
            </Text>
          </Card>

          {p.archived ? (
            <Text style={type.body}>This job is closed.</Text>
          ) : already ? (
            <View style={{ gap: spacing.md }}>
              <Text style={type.body}>You already applied to this post.</Text>
              <Button title="Open chat" onPress={() => router.replace({ pathname: '/chat/[id]', params: { id: already.threadId } })} />
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              <Text style={type.label}>Your message to {p.author.name}</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder="Say why you’re a good fit"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Application message"
                style={{
                  minHeight: 180,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                  fontFamily: fonts.body,
                  fontSize: 15,
                  lineHeight: 21,
                  color: colors.text,
                  textAlignVertical: 'top',
                }}
              />
              {!me.pitch ? <Text style={[type.small, { fontSize: 12 }]}>{pitchTips} You can save a pitch in Settings so it’s added here next time.</Text> : null}
              <Text style={[type.small, { fontSize: 12 }]}>
                Pay and details are worked out in the chat. Your application counts once you send it.
              </Text>
            </View>
          )}
          {error ? <ErrorNote message={error} /> : null}
        </ScrollView>

        {!already && !p.archived ? (
          <View style={{ paddingHorizontal: spacing.screen, paddingVertical: spacing.md, borderTopWidth: 1, borderColor: colors.divider }}>
            <Button title={busy ? 'Sending…' : 'Send application'} onPress={send} disabled={busy || !message.trim() || mine.loading} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
