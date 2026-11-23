// Small rounded tag. Selected chips get a light orange fill.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

type Props = {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap; // shown before the label, or alone
  accessibilityLabel?: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, icon, accessibilityLabel, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.divider,
        backgroundColor: selected ? colors.accentSoft : 'transparent',
        opacity: pressed ? 0.6 : 1,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 32, // same height with or without text
        gap: 4,
      })}
    >
      {icon ? <Ionicons name={icon} size={15} color={selected ? colors.accent : colors.textSecondary} /> : null}
      {label ? (
        <Text
          style={{
            fontFamily: selected ? fonts.bodyMedium : fonts.body,
            fontSize: 13,
            color: selected ? colors.text : colors.textSecondary,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
