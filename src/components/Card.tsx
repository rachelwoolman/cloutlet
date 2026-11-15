// A white box with a thin border. Tappable if you pass onPress.
import { ReactNode } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, onPress, style }: Props) {
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    padding: spacing.lg,
  };

  if (!onPress) return <View style={[base, style]}>{children}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.7 : 1 }, style]}>
      {children}
    </Pressable>
  );
}
