// Shows a video's first frame, still and silent. Used for uploads that have no thumbnail.
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme';

export function VideoPreview({ uri, style }: { uri: string; style?: StyleProp<ViewStyle> }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
  });
  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="cover"
      pointerEvents="none"
      style={[{ backgroundColor: colors.placeholder }, style]}
    />
  );
}
