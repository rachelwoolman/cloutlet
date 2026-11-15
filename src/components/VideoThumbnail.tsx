// A photo standing in for a video, with a small "▶ 0:28" pill (like the B1 mockup).
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';
import { Photo } from './Photo';

type Props = {
  uri?: string;
  duration?: string; // e.g. "0:28"
  height?: number;
  tag?: string; // optional label in the top-left, e.g. a business name
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function VideoThumbnail({ uri, duration, height = 200, tag, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        { height, borderRadius: radius.md, overflow: 'hidden', opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Photo uri={uri} style={{ width: '100%', height: '100%' }} />

      {tag ? (
        <View style={[pill, { top: spacing.sm, backgroundColor: colors.surface }]}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.text }}>{tag}</Text>
        </View>
      ) : null}

      {duration ? (
        <View style={[pill, { bottom: spacing.sm, backgroundColor: colors.overlay }]}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: '#FFFFFF' }}>
            ▶ {duration}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const pill: ViewStyle = {
  position: 'absolute',
  left: spacing.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: 3,
  borderRadius: radius.pill,
};
