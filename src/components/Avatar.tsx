// Round photo for people, rounded square with initials for businesses (like "C&C").
import { Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Photo } from './Photo';

type Props = {
  uri?: string;
  initials?: string;
  size?: number;
  shape?: 'circle' | 'square';
};

export function Avatar({ uri, initials, size = 40, shape = 'circle' }: Props) {
  const borderRadius = shape === 'circle' ? size / 2 : size * 0.22;

  if (uri) return <Photo uri={uri} style={{ width: size, height: size, borderRadius }} />;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: colors.buttonFill,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.heading, fontSize: size * 0.36, color: colors.text }}>
        {initials}
      </Text>
    </View>
  );
}
