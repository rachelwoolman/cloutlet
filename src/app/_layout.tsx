import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useWindowDimensions, View } from 'react-native';
import {
  useFonts,
  Newsreader_400Regular,
  Newsreader_500Medium,
} from '@expo-google-fonts/newsreader';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { colors, radius, webFrame } from '../theme';

export default function RootLayout() {
  const { width, height } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Show nothing for the split second while fonts load
  if (!fontsLoaded) return null;

  const app = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );

  // On a wide browser window, show the app in a phone-sized frame.
  // On real phones (and narrow windows) it fills the screen as normal.
  const showFrame = Platform.OS === 'web' && width > webFrame.width + 80;

  return (
    <>
      <StatusBar style="dark" />
      {showFrame ? (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.desk,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: webFrame.width,
              height: Math.min(webFrame.maxHeight, height - 48),
              backgroundColor: colors.background,
              borderRadius: radius.lg * 2,
              borderWidth: 1,
              borderColor: colors.divider,
              overflow: 'hidden',
            }}
          >
            {app}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background }}>{app}</View>
      )}
    </>
  );
}
