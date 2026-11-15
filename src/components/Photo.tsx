// A photo with a calm grey block behind it.
// If the image is slow or fails to load, you just see the grey block.
import { Image } from 'expo-image';
import { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme';

type Props = {
  uri?: string;
  style?: StyleProp<ViewStyle>;
};

export function Photo({ uri, style }: Props) {
  return (
    <Image
      source={uri ? { uri } : undefined}
      style={[{ backgroundColor: colors.placeholder }, style] as any}
      contentFit="cover"
      transition={200}
    />
  );
}
