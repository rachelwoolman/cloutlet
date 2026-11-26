// What you've already seen in Explore, remembered on this device between app opens,
// so the feed doesn't start with the same posts in the same order every time.
// Stored with the same localStorage the login uses (expo-sqlite on phones, the browser on web).
// Nothing here is sent to the server.
import { authStorage } from '../lib/authStorage';

const OPENED_KEY = 'cloutlet.feed.opened'; // { postId: when you last opened it full screen (ms) }
const TOP_KEY = 'cloutlet.feed.top'; // post ids at the top of Explore last time

const KEEP_DAYS = 7; // forget opens older than this
const MAX_OPENED = 300;
export const TOP_COUNT = 6;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = authStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    authStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable: the feed still works, it just won't remember between opens
  }
}

function prune(opened: Record<string, number>, now = Date.now()): Record<string, number> {
  const cutoff = now - KEEP_DAYS * 24 * 3_600_000;
  const recent = Object.entries(opened)
    .filter(([, at]) => at > cutoff)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_OPENED);
  return Object.fromEntries(recent);
}

// Read once when the app starts
const opened: Record<string, number> = prune(read(OPENED_KEY, {}));
// The top of the feed from the previous app open. Fixed for this whole session, so the top
// keeps moving on from what you saw last time instead of from what you saw a minute ago.
const previousTop: string[] = read(TOP_KEY, []);

export function markOpened(postId: string) {
  opened[postId] = Date.now();
  write(OPENED_KEY, prune(opened));
}

export const openedAt = (): Readonly<Record<string, number>> => opened;
export const getPreviousTop = (): readonly string[] => previousTop;

// Remember what's at the top now, for the next app open
export function saveTop(postIds: string[]) {
  write(TOP_KEY, postIds.slice(0, TOP_COUNT));
}
