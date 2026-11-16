// Shown right after a business sends a request.
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { getCreator } from '../../data/fake';
import { colors, spacing, type } from '../../theme';

export default function RequestSent() {
  const { creatorId } = useLocalSearchParams<{ creatorId: string }>();
  const creator = getCreator(creatorId);
  const firstName = creator?.name.split(' ')[0] ?? 'They';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.screen, justifyContent: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.buttonFill,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
          }}
        >
          <Feather name="check" size={22} color={colors.text} />
        </View>
        <Text style={type.display}>Request sent.</Text>
        <Text style={[type.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
          {firstName} {creator?.replyTime.replace('Usually replies', 'usually replies') ?? 'will reply soon'}. We'll
          let you know. In the meantime, maybe tidy the pastry case.
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.sm }}>
        <Button
          title={`See it from ${firstName}'s side`}
          onPress={() => router.push(`/creator/offers?as=${creatorId}`)}
        />
        <Button title="Back to Discover" variant="secondary" onPress={() => router.dismissTo('/business/discover')} />
      </View>
    </SafeAreaView>
  );
}
