/// <reference types="jest" />
/* eslint-disable @typescript-eslint/no-require-imports */
// Screen tests: render the real screens against the demo backend, as a business and as a creator.
// One shared copy of the demo data, so each test uses different people.
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
let mockParams: Record<string, string> = {};
let mockMe: any;
jest.mock('expo-router', () => ({ router: mockRouter, useLocalSearchParams: () => mockParams }));
jest.mock('../data/session', () => ({ useMe: () => mockMe }));

const { demoBackend: b } = require('../data/demo/demoBackend');
const Chat = require('../app/chat/[id]').default;
const Inbox = require('../app/(tabs)/inbox').default;
const ManagePost = require('../app/post/[id]').default;
const Jobs = require('../app/jobs/[id]').default;
const { ProfileView } = require('../components/ProfileView');
const { JobForm } = require('../components/PostForms');

const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 250)); });
const as = async (id: string) => (mockMe = await b.getProfile(id));
const open = async (el: React.ReactElement, params: Record<string, string> = {}) => {
  mockParams = params;
  await render(el);
  await settle();
};
const press = async (text: string) => {
  await fireEvent.press(screen.getByText(text));
  await settle();
};

beforeEach(() => jest.clearAllMocks());

describe('business chat, path A: the creator applied to a post', () => {
  test('shows the post terms; proposing them sends an offer from that post, with no message', async () => {
    await as('crumb');
    await open(<Chat />, { id: 't4' }); // Marcus applied to "Finals-week study Reels"
    expect(screen.getByText('Applied to')).toBeTruthy();
    expect(screen.getByText('$50 per creator + 2 pastries + free refills all week · Hiring 2 creators')).toBeTruthy();
    expect(screen.queryByLabelText('Send an offer')).toBeNull(); // not the casual-chat button
    expect(screen.queryByText('Send an offer')).toBeNull();

    await press('Propose these terms');
    expect(screen.getByText('Review')).toBeTruthy();
    expect(screen.getByText('3 Instagram Reels · $50 + 2 pastries + free refills all week · due ' + require('../data/jobs').deadlineLabel((await b.getPost('job4')).job))).toBeTruthy();
    await press('Send offer');

    const t = await b.getThread('t4');
    expect(t.offer).toMatchObject({ postId: 'job4', quantity: 3, price: 50, status: 'pending' });
    const last = (await b.listMessages('t4')).at(-1);
    expect(last).toMatchObject({ kind: 'offer', body: '', postId: 'job4' });
    // The proposal shows as a terms card: label, where it came from, deliverables, pay, perks, due date
    expect(screen.getByText('PROPOSED TERMS')).toBeTruthy();
    expect(screen.getByText('From Finals-week study Reels')).toBeTruthy();
    expect(screen.getByText('+ 2 pastries · Free refills all week')).toBeTruthy();
    expect(screen.getByText('Due ' + require('../data/jobs').deadlineLabel((await b.getPost('job4')).job))).toBeTruthy();
  });

  test('Change terms updates the same offer in place (no new offer, no navigation)', async () => {
    await as('crumb');
    await open(<Chat />, { id: 't4' });
    const before = (await b.getThread('t4')).offer.id;
    await press('Change terms');
    expect(screen.getAllByText('Change terms')).toHaveLength(2); // the button, and the sheet's title
    await fireEvent.press(screen.getByLabelText('More deliverables'));
    await press('Review');
    expect(screen.getByText('New terms for Marcus')).toBeTruthy();
    await press('Send new terms');

    const t = await b.getThread('t4');
    expect(t.offer).toMatchObject({ id: before, quantity: 4, status: 'pending' });
    expect((await b.listOffers(mockMe)).filter((o: any) => o.creatorId === 'marcus')).toHaveLength(1);
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(screen.getByText('UPDATED TERMS')).toBeTruthy();
    expect(screen.getByText('4 Instagram Reels')).toBeTruthy();
  });

  test('the creator sees what they applied to, read only', async () => {
    await as('priya');
    await open(<Chat />, { id: 't5' });
    expect(screen.getByText('You applied to')).toBeTruthy();
    expect(screen.queryByText('Propose these terms')).toBeNull();
    expect(screen.queryByLabelText('Send an offer')).toBeNull();
  });
});

