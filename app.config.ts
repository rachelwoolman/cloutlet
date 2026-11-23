// Adds settings that depend on keys in .env on top of app.json.
// (app.json can't read environment variables; this file can.)
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosMapsKey = process.env.GOOGLE_MAPS_IOS_KEY ?? '';
  const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_KEY ?? '';

  return {
    ...(config as ExpoConfig),
    plugins: [
      ...(config.plugins ?? []),
      // Google Maps on phones (needs a development build; see SETUP.md)
      ['react-native-maps', { iosGoogleMapsApiKey: iosMapsKey, androidGoogleMapsApiKey: androidMapsKey }],
      ['expo-location', { locationWhenInUsePermission: 'Show spots near you on the map.' }],
      [
        'expo-image-picker',
        { photosPermission: 'Pick videos to post to your Cloutlet portfolio.', cameraPermission: false, microphonePermission: false },
      ],
    ],
    extra: {
      ...config.extra,
      hasIosGoogleMapsKey: Boolean(iosMapsKey),
    },
  };
};
