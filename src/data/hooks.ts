// Hooks screens use to read data. Each one reloads by itself when its data changes.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isLive } from '../lib/config';
import { Backend, Topic } from './backend';
import { demoBackend } from './demo/demoBackend';
import { liveBackend } from './live/liveBackend';
import { rankFeed } from './rank';
import { FeedPost, JobAlert, Message, OfferWithPeople, Profile, Review, ThreadWithPeople } from './types';

export const backend: Backend = isLive ? liveBackend : demoBackend;

type Resource<T> = { data: T | undefined; loading: boolean; error: string | null; reload: () => void };

type State<T> = { key: string; data?: T; error: string | null; loading: boolean };

// Loads data, and loads it again whenever one of `topics` changes.
// `key` identifies what's being loaded (e.g. a profile id); change it to load something else.
export function useResource<T>(topics: Topic[], load: () => Promise<T>, key: string): Resource<T> {
  const [state, setState] = useState<State<T>>({ key, error: null, loading: true });
  const [version, setVersion] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let alive = true;
    loadRef
      .current()
      .then((data) => alive && setState({ key, data, error: null, loading: false }))
      .catch((e) => alive && setState((s) => ({ ...s, key, error: e instanceof Error ? e.message : String(e), loading: false })));
    return () => {
      alive = false;
    };
  }, [key, version]);

  // Quiet reload when the data changes elsewhere (no spinner)
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const topicsKey = topics.join('|');
  useEffect(() => {
    const unsubs = topicsKey.split('|').map((t) => backend.subscribe(t as Topic, refresh));
    return () => unsubs.forEach((u) => u());
  }, [topicsKey, refresh]);

  // Pull-to-refresh: shows the spinner
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    refresh();
  }, [refresh]);

  const stale = state.key !== key;
  return { data: stale ? undefined : state.data, loading: stale || state.loading, error: stale ? null : state.error, reload };
}

// ---------- Feed ----------

// Posts opened full screen this session (the algorithm pushes them down next refresh)
const seenPostIds = new Set<string>();
export const markSeen = (id: string) => seenPostIds.add(id);

export function useFeed(me: Profile) {
  const res = useResource<FeedPost[]>(['feed', 'profiles'], () => backend.listFeed(), 'feed');
  // Rank once per load, so the order doesn't jump while you scroll
  const { role, location } = me;
  const ranked = useMemo(
    () => (res.data ? rankFeed(res.data, { role, location, seenPostIds }) : undefined),
    [res.data, role, location],
  );
  return { ...res, data: ranked };
}

// The ranked feed is shared with the full-screen viewer so it opens in the same order
let lastFeed: FeedPost[] = [];
export const setLastFeed = (posts: FeedPost[]) => {
  lastFeed = posts;
};
export const getLastFeed = () => lastFeed;

// ---------- People ----------

export const useProfile = (id: string) =>
  useResource<Profile | null>(['profiles'], () => backend.getProfile(id), id);

export const usePostsFor = (id: string) =>
  useResource<FeedPost[]>(['feed', 'profiles'], () => backend.listPostsFor(id), id);

export const useReviews = (profileId: string) =>
  useResource<Review[]>(['profiles'], () => backend.listReviews(profileId), `reviews:${profileId}`);

export const useBusinesses = () => useResource<Profile[]>(['profiles'], () => backend.listBusinesses(), 'businesses');

// ---------- Deals and chat ----------

export const useOffers = (me: Profile) =>
  useResource<OfferWithPeople[]>(['offers'], () => backend.listOffers(me), me.id);

export const useThreads = (me: Profile) =>
  useResource<ThreadWithPeople[]>(['threads', 'offers'], () => backend.listThreads(me), me.id);

export const useThread = (id: string) =>
  useResource<ThreadWithPeople | null>(['threads', 'offers'], () => backend.getThread(id), id);

export const useMessages = (threadId: string) =>
  useResource<Message[]>([`messages:${threadId}`], () => backend.listMessages(threadId), threadId);

// ---------- Saved posts ----------

export const useSavedIds = (me: Profile) =>
  useResource<string[]>(['saved'], () => backend.listSavedIds(me), me.id);

export const useSavedPosts = (me: Profile) =>
  useResource<FeedPost[]>(['saved', 'feed'], () => backend.listSavedPosts(me), me.id);

// ---------- Bell (follow a business) and job updates ----------

export const useFollowingIds = (me: Profile) =>
  useResource<string[]>(['follows'], () => backend.listFollowingIds(me), me.id);

export const useAlerts = (me: Profile) =>
  useResource<JobAlert[]>(['alerts', 'feed'], () => backend.listAlerts(me), me.id);