describe('business chat, path B: a casual message', () => {
  test('Offer sits by the message box; review first; individual terms only; no message sent', async () => {
    await as('crumb');
    await open(<Chat />, { id: 't7' }); // Lee wrote without applying
    expect(screen.queryByText('Applied to')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Send an offer'));
    await settle();
    expect(screen.getByText('Offer to Lee')).toBeTruthy();
    expect(screen.queryByText(/Creators to hire|Hiring/)).toBeNull(); // no post-level fields
    await press('Review');
    expect(screen.getByText('To Lee')).toBeTruthy();
    await press('Send offer');

    const t = await b.getThread('t7');
    expect(t.offer).toMatchObject({ status: 'pending' });
    expect(t.offer.postId).toBeUndefined();
    expect(t.applications).toEqual([]); // still not an application
    const kinds = (await b.listMessages('t7')).map((m: any) => m.kind);
    expect(kinds).toEqual(['text', 'offer']); // Lee's message, then the offer. Nothing added for the business.
  });
});

describe('creating a hiring post', () => {
  test('specific errors under the fields; pay is per creator; then it posts', async () => {
    await as('crumb');
    const done = jest.fn();
    await open(<JobForm onDone={done} />);
    await press('Post job');
    expect(screen.getByText('Add a title, e.g. “3 Reels of our new menu”.')).toBeTruthy();
    expect(screen.getByText('Say what the creator would film or post.')).toBeTruthy();
    expect(screen.getByText('Fix 2 things above to post.')).toBeTruthy();
    expect(done).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Title'), 'Weekend brunch Reels');
    await fireEvent.changeText(screen.getByLabelText('Details'), 'Film brunch on Saturday.');
    await press('More options');
    await press('Set a number');
    await fireEvent.press(screen.getByLabelText('More creators'));
    expect(screen.getByText('Each of the 2 creators gets $50. It isn’t split.')).toBeTruthy();
    await press('Post job');
    expect(done).toHaveBeenCalled();
    const post = (await b.listPostsFor('crumb')).find((p: any) => p.caption === 'Weekend brunch Reels');
    expect(post.job).toMatchObject({ hires: 2, budget: 50, quantity: 1 });
  });
});

describe('business inbox', () => {
  test('one Messages list with filters; Applicants newest first, by job and size', async () => {
    await as('crumb');
    await open(<Inbox />);
    expect(screen.queryByText('Applicants', { exact: true })).toBeTruthy(); // a filter, not a separate tab
    expect(screen.getByText('Requested collabs')).toBeTruthy();
    await press('Applicants');
    const names = screen.getAllByText(/^(Marcus Lee|Priya Shah|Dana Kim)$/).map((n) => n.props.children);
    expect(names).toEqual(['Priya Shah', 'Marcus Lee', 'Dana Kim']); // newest application first
    await press('Holiday pastry box Stories');
    expect(screen.queryByText('Marcus Lee')).toBeNull();
    expect(screen.getByText('Dana Kim')).toBeTruthy();
    await press('All jobs');
    await press('Under 2K');
    expect(screen.getByText('No applicants match')).toBeTruthy();
  });
});

describe('business profile and jobs', () => {
  test('Active jobs (3 newest, not archived) with a route to all and archived', async () => {
    await as('crumb');
    await open(<ProfileView id="crumb" asTab />);
    expect(screen.getByText('Active jobs')).toBeTruthy();
    expect(screen.queryByText('Back-to-school Maps video')).toBeNull(); // archived
    expect(screen.getByText('Collab videos')).toBeTruthy();
    expect(screen.queryByText('Posts')).toBeNull();
    await press(screen.queryByText(/^View all \d+$/) ? (screen.getByText(/^View all \d+$/).props.children as string) : 'View all and archived');
    expect(mockRouter.push).toHaveBeenCalledWith('/jobs/crumb');

    await open(<Jobs />, { id: 'crumb' });
    await press('Archived · 1');
    expect(screen.getByText('Back-to-school Maps video')).toBeTruthy();
  });

  test('Manage post: views and applications, no "opened in full screen", archive', async () => {
    await as('crumb');
    await open(<ManagePost />, { id: 'job5' });
    expect(screen.getByText('Views')).toBeTruthy();
    expect(screen.getByText('Applications')).toBeTruthy();
    expect(screen.queryByText(/full screen/i)).toBeNull();
    await press('Archive');
    expect((await b.getPost('job5')).archived).toBe(true);
    expect(screen.getByText('Reopen')).toBeTruthy();
    await press('Reopen');
  });

  test('a creator sees the business’s active jobs but no manage tools', async () => {
    await as('renee');
    await open(<ProfileView id="crumb" />);
    expect(screen.getByText('Active jobs')).toBeTruthy();
    expect(screen.queryByText('New job')).toBeNull();
    expect(screen.queryByText(/application/)).toBeNull();
  });
});
