import { LatLng } from '../data/types';

export type MapPin = {
  id: string;
  title: string;
  location: LatLng;
  hiring: boolean; // has an open job post: orange pin
};

// The area currently on screen
export type MapBounds = { north: number; south: number; east: number; west: number };

export const inBounds = (b: MapBounds, p: LatLng) => p.lat <= b.north && p.lat >= b.south && p.lng <= b.east && p.lng >= b.west;

export type MapPinsProps = {
  pins: MapPin[];
  center: LatLng;
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  onBoundsChange?: (bounds: MapBounds) => void; // called after every pan or zoom
};

export const pinColors = { hiring: '#EA5A0C', default: '#1F1E1C' };
