/// <reference types="jest" />
// The hiring flows, run against the demo backend (same rules as the Supabase functions).
// Each test gets a fresh copy of the demo data.
import type { Backend } from '../backend';
import type { Profile } from '../types';

let b: Backend;
let deals: typeof import('../deals');
let jobs: typeof import('../jobs');
let crumb: Profile; // the demo business
let renee: Profile; // the demo creator
let lee: Profile;

beforeEach(async () => {
  // Fresh module state per test (the demo backend keeps its data in memory)
  /* eslint-disable @typescript-eslint/no-require-imports */
  jest.isolateModules(() => {
    b = require('../demo/demoBackend').demoBackend;
    deals = require('../deals');
    jobs = require('../jobs');
  });
  /* eslint-enable @typescript-eslint/no-require-imports */
  crumb = (await b.getProfile('crumb'))!;
  renee = (await b.getProfile('renee'))!;
  lee = (await b.getProfile('lee'))!;
});

const job = (over: Partial<import('../types').Job> = {}) => ({
  serviceId: 'reel' as const,
  quantity: 3,
  description: 'Three Reels of finals week.',
  budget: 50,
  perks: ['2 pastries'],
  ...over,
});

async function postJob(caption: string, over = {}) {
  await b.createPost(crumb, { kind: 'job', caption, job: job(over) });
  return (await b.listPostsFor('crumb')).find((p) => p.caption === caption)!;
}

test('apply and send: one application, counted, in both inboxes, labelled Applied', async () => {
  const post = await postJob('Study Reels');
  const tid = await b.applyToPost(renee, post.id, 'Hi! I would love to do these.');

  expect((await b.getPost(post.id))!.applicationCount).toBe(1);
  const apps = await b.listApplications(crumb);
  expect(apps.filter((a) => a.postId === post.id).map((a) => a.creatorId)).toEqual(['renee']);

  const msgs = await b.listMessages(tid);
  expect(msgs.at(-1)).toMatchObject({ kind: 'application', postId: post.id, senderId: 'renee' });

  const mine = (await b.listThreads(renee)).find((t) => t.id === tid)!;
  expect(mine.applications.map((a) => a.title)).toContain('Study Reels');
  expect((await b.listThreads(crumb)).some((t) => t.id === tid)).toBe(true);

  await expect(b.applyToPost(renee, post.id, 'again')).rejects.toThrow('already applied');
  expect((await b.getPost(post.id))!.applicationCount).toBe(1);
});

test('tap Apply but close without sending: nothing is created', async () => {
  const post = await postJob('Pastry Reels');
  const threadsBefore = (await b.listThreads(crumb)).length;
  // Everything the Apply screen does before Send: read the post, my applications, build the draft
  await b.getPost(post.id);
  await b.listApplications(renee);
  const draft = jobs.defaultApplicationMessage(renee, (await b.getPost(post.id))!);
  expect(draft).toContain('Pastry Reels');

  expect((await b.getPost(post.id))!.applicationCount).toBe(0);
  expect((await b.listApplications(crumb)).some((a) => a.postId === post.id)).toBe(false);
  expect((await b.listThreads(crumb)).length).toBe(threadsBefore);
  // Looking for a chat never creates one either
  expect(await b.findThread(lee, 'folio')).toBeNull();
  expect((await b.listThreads(lee)).some((t) => t.businessId === 'folio')).toBe(false);
});

test('casual message without applying: a chat, but no application and no offer', async () => {
  const tid = await b.startChat(lee, 'folio', 'Love your shop!');
  const t = (await b.getThread(tid))!;
  expect(t.applications).toEqual([]);
  expect(t.offer).toBeUndefined();
  expect(deals.conversationLabel(t, 'business')).toBeNull();
  expect(await b.listApplications(lee)).toEqual([]);
  // Second message goes to the same chat
  expect(await b.startChat(lee, 'folio', 'Also, hi again')).toBe(tid);
});

