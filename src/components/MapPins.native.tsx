// The map on phones (react-native-maps).
// Android always uses Google Maps. iOS uses Google Maps in a development build
// with a key set (see SETUP.md); in Expo Go it falls back to Apple Maps.
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { MapPinsProps, pinColors } from './MapPins.types';

const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const hasIosGoogleKey = Boolean(Constants.expoConfig?.extra?.hasIosGoogleMapsKey);
const provider = Platform.OS === 'android' || (hasIosGoogleKey && !inExpoGo) ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

// Turn a region (center + size) into its edges
const toBounds = (r: Region) => ({
  north: r.latitude + r.latitudeDelta / 2,
  south: r.latitude - r.latitudeDelta / 2,
  east: r.longitude + r.longitudeDelta / 2,
  west: r.longitude - r.longitudeDelta / 2,
});

export function MapPins({ pins, center, selectedId, onSelect, onBoundsChange }: MapPinsProps) {
  const start: Region = { latitude: center.lat, longitude: center.lng, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  return (
    <MapView
      provider={provider}
      style={StyleSheet.absoluteFill}
      initialRegion={start}
      onMapReady={() => onBoundsChange?.(toBounds(start))}
      onRegionChangeComplete={(r) => onBoundsChange?.(toBounds(r))}
      showsUserLocation
      showsPointsOfInterests={false}
      onPress={() => onSelect(undefined)}
    >
      {pins.map((pin) => (
        <Marker
          key={`${pin.id}-${pin.id === selectedId}`}
          identifier={pin.id}
          coordinate={{ latitude: pin.location.lat, longitude: pin.location.lng }}
          title={pin.title}
          pinColor={pin.hiring ? pinColors.hiring : pinColors.default}
          onPress={(e) => {
            e.stopPropagation();
            onSelect(pin.id);
          }}
        />
      ))}
    </MapView>
  );
}
