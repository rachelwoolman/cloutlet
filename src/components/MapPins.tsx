// The map on web: Leaflet with OpenStreetMap tiles. No API key or account needed.
// Web only: iPhone and Android use MapPins.native.tsx (react-native-maps) instead.
// OpenStreetMap's free tiles are fine for building and testing. Before real
// traffic, switch to a tile provider (see their usage policy).
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { HostInstance, StyleSheet, View } from 'react-native';
import { MapPinsProps, pinColors } from './MapPins.types';

const tiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

export function MapPins({ pins, center, selectedId, onSelect, onBoundsChange }: MapPinsProps) {
  const box = useRef<HostInstance>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  // Leaflet's handlers are set up once, so they read the latest onSelect from here
  const select = useRef(onSelect);
  const bounds = useRef(onBoundsChange);
  useEffect(() => {
    select.current = onSelect;
    bounds.current = onBoundsChange;
  });

  // Create the map once
  useEffect(() => {
    const el = box.current as unknown as HTMLElement | null;
    if (!el) return;
    const m = L.map(el, { center: [center.lat, center.lng], zoom: 13, attributionControl: true });
    L.tileLayer(tiles, { maxZoom: 19, attribution }).addTo(m);
    m.attributionControl.setPrefix(false); // keep just the OpenStreetMap credit
    m.on('click', () => select.current(undefined));
    // Tell the screen what's in view, so the counts match what you see
    const report = () => {
      const b = m.getBounds();
      bounds.current?.({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };
    m.on('moveend', report);
    m.whenReady(report);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;

    // Keep the map filling its box if the window or layout changes size
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(el);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
      layer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Put a dot on the map for each spot (orange = hiring). Redraw when pins or selection change.
  useEffect(() => {
    const group = layer.current;
    if (!group) return;
    group.clearLayers();
    pins.forEach((pin) => {
      const selected = pin.id === selectedId;
      L.circleMarker([pin.location.lat, pin.location.lng], {
        radius: selected ? 11 : 8,
        fillColor: pin.hiring ? pinColors.hiring : pinColors.default,
        fillOpacity: 1,
        color: '#FFFFFF',
        weight: 2,
        bubblingMouseEvents: false, // a pin tap shouldn't also count as a map tap
      })
        .bindTooltip(pin.title, { direction: 'top', offset: [0, -8] })
        .on('click', () => select.current(pin.id))
        .addTo(group);
    });
  }, [pins, selectedId]);

  return <View ref={box} style={StyleSheet.absoluteFill} />;
}
