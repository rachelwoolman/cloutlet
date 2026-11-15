// Small rounded tag. Selected chips get the soft warm fill.
import { Pressable, Text } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.buttonFill : colors.divider,
        backgroundColor: selected ? colors.buttonFill : 'transparent',
        opacity: pressed ? 0.6 : 1,
        alignSelf: 'flex-start',
      })}
    >
      <Text
        style={{
          fontFamily: selected ? fonts.bodyMedium : fonts.body,
          fontSize: 13,
          color: selected ? colors.text : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
