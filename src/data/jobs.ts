// Hiring posts: how they're described, checked and summarized. No React here, so it's easy to test.
import { formatPerks, getService } from './catalog';
import { FeedPost, Job, OfferTerms, Profile, ServiceId } from './types';

export const MAX_QUANTITY = 20;
export const MAX_HIRES = 50;
export const MAX_DESCRIPTION = 2000;
export const MAX_PERK_LENGTH = 40;

// How long the work takes. Optional; tap again to clear.
export const timeframeOptions = ['Within a week', '1–2 weeks', '2–4 weeks', '1–2 months'];

// "3 Instagram Reels", "1 Google Maps video"
export function deliverablesLabel(serviceId: ServiceId, quantity: number): string {
  const s = getService(serviceId);
  return `${quantity} ${quantity === 1 ? s.name : s.plural}`;
}

// "2026-12-12" -> Date at local midnight (avoids the UTC shift of new Date("2026-12-12"))
export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "Dec 12" (adds the year when it isn't this year)
export function formatDay(day: string, now = new Date()): string {
  const d = parseDay(day);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) };
  return d.toLocaleDateString('en-US', opts);
}

// The deadline as shown: a real date on new posts, free text on older ones
export function deadlineLabel(job: Job): string | undefined {
  return job.deadline ? formatDay(job.deadline) : job.postBy;
}

// One line under the title: "3 Instagram Reels · 1–2 weeks · by Dec 12"
export function jobSummary(job: Job): string {
  const deadline = deadlineLabel(job);
  return [deliverablesLabel(job.serviceId, job.quantity), job.timeframe, deadline ? `by ${deadline}` : null].filter(Boolean).join(' · ');
}

// Pay on a job post is always per creator, never a pot split between them.
// "$50 per creator + 2 pastries" · "Open to offers + a drink"
export function payLabel(job: Job): string {
  const perks = job.perks.length ? ` + ${formatPerks(job.perks)}` : '';
  if (job.budget === null) return `Open to offers${perks}`;
  if (job.budget <= 0) return `Perks only: ${formatPerks(job.perks)}`;
  return `$${job.budget} per creator${perks}`;
}

// One creator's terms: "2 Instagram Reels · $60 + a drink · due Dec 20"
export function offerTermsLine(t: Pick<OfferTerms, 'serviceId' | 'quantity' | 'price' | 'perks'> & { postBy?: string }): string {
  const pay = t.price > 0 ? `$${t.price}` : 'Perks only';
  const perks = t.perks.length ? ` + ${formatPerks(t.perks)}` : '';
  const due = t.postBy && t.postBy !== 'Flexible' ? ` · due ${t.postBy}` : '';
  return `${deliverablesLabel(t.serviceId, t.quantity)} · ${pay}${perks}${due}`;
}

// A post's terms as a starting offer for someone who applied
export function termsFromJob(job: Job): Partial<OfferTerms> {
  return { serviceId: job.serviceId, quantity: job.quantity, price: job.budget ?? undefined, perks: job.perks, postBy: deadlineLabel(job) };
}

export function hiresLabel(job: Job): string | null {
  return job.hires ? `Hiring ${job.hires} ${job.hires === 1 ? 'creator' : 'creators'}` : null;
}

// Application count on a post.
// The business sees the exact number on its own posts. Creators see a rough number, and only
// from 3 up, so the first people to apply aren't put off by "1 applied".
export function applicationCountLabel(count: number | undefined, isOwner: boolean): string | null {
  const n = count ?? 0;
  if (isOwner) return `${n} ${n === 1 ? 'application' : 'applications'}`;
  if (n < 3) return null;
  const step = [50, 25, 10, 5, 3].find((s) => n >= s)!;
  return `${step}+ applied`;
}

export type JobDraft = {
  caption: string;
  job: Job;
};

// Returns what's missing or wrong, in plain words. Empty = OK to post.
export type JobField = 'title' | 'pay' | 'deliverables' | 'description' | 'deadline' | 'hires';
export type JobError = { field: JobField; message: string };

// What's missing or wrong, each tied to the field it belongs to so the form can show it there.
// Empty = OK to post.
export function validateJob({ caption, job }: JobDraft, today = new Date()): JobError[] {
  const errors: JobError[] = [];
  const add = (field: JobField, message: string) => errors.push({ field, message });
  if (!caption.trim()) add('title', 'Add a title, e.g. “3 Reels of our new menu”.');
  if (job.budget !== null && job.budget <= 0 && job.perks.length === 0) add('pay', 'Enter a price, pick a perk, or choose Open to offers.');
  if (job.perks.some((p) => !p.trim() || p.length > MAX_PERK_LENGTH)) add('pay', `Keep each perk under ${MAX_PERK_LENGTH} characters.`);
  if (!Number.isInteger(job.quantity) || job.quantity < 1 || job.quantity > MAX_QUANTITY) add('deliverables', `Choose 1 to ${MAX_QUANTITY}.`);
  if (!job.description?.trim()) add('description', 'Say what the creator would film or post.');
  if ((job.description?.length ?? 0) > MAX_DESCRIPTION) add('description', `Shorten this to ${MAX_DESCRIPTION} characters.`);
  if (job.deadline && parseDay(job.deadline) < new Date(today.getFullYear(), today.getMonth(), today.getDate())) add('deadline', 'Pick a date from today on, or clear it.');
  if (job.hires != null && (!Number.isInteger(job.hires) || job.hires < 1 || job.hires > MAX_HIRES)) add('hires', `Choose 1 to ${MAX_HIRES}, or Not decided.`);
  return errors;
}

// The message a creator starts from when they tap Apply. They can change all of it before sending.
// It names the post, restates what's being asked so both sides start from the same page, and adds
// the pitch the creator wrote themselves (Settings). We never write a pitch for them.
export function defaultApplicationMessage(me: Profile, post: FeedPost): string {
  const lines = [`Hi ${post.author.name}! I'd like to apply for "${post.caption}".`];
  if (post.job) {
    const deadline = deadlineLabel(post.job);
    lines.push(`I'm interested in making the ${deliverablesLabel(post.job.serviceId, post.job.quantity).replace(/^1 /, '')}${deadline ? `, due ${deadline}` : ''}.`);
  }
  const pitch = me.pitch?.trim();
  if (pitch) lines.push('', pitch);
  return lines.join('\n');
}
