// Loading spinner and "nothing here" message, used on every list screen.
import { ActivityIndicator, Text, View } from 'react-native';
import { colors, spacing, type } from '../theme';

export function Loading() {
  return (
    <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function Empty({ title, note }: { title: string; note?: string }) {
  return (
    <View style={{ padding: spacing.xxl, alignItems: 'center', gap: spacing.xs }}>
      <Text style={[type.bodyStrong, { textAlign: 'center' }]}>{title}</Text>
      {note ? <Text style={[type.small, { textAlign: 'center' }]}>{note}</Text> : null}
    </View>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return <Text style={[type.small, { color: colors.accent, textAlign: 'center', padding: spacing.lg }]}>{message}</Text>;
}
