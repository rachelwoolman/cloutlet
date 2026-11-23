// Fixed lists the app uses everywhere: services, pricing tiers and perks.
// Same in demo mode and with the real backend.
import { AudienceTier, Service, ServiceId } from './types';

export const services: Service[] = [
  { id: 'reel', name: 'Instagram Reel', description: 'Short vertical video on their feed' },
  { id: 'maps', name: 'Google Maps video', description: 'Short video on your Google listing' },
  { id: 'stories', name: 'Story set (3)', description: 'Three stories, live for 24h' },
];

export const audienceTiers: AudienceTier[] = [
  { label: 'Under 2K', note: 'Newer creators', minFollowers: 0, maxFollowers: 1999 },
  { label: '2K – 10K', note: 'Most local creators', minFollowers: 2000, maxFollowers: 9999 },
  { label: '10K – 50K', note: 'Bigger reach', minFollowers: 10000, maxFollowers: 49999 },
  { label: '50K+', note: 'On request', minFollowers: 50000, maxFollowers: null },
];

// Price per service, one number per tier above (null = "on request")
export const tierPrices: Record<ServiceId, (number | null)[]> = {
  reel: [25, 50, 120, null],
  maps: [35, 80, 150, null],
  stories: [15, 25, 60, null],
};

export const perkOptions = ['2 pastries', 'A drink', 'Lunch for two', 'Free brunch', 'A tote bag'];

export const getService = (id: ServiceId) => services.find((s) => s.id === id)!;

export function tierIndexFor(followers: number): number {
  return audienceTiers.findIndex(
    (t) => followers >= t.minFollowers && (t.maxFollowers === null || followers <= t.maxFollowers),
  );
}

export function priceFor(serviceId: ServiceId, followers: number): number | null {
  return tierPrices[serviceId][tierIndexFor(followers)];
}

// 4200 -> "4.2K"
export function formatFollowers(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '')}K`;
}

// "2h", "3d", "Just now"
export function timeAgo(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / (86400 * 7))}w`;
}

export function formatPerks(perks: string[]): string {
  return perks.join(' + ').toLowerCase();
}

export function formatTerms(price: number, perks: string[]): string {
  const p = price > 0 ? `$${price}` : 'Perks only';
  return perks.length ? `${p} + ${formatPerks(perks)}` : p;
}

export const firstName = (name: string) => name.split(' ')[0];

// A creator counts as verified once Instagram or TikTok is connected.
// A business counts as verified once it owns its Google listing.
export function isVerified(p: { role: string; instagram?: unknown; tiktok?: unknown; google?: { ownerVerified: boolean } }) {
  return p.role === 'creator' ? Boolean(p.instagram || p.tiktok) : Boolean(p.google?.ownerVerified);
}
