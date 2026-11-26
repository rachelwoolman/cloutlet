/* eslint-disable @typescript-eslint/no-require-imports */
// Shared mocks for screen tests: icons, images and video render as plain views.
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const Icon = ({ name }: { name: string }) => <Text>{`[${name}]`}</Text>;
  return { Ionicons: Icon, Feather: Icon };
});
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-video', () => ({ useVideoPlayer: () => ({ play() {}, pause() {} }), VideoView: () => null }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('react-native-maps', () => ({ __esModule: true, default: () => null, Marker: () => null, PROVIDER_DEFAULT: null, PROVIDER_GOOGLE: 'google' }));
jest.mock('expo-location', () => ({}));
// Device storage: an in-memory stand-in
jest.mock('../lib/authStorage', () => {
  const m = new Map<string, string>();
  return { authStorage: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v), removeItem: (k: string) => m.delete(k) } };
});
jest.mock('../lib/supabase', () => ({ supabase: {}, MEDIA_BUCKET: 'media' }));
