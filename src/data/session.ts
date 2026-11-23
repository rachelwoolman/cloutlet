// Who is using the app right now.
// Demo mode: you pick a side and become Renee (creator) or Crumb & Co. (business).
// Live mode: Supabase email login, then your profile from the database.
import { useSyncExternalStore } from 'react';
import { isLive } from '../lib/config';
import { supabase } from '../lib/supabase';
import { demoUserIds } from './demo/seed';
import { backend } from './hooks';
import { Profile, Role } from './types';

export type Session =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'needsProfile'; userId: string } // logged in, hasn't finished sign-up
  | { status: 'ready'; userId: string; profile: Profile };

let session: Session = isLive ? { status: 'loading' } : { status: 'signedOut' };
const listeners = new Set<() => void>();

function set(next: Session) {
  session = next;
  listeners.forEach((fn) => fn());
}

export function useSession(): Session {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => session,
    () => session,
  );
}

// The signed-in profile. Only call on screens behind the sign-in.
export function useMe(): Profile {
  const s = useSession();
  if (s.status !== 'ready') throw new Error('Not signed in');
  return s.profile;
}

async function loadProfile(userId: string) {
  const profile = await backend.getProfile(userId);
  set(profile ? { status: 'ready', userId, profile } : { status: 'needsProfile', userId });
}

// Reload my profile (after verifying, editing, closing a deal...)
export async function refreshMe() {
  if (session.status === 'ready' || session.status === 'needsProfile') await loadProfile(session.userId);
}

export async function startDemo(role: Role) {
  await loadProfile(demoUserIds[role]);
}

export async function signOut() {
  if (isLive) await supabase.auth.signOut();
  set({ status: 'signedOut' });
}

// ---------- Live mode: email code login ----------

export async function sendLoginCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw new Error(error.message);
}

export async function verifyLoginCode(email: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw new Error(error.message);
  if (data.user) await loadProfile(data.user.id);
}

if (isLive) {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) loadProfile(data.session.user.id);
    else set({ status: 'signedOut' });
  });
  supabase.auth.onAuthStateChange((event, s) => {
    if (event === 'SIGNED_OUT' || !s) set({ status: 'signedOut' });
  });
}

// Keep my profile fresh when anything about profiles changes
backend.subscribe('profiles', () => {
  refreshMe();
});
