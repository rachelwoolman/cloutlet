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
import * as WebBrowser from 'expo-web-browser';
import { useSession } from '../data/session';

// Web: when an Instagram/TikTok/Google sign-in popup lands back in the app,
// this closes the popup and hands the result to the window that opened it.
// Runs first thing, before any redirects. Does nothing otherwise.
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const { width, height } = useWindowDimensions();
  const signedIn = useSession().status === 'ready';
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
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />

      {/* Everything else needs you signed in. If not, you're sent back to Welcome. */}
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        {/* Full-screen vertical viewer slides up over the tabs */}
        <Stack.Screen
          name="reels"
          options={{ animation: 'slide_from_bottom', contentStyle: { backgroundColor: colors.reelBackground } }}
        />
        <Stack.Screen name="profile/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="request/[id]" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="jobs/[id]" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="saved" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="reviews/[id]" />
        {/* Posting slides up as a sheet */}
        <Stack.Screen name="new-job" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-video" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-job/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="apply/[postId]" options={{ presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
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
