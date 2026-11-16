// The thin bar at the top of a screen: a back (or close) button, an optional
// centered title, and an optional button on the right.
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';

type Props = {
  title?: string;
  icon?: 'back' | 'close';
  onBack?: () => void;
  right?: ReactNode;
};

export function TopBar({ title, icon = 'back', onBack, right }: Props) {
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));

  return (
    <View
      style={{
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screen - 8,
      }}
    >
      <Pressable onPress={goBack} hitSlop={12} style={{ padding: 8 }} accessibilityLabel="Go back">
        <Feather name={icon === 'back' ? 'chevron-left' : 'x'} size={22} color={colors.text} />
      </Pressable>
      {title ? (
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text }}>{title}</Text>
      ) : null}
      <View style={{ width: 38, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

// A thin horizontal line
export function Divider({ spacing: space = 0 }: { spacing?: number }) {
  return <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: space }} />;
}
