// Primary = orange accent. Soft = warm fill. Secondary = thin outline. Ghost = text only.
import { Pressable, StyleProp, Text, ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'soft' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          height: size === 'md' ? 52 : 40,
          paddingHorizontal: size === 'md' ? spacing.xl : spacing.lg,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        variant === 'primary' && {
          backgroundColor: pressed ? colors.accentPressed : colors.accent,
        },
        variant === 'soft' && {
          backgroundColor: pressed ? colors.buttonFillPressed : colors.buttonFill,
        },
        variant === 'secondary' && {
          borderWidth: 1,
          borderColor: colors.text,
          backgroundColor: pressed ? colors.buttonFill : 'transparent',
        },
        variant === 'ghost' && { opacity: pressed ? 0.5 : disabled ? 0.4 : 1 },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: variant === 'primary' ? fonts.bodySemiBold : fonts.bodyMedium,
          fontSize: size === 'md' ? 15 : 14,
          color: variant === 'primary' ? colors.onAccent : colors.text,
          textDecorationLine: variant === 'ghost' ? 'underline' : 'none',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
