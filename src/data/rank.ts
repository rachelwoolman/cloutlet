// ─────────────────────────────────────────────────────────────
// The Explore feed algorithm.
//
// Simple on purpose: a weighted score per post, then a mixing pass so the
// feed doesn't show the same person twice in a row. Every weight is below,
// so you can tune the feed without touching the screens.
//
// score = freshness + nearby + engagement + collab + roleFit + verified + openToWork - seen
// All distances are in miles.
// ─────────────────────────────────────────────────────────────
import { isVerified } from './catalog';
import { FeedPost, LatLng, Role } from './types';

export const weights = {
  freshness: 1.0, // newer posts first (halves every `freshHalfLifeHours`)
  nearby: 1.2, // local matters most (halves every `nearbyHalfLifeMiles`)
  engagement: 0.8, // likes per view, smoothed so tiny posts don't win by luck
  collab: 0.35, // booked through Cloutlet: proof it works
  roleFit: 0.5, // creators see more jobs, businesses see more creator work
  verified: 0.2, // connected Instagram/TikTok or a verified Google listing
  openToWork: 0.6, // creator set "Open to work" ("Open to network" gets a third of this; "Not looking" gets none)
  seen: 0.9, // already opened in full screen: push it down
};

const freshHalfLifeHours = 48;
const nearbyHalfLifeMiles = 2;

// Smoothing: pretend every post starts with 20 views at a 5% like rate
const priorViews = 20;
const priorRate = 0.05;

export type Viewer = {
  role: Role;
  location?: LatLng;
  seenPostIds?: Set<string>;
};

export function rankFeed(posts: FeedPost[], viewer: Viewer, now = Date.now()): FeedPost[] {
  const scored = posts.map((post) => ({ post, score: scorePost(post, viewer, now) }));
  scored.sort((a, b) => b.score - a.score);
  return mix(scored.map((s) => s.post), viewer.role);
}

export function scorePost(post: FeedPost, viewer: Viewer, now = Date.now()): number {
  const ageHours = Math.max(0, (now - post.createdAt) / 3_600_000);
  const freshness = Math.pow(0.5, ageHours / freshHalfLifeHours);

  const where = postLocation(post);
  const miles = viewer.location && where ? distanceMiles(viewer.location, where) : 6;
  const nearby = Math.pow(0.5, miles / nearbyHalfLifeMiles);

  // Like rate vs. a typical post, capped so one viral post doesn't take over
  const rate = (post.likes + priorViews * priorRate) / (post.views + priorViews);
  const engagement = Math.min(rate / (priorRate * 2), 1.5);

  const collab = post.collabBusinessId || post.collabCreatorId ? 1 : 0;

  const roleFit =
    viewer.role === 'creator' ? (post.kind === 'job' ? 1 : 0.4) : post.kind === 'video' ? 1 : 0.2;

  const verified = isVerified(post.author) ? 1 : 0;
  const a = post.kind === 'video' && post.author.role === 'creator' ? (post.author.availability ?? 'open') : null;
  const openToWork = a === 'open' ? 1 : a === 'networking' ? 1 / 3 : 0;
  const seen = viewer.seenPostIds?.has(post.id) ? 1 : 0;

  return (
    weights.freshness * freshness +
    weights.nearby * nearby +
    weights.engagement * engagement +
    weights.collab * collab +
    weights.roleFit * roleFit +
    weights.verified * verified +
    weights.openToWork * openToWork -
    weights.seen * seen
  );
}

// Keep the best order, but never show the same author twice in a row,
// and for creators slot a job in at least every 4th post.
function mix(sorted: FeedPost[], role: Role): FeedPost[] {
  const queue = [...sorted];
  const out: FeedPost[] = [];
  let sinceJob = 0;

  while (queue.length) {
    const last = out[out.length - 1];
    const wantJob = role === 'creator' && sinceJob >= 3;
    let i = queue.findIndex(
      (p) => p.authorId !== last?.authorId && (!wantJob || p.kind === 'job'),
    );
    if (i === -1) i = queue.findIndex((p) => p.authorId !== last?.authorId);
    if (i === -1) i = 0;

    const [next] = queue.splice(i, 1);
    sinceJob = next.kind === 'job' ? 0 : sinceJob + 1;
    out.push(next);
  }
  return out;
}

// A job happens at the business. A video happens at the business it was
// made for, or else wherever the creator is based.
function postLocation(post: FeedPost): LatLng | undefined {
  return post.collabBusiness?.location ?? post.author.location;
}

// Straight-line distance in miles
export function distanceMiles(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}

export function formatDistance(mi: number): string {
  return mi < 0.1 ? 'Here' : `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
}