test('multiple posts with different applicants are kept apart', async () => {
  const apps = await b.listApplications(crumb);
  const by = (postId: string) => apps.filter((a) => a.postId === postId).map((a) => a.creatorId).sort();
  expect(by('job4')).toEqual(['marcus', 'priya']);
  expect(by('job5')).toEqual(['dana']);
  expect((await b.getPost('job4'))!.applicationCount).toBe(2);

  const threads = await b.listThreads(crumb);
  const forPost = (postId: string) => threads.filter((t) => t.applications.some((a) => a.postId === postId)).map((t) => t.creatorId).sort();
  expect(forPost('job4')).toEqual(['marcus', 'priya']);
  // Lee's casual chat has no post
  expect(threads.find((t) => t.creatorId === 'lee')!.applications).toEqual([]);
  // A creator only sees their own applications
  expect((await b.listApplications((await b.getProfile('dana'))!)).map((a) => a.postId)).toEqual(['job5']);
});

test('business starts an offer from a casual chat, revises it, then the 3-step deal', async () => {
  const tid = (await b.findThread(crumb, 'lee'))!; // Lee wrote first (seed)
  const offer = await b.createOffer(crumb, { creatorId: 'lee', serviceId: 'reel', quantity: 2, price: 60, perks: ['A drink'], postBy: 'Dec 20', message: 'Want to do two Reels?' });
  expect(offer.threadId).toBe(tid);
  let t = (await b.getThread(tid))!;
  expect(deals.conversationLabel(t, 'business')?.label).toBe('Offer sent');
  expect(deals.conversationLabel(t, 'creator')?.label).toBe('New offer');

  // No second open offer; change the same one instead
  await expect(b.createOffer(crumb, { creatorId: 'lee', serviceId: 'reel', quantity: 1, price: 10, perks: [], postBy: '', message: '' })).rejects.toThrow('Update it instead');
  await b.respondToOffer(lee, offer.id, 'agreed');
  await b.reviseOffer(crumb, offer.id, { serviceId: 'reel', quantity: 3, price: 80, perks: ['A drink'], postBy: 'Dec 22' }, 'Three instead?');
  t = (await b.getThread(tid))!;
  expect(t.offer).toMatchObject({ id: offer.id, quantity: 3, price: 80, status: 'pending' });
  await expect(b.confirmOffer(crumb, offer.id)).rejects.toThrow(); // creator must accept the new terms first

  await b.respondToOffer(lee, offer.id, 'agreed');
  await b.confirmOffer(crumb, offer.id);
  t = (await b.getThread(tid))!;
  expect(deals.conversationLabel(t, 'business')?.label).toBe('Deal · in progress');
  expect((await b.listOffers(crumb)).filter((o) => o.creatorId === 'lee')).toHaveLength(1);
});

test('creators cannot apply as a business, send offers, or revise', async () => {
  await expect(b.applyToPost(crumb, 'job1', 'hi')).rejects.toThrow('Only creators');
  await expect(b.createOffer(renee, { creatorId: 'renee', serviceId: 'reel', quantity: 1, price: 1, perks: [], postBy: '', message: '' })).rejects.toThrow();
  await expect(b.reviseOffer(renee, 'o1', { serviceId: 'reel', quantity: 1, price: 1, perks: [], postBy: '' }, '')).rejects.toThrow('Not your offer');
});

test('post with multiple intended hires, and editing it later', async () => {
  const post = await postJob('Team Reels', { hires: 3 });
  expect(post.job!.hires).toBe(3);
  expect(jobs.hiresLabel(post.job!)).toBe('Hiring 3 creators');
  await b.updateJob(crumb, post.id, { caption: 'Team Reels', job: { ...post.job!, hires: undefined }, keepMedia: [], newMedia: [] });
  expect((await b.getPost(post.id))!.job!.hires).toBeUndefined();
  expect(jobs.hiresLabel((await b.getPost(post.id))!.job!)).toBeNull();
  await expect(b.updateJob(renee, post.id, { caption: 'x', job: post.job!, keepMedia: [], newMedia: [] })).rejects.toThrow();
});

test('long description is stored whole', async () => {
  const long = 'Film the long tables at night. '.repeat(60).trim(); // ~1,800 characters
  const post = await postJob('Long brief', { description: long });
  expect((await b.getPost(post.id))!.job!.description).toBe(long);
  expect(jobs.validateJob({ caption: 'x', job: job({ description: long }) })).toEqual([]);
  expect(jobs.validateJob({ caption: 'x', job: job({ description: 'a'.repeat(2001) }) })).toEqual([{ field: 'description', message: 'Shorten this to 2000 characters.' }]);
});

test('customized perks are kept and shown', async () => {
  const post = await postJob('Perk Reels', { perks: ['Free refills all week', 'A drink'] });
  expect((await b.getPost(post.id))!.job!.perks).toEqual(['Free refills all week', 'A drink']);
});

