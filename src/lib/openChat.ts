// Open the chat with someone. If you've never talked, this opens an empty composer and
// nothing is created until you send something (see backend.startChat).
//  - via: 'feed' when opened from a post, profile or the map
//  - offer: true opens the offer sheet in the chat (business: Request collab)
//  - draft: text put in the message box (not sent)
import { router } from 'expo-router';
import { backend } from '../data/hooks';
import { Profile } from '../data/types';

export async function openChat(me: Profile, otherId: string, opts: { via?: 'feed'; draft?: string; offer?: boolean } = {}) {
  const id = await backend.findThread(me, otherId);
  const extra: Record<string, string> = {};
  if (opts.via) extra.via = opts.via;
  if (opts.offer) extra.offer = '1';
  // A draft only makes sense in a chat you haven't started yet
  if (opts.draft && !id) extra.draft = opts.draft;
  router.push({ pathname: '/chat/[id]', params: id ? { id, ...extra } : { id: 'new', with: otherId, ...extra } });
}

// Business > Request collab on a creator's profile or video: open the chat with the offer sheet.
// Their default message (Settings) goes in the message box of a new chat, to send or delete.
export function requestCollab(me: Profile, creator: { id: string; name: string }) {
  const draft = me.pitch ? `Hi ${creator.name.split(' ')[0]}! ${me.pitch}` : undefined;
  return openChat(me, creator.id, { offer: true, draft });
}
