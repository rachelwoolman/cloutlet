// The verified mark: an orange check inside a small, light circle.
// The soft circle keeps it readable as a check from far away without a heavy filled dot.
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { isVerified } from '../data/catalog';
import { Profile } from '../data/types';
import { colors } from '../theme';

// onDark: white check on a see-through circle, for text over photos and videos
export function CheckBadge({ size = 14, onDark = false, label = 'Verified' }: { size?: number; onDark?: boolean; label?: string }) {
  return (
    <View
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: onDark ? 'rgba(255, 255, 255, 0.24)' : colors.accentSoft,
      }}
    >
      <Ionicons name="checkmark-sharp" size={Math.round(size * 0.72)} color={onDark ? '#FFFFFF' : colors.accent} />
    </View>
  );
}

export function Verified({ profile, size = 14, onDark = false }: { profile: Profile; size?: number; onDark?: boolean }) {
  if (!isVerified(profile)) return null;
  return <CheckBadge size={size} onDark={onDark} />;
}
