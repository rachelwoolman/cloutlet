// The message a creator sends when they tap "Message" on a job post:
// a greeting, which job it's about, and the pitch they wrote themselves (Settings).
// We never write a pitch for them. They can edit the whole message before sending.
import { FeedPost, Profile } from './types';

export const pitchTips = 'Tip: mention your niche, where you’re based, who watches your videos, and what you’re best at.';

export function jobMessage(me: Profile, post: FeedPost): string {
  const lines = [`Hi ${post.author.name}! I saw your post "${post.caption}".`];
  const pitch = me.pitch?.trim();
  if (pitch) lines.push('', pitch);
  return lines.join('\n');
}