test('job validation: each problem is tied to its field, with a specific fix', () => {
  const fields = (over: Partial<import('../types').Job>, caption = 'x') => jobs.validateJob({ caption, job: job(over) }).map((e) => e.field);
  expect(jobs.validateJob({ caption: ' ', job: job() })).toEqual([{ field: 'title', message: 'Add a title, e.g. “3 Reels of our new menu”.' }]);
  expect(fields({ description: ' ' })).toEqual(['description']);
  expect(fields({ quantity: 0 })).toEqual(['deliverables']);
  expect(fields({ budget: 0, perks: [] })).toEqual(['pay']);
  expect(fields({ budget: null, perks: [] })).toEqual([]); // open to offers
  expect(fields({ deadline: '2000-01-01' })).toEqual(['deadline']);
  expect(fields({ hires: 0 })).toEqual(['hires']);
  expect(jobs.jobSummary(job({ deadline: '2030-12-12', timeframe: '1–2 weeks' }))).toBe('3 Instagram Reels · 1–2 weeks · by Dec 12, 2030');
});

test('pay always reads per creator, never split', () => {
  expect(jobs.payLabel(job({ hires: 3 }))).toBe('$50 per creator + 2 pastries');
  expect(jobs.payLabel(job({ budget: null, perks: [] }))).toBe('Open to offers');
  expect(jobs.offerTermsLine({ serviceId: 'reel', quantity: 2, price: 60, perks: ['A drink'], postBy: 'Dec 20' })).toBe('2 Instagram Reels · $60 + a drink · due Dec 20');
});

test('offers carry their full terms on every message, and add no text of their own', async () => {
  const offer = await b.createOffer(crumb, { creatorId: 'jordan', serviceId: 'maps', quantity: 2, price: 70, perks: [], postBy: 'Dec 9', message: '' });
  await b.reviseOffer(crumb, offer.id, { serviceId: 'maps', quantity: 3, price: 90, perks: ['A drink'], postBy: 'Dec 11' }, '');
  const msgs = await b.listMessages(offer.threadId);
  expect(msgs.map((m) => m.kind)).toEqual(['offer', 'counter']);
  expect(msgs.every((m) => m.body === '')).toBe(true);
  expect(msgs[1]).toMatchObject({ serviceId: 'maps', quantity: 3, price: 90, perks: ['A drink'], postBy: 'Dec 11' });
});

test('an offer from an application remembers the post', async () => {
  const offer = await b.createOffer(crumb, { creatorId: 'dana', postId: 'job5', serviceId: 'stories', quantity: 2, price: 30, perks: [], postBy: '', message: '' });
  expect(offer.postId).toBe('job5');
  expect((await b.listMessages(offer.threadId)).at(-1)).toMatchObject({ kind: 'offer', postId: 'job5' });
});

test('archived jobs leave the feed, refuse applications, and stay on the owner list', async () => {
  expect((await b.listFeed()).some((p) => p.id === 'job6')).toBe(false);
  expect((await b.listPostsFor('crumb')).find((p) => p.id === 'job6')!.archived).toBe(true);
  await expect(b.applyToPost(renee, 'job6', 'hi')).rejects.toThrow('closed');
  await b.setArchived(crumb, 'job5', true);
  expect((await b.listFeed()).some((p) => p.id === 'job5')).toBe(false);
  await b.setArchived(crumb, 'job5', false);
  expect((await b.listFeed()).some((p) => p.id === 'job5')).toBe(true);
  await expect(b.setArchived(renee, 'job4', true)).rejects.toThrow();
});

test('views: real events only, once per person per day, not your own', async () => {
  expect((await b.getPost('job4'))!.viewCount).toBe(0); // no made-up starting number
  await b.recordView(renee, 'job4');
  await b.recordView(renee, 'job4');
  await b.recordView(lee, 'job4');
  await b.recordView(crumb, 'job4'); // the business itself
  expect((await b.getPost('job4'))!.viewCount).toBe(2);
});

test('application count: exact for the business, rough and from 3 up for creators', () => {
  expect(jobs.applicationCountLabel(1, true)).toBe('1 application');
  expect(jobs.applicationCountLabel(2, false)).toBeNull();
  expect(jobs.applicationCountLabel(4, false)).toBe('3+ applied');
  expect(jobs.applicationCountLabel(12, false)).toBe('10+ applied');
});
