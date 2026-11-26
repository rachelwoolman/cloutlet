// ─────────────────────────────────────────────────────────────
// Demo data. Used when the app isn't connected to Supabase yet
// (no EXPO_PUBLIC_SUPABASE_URL in .env). Edit freely.
// ─────────────────────────────────────────────────────────────
import { Application, Message, Offer, Post, Profile, Thread } from '../types';

const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?w=${w}&q=70&auto=format&fit=crop`;
const portrait = (id: string) => img(id, 200);

const photos = {
  cafeInterior: img('photo-1554118811-1e0d58224f24'),
  latteCheers: img('photo-1495474472287-4d71bcdd2085'),
  latteArt: img('photo-1509042239860-f550ce710b93'),
  cafeWindow: img('photo-1501339847302-ac426a4a7cbb'),
  cafeTables: img('photo-1521017432531-fbd92d768814'),
  coffeeBeans: img('photo-1442512595331-e89e73853f31'),
  bread: img('photo-1509440159596-0249088772ff'),
  restaurant: img('photo-1517248135467-4c7edcad34c4'),
  barCounter: img('photo-1453614512568-c4024d13c247'),
  espresso: img('photo-1511920170033-f8396924c348'),
  noodles: img('photo-1569718212165-3a8278d5f624'),
  ramenBar: img('photo-1557872943-16a5ac26437e'),
};

const now = Date.now();
const hours = (h: number) => now - h * 3600 * 1000;
// A local date n days from today, "2026-12-12", so sample deadlines never end up in the past
const daysFromNow = (n: number) => {
  const d = new Date(now + n * 86400 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const verifiedAt = '2026-10-01T00:00:00Z';

// Who you are in demo mode
export const demoUserIds = { creator: 'renee', business: 'crumb' } as const;

export const profiles: Profile[] = [
  // ---------- Businesses ----------
  {
    id: 'crumb',
    role: 'business',
    name: 'Crumb & Co.',
    handle: '@crumbandco',
    initials: 'C&C',
    kind: 'Bakery',
    neighborhood: 'U-District',
    bio: 'Odd, lovely pastries. Long tables with outlets.',
    cover: photos.bread,
    location: { lat: 47.6588, lng: -122.3128 },
    collabs: 4,
    pitch: 'We love your style and think it would fit our long tables and fresh pastries. Would you be up for a collab?',
    google: { placeId: 'demo-crumb', address: '4210 University Way NE', rating: 4.7, reviewCount: 212, ownerVerified: true },
  },
  {
    id: 'ravenna-bean',
    role: 'business',
    name: 'Ravenna Bean',
    handle: '@ravennabean',
    initials: 'RB',
    kind: 'Coffee shop',
    neighborhood: 'Ravenna',
    bio: 'New. Great coffee. Lots of empty chairs.',
    cover: photos.cafeWindow,
    location: { lat: 47.6762, lng: -122.304 },
    collabs: 1,
    google: { placeId: 'demo-rb', address: '6512 Ravenna Ave NE', rating: 4.9, reviewCount: 9, ownerVerified: true },
  },
  {
    id: 'folio',
    role: 'business',
    name: 'Folio Books',
    handle: '@foliobooks',
    initials: 'FB',
    kind: 'Bookstore cafe',
    neighborhood: 'U-District',
    bio: 'Used books, good tea, quiet corners.',
    cover: photos.cafeTables,
    location: { lat: 47.6605, lng: -122.3135 },
    collabs: 2,
    google: { placeId: 'demo-folio', address: '4318 University Way NE', rating: 4.6, reviewCount: 88, ownerVerified: true },
  },
  {
    id: 'matcha-moto',
    role: 'business',
    name: 'Matcha Moto',
    handle: '@matchamoto',
    initials: 'MM',
    kind: 'Matcha bar',
    neighborhood: 'U-District',
    bio: 'Whisked to order. Very green.',
    cover: photos.latteArt,
    location: { lat: 47.6625, lng: -122.315 },
    collabs: 1,
    google: { placeId: 'demo-mm', address: '1307 NE 45th St', rating: 4.5, reviewCount: 140, ownerVerified: true },
  },
  {
    id: 'hilltop',
    role: 'business',
    name: 'Hilltop Noodle',
    handle: '@hilltopnoodle',
    initials: 'HN',
    kind: 'Noodle bar',
    neighborhood: 'Capitol Hill',
    bio: 'Hand-pulled noodles. Open late.',
    cover: photos.restaurant,
    location: { lat: 47.6239, lng: -122.3201 },
    collabs: 0,
    google: { placeId: 'demo-hn', address: '512 E Pine St', rating: 4.4, reviewCount: 61, ownerVerified: false },
  },

  // ---------- Creators ----------
  {
    id: 'renee',
    role: 'creator',
    name: 'Renee Park',
    handle: '@renee.reels',
    avatar: portrait('photo-1494790108377-be9c29b29330'),
    neighborhood: 'U-District',
    location: { lat: 47.6615, lng: -122.3132 },
    niche: 'Study & cafe vlogs',
    bio: 'Calm study vlogs. Cozy cafe finds.',
    followers: 4200,
    engagement: 8.1,
    collabs: 6,
    replyTime: 'Replies in ~1h',
    openToPerksOnly: true,
    availability: 'open',
    pitch: "I film calm, cozy study vlogs that make people want to spend an afternoon somewhere. Most of my audience is UW students within a mile of the Ave.",
    instagram: { username: 'renee.reels', followers: 4200, verifiedAt },
    tiktok: { username: 'renee.reels', followers: 2900, verifiedAt },
  },
  {
    id: 'marcus',
    role: 'creator',
    name: 'Marcus Lee',
    handle: '@marcuseats',
    avatar: portrait('photo-1507003211169-0a1dd7228f2d'),
    neighborhood: 'Ballard',
    location: { lat: 47.6687, lng: -122.3846 },
    niche: 'Cheap eats',
    bio: 'Eating well for under $15.',
    followers: 6800,
    engagement: 6.4,
    collabs: 9,
    replyTime: 'Replies in ~1d',
    openToPerksOnly: false,
    availability: 'closed',
    services: ['reel', 'maps'],
    tiktok: { username: 'marcuseats', followers: 6800, verifiedAt },
  },
  {
    id: 'priya',
    role: 'creator',
    name: 'Priya Shah',
    handle: '@priyasips',
    avatar: portrait('photo-1438761681033-6461ffad8d80'),
    neighborhood: 'Capitol Hill',
    location: { lat: 47.6253, lng: -122.3222 },
    niche: 'Matcha & desserts',
    bio: 'Every matcha in Seattle, rated.',
    followers: 3100,
    engagement: 9.2,
    collabs: 4,
    replyTime: 'Replies in ~3h',
    openToPerksOnly: true,
    availability: 'open',
    instagram: { username: 'priyasips', followers: 3100, verifiedAt },
  },
  {
    id: 'jordan',
    role: 'creator',
    name: 'Jordan Tran',
    handle: '@jordanreads',
    avatar: portrait('photo-1500648767791-00dcc994a43e'),
    neighborhood: 'Fremont',
    location: { lat: 47.651, lng: -122.3505 },
    niche: 'Books & quiet places',
    bio: 'Where to read and what to sip.',
    followers: 1500,
    engagement: 11.3,
    collabs: 2,
    replyTime: 'Replies in ~1d',
    openToPerksOnly: true,
    availability: 'closed',
    instagram: { username: 'jordanreads', followers: 1500, verifiedAt },
  },
  {
    id: 'dana',
    role: 'creator',
    name: 'Dana Kim',
    handle: '@danabakes',
    avatar: portrait('photo-1544005313-94ddf0286df2'),
    neighborhood: 'Ballard',
    location: { lat: 47.6687, lng: -122.3846 },
    niche: 'Bakery reviews',
    bio: 'Honest bakery reviews.',
    followers: 6400,
    engagement: 7.8,
    collabs: 7,
    replyTime: 'Replies in ~3h',
    openToPerksOnly: false,
    availability: 'open',
    instagram: { username: 'danabakes', followers: 6400, verifiedAt },
  },
  {
    id: 'lee',
    role: 'creator',
    name: 'Lee Wong',
    handle: '@studywithlee',
    avatar: portrait('photo-1517841905240-472988babdf9'),
    neighborhood: 'Ravenna',
    location: { lat: 47.6755, lng: -122.3045 },
    niche: 'Study with me',
    bio: 'Two-hour study sessions in hidden cafes.',
    followers: 900,
    engagement: 12.4,
    collabs: 0,
    replyTime: 'Replies in ~1d',
    openToPerksOnly: true,
    availability: 'open',
  },
];

export const posts: Post[] = [
  // Creator work (some booked through Cloutlet, so both sides are linked)
  { id: 'r1', kind: 'video', authorId: 'renee', caption: 'Studying till close at a hidden bakery', image: photos.cafeInterior, duration: '0:28', createdAt: hours(5), likes: 412, views: 3900, collabBusinessId: 'crumb' },
  { id: 'r2', kind: 'video', authorId: 'renee', caption: 'Finals week HQ', image: photos.cafeTables, duration: '0:31', createdAt: hours(60), likes: 380, views: 4100, collabBusinessId: 'folio' },
  { id: 'm1', kind: 'video', authorId: 'marcus', caption: '$10 lunch tour of Ballard', image: photos.restaurant, duration: '0:19', createdAt: hours(20), likes: 650, views: 7200 },
  { id: 'p1', kind: 'video', authorId: 'priya', caption: 'Best matcha on the Ave?', image: photos.latteArt, duration: '0:15', createdAt: hours(9), likes: 290, views: 2100, collabBusinessId: 'matcha-moto' },
  { id: 'j1', kind: 'video', authorId: 'jordan', caption: 'Finals week, but cozy', image: photos.cafeTables, duration: '0:26', createdAt: hours(30), likes: 170, views: 1300, collabBusinessId: 'folio' },
  { id: 'd1', kind: 'video', authorId: 'dana', caption: 'The cardamom bun', image: photos.bread, duration: '0:29', createdAt: hours(14), likes: 540, views: 5800, collabBusinessId: 'crumb' },
  { id: 'l1', kind: 'video', authorId: 'lee', caption: 'Study with me, 2h', image: photos.cafeWindow, duration: '0:24', createdAt: hours(3), likes: 95, views: 700, collabBusinessId: 'ravenna-bean' },
  { id: 'p2', kind: 'video', authorId: 'priya', caption: 'Latte art, ranked', image: photos.latteCheers, duration: '0:12', createdAt: hours(80), likes: 210, views: 1900 },
  { id: 'd2', kind: 'video', authorId: 'dana', caption: 'Croissant power rankings', image: photos.cafeInterior, duration: '0:52', createdAt: hours(100), likes: 480, views: 6100 },

  // Business job posts (shown over the business's own photo)
  // job1-3 are older posts: free-text "post by" date instead of a real deadline
  { id: 'job1', kind: 'job', authorId: 'ravenna-bean', caption: 'Film a quiet afternoon here', image: photos.cafeWindow, createdAt: hours(7), likes: 40, views: 600, job: { serviceId: 'maps', quantity: 1, description: 'Come by on a weekday afternoon and film the slow, sunny hours: the window seats, the bar, someone pulling a shot. One short video for our Google listing.', budget: 80, perks: ['A drink'], postBy: 'Dec 3', timeframe: 'Within a week', hires: 1 }, media: [photos.cafeWindow, photos.barCounter, photos.espresso, photos.coffeeBeans].map((uri) => ({ uri, type: 'image' as const })) },
  { id: 'job2', kind: 'job', authorId: 'hilltop', caption: 'Late-night noodle Reel', image: photos.restaurant, createdAt: hours(26), likes: 22, views: 340, job: { serviceId: 'reel', quantity: 2, description: 'We are open until 2am and want people to know it. Two Reels showing the late crowd, the steam off the bowls and the open kitchen. Come any night after 10pm.', budget: null, perks: ['Lunch for two'], postBy: 'Dec 10', hires: 3 }, media: [photos.restaurant, photos.noodles, photos.ramenBar].map((uri) => ({ uri, type: 'image' as const })) },
  { id: 'job3', kind: 'job', authorId: 'matcha-moto', caption: 'Stories for our hojicha menu', image: photos.latteArt, createdAt: hours(50), likes: 31, views: 410, job: { serviceId: 'stories', quantity: 1, description: 'One set of stories trying our new hojicha drinks. Tag us and we will reshare.', budget: 25, perks: ['Free brunch'], postBy: 'Nov 30' } },
  // Crumb & Co. (the demo business) has two posts with different applicants
  {
    id: 'job4', kind: 'job', authorId: 'crumb', caption: 'Finals-week study Reels', image: photos.cafeTables, createdAt: hours(20), likes: 18, views: 250,
    job: {
      serviceId: 'reel', quantity: 3, budget: 50, perks: ['2 pastries', 'Free refills all week'], deadline: daysFromNow(14), timeframe: '1–2 weeks', hires: 2,
      description:
        'Finals are coming and our long tables fill up with students every night. We want three short Reels that show what studying here is like: the outlets at every seat, the quiet back room, free refills, and the late-night pastry case.\n\n' +
        'What we are looking for:\n• One Reel of a full study session (time-lapse is great)\n• One Reel about the pastry case and drinks\n• One "study spots near UW" style Reel that includes us\n\n' +
        'Film any weekday between 6pm and 11pm. We will save you a seat by the window and the drinks and pastries are on us while you film. Please tag @crumbandco and use the location tag. Happy to talk through ideas before you start.',
    },
    media: [photos.cafeTables, photos.bread, photos.cafeInterior].map((uri) => ({ uri, type: 'image' as const })),
  },
  {
    id: 'job5', kind: 'job', authorId: 'crumb', caption: 'Holiday pastry box Stories', image: photos.bread, createdAt: hours(44), likes: 9, views: 120,
    job: { serviceId: 'stories', quantity: 2, budget: null, perks: ['A holiday pastry box to take home'], deadline: daysFromNow(24), description: 'Two story sets unboxing our holiday pastry box. Pick it up any morning; the box is yours to keep.' },
  },
  // Filled and archived: only on Crumb & Co.'s jobs list under Archived
  {
    id: 'job6', kind: 'job', authorId: 'crumb', caption: 'Back-to-school Maps video', image: photos.cafeInterior, createdAt: hours(900), likes: 12, views: 200, archived: true,
    job: { serviceId: 'maps', quantity: 1, budget: 40, perks: ['A drink'], postBy: 'Sep 15', description: 'One Google Maps video of the morning rush.' },
  },
];

export const offers: Offer[] = [
  { id: 'o1', businessId: 'crumb', creatorId: 'renee', serviceId: 'reel', quantity: 1, price: 50, perks: ['2 pastries', 'A drink'], postBy: 'Nov 28', status: 'pending', lastProposedBy: 'business', threadId: 't1', createdAt: hours(2), updatedAt: hours(2) },
  { id: 'o2', businessId: 'ravenna-bean', creatorId: 'renee', serviceId: 'maps', quantity: 1, price: 80, perks: ['A drink'], postBy: 'Dec 3', status: 'pending', lastProposedBy: 'business', threadId: 't2', createdAt: hours(26), updatedAt: hours(26) },
  { id: 'o3', businessId: 'matcha-moto', creatorId: 'renee', serviceId: 'stories', quantity: 1, price: 25, perks: ['Free brunch'], postBy: 'Nov 30', status: 'pending', lastProposedBy: 'business', threadId: 't3', createdAt: hours(72), updatedAt: hours(72) },
];

export const threads: Thread[] = [
  { id: 't1', businessId: 'crumb', creatorId: 'renee', offerId: 'o1', updatedAt: hours(2) },
  { id: 't2', businessId: 'ravenna-bean', creatorId: 'renee', offerId: 'o2', updatedAt: hours(26) },
  { id: 't3', businessId: 'matcha-moto', creatorId: 'renee', offerId: 'o3', updatedAt: hours(72) },
  // Applicants to Crumb & Co.'s posts
  { id: 't4', businessId: 'crumb', creatorId: 'marcus', updatedAt: hours(10) },
  { id: 't5', businessId: 'crumb', creatorId: 'priya', updatedAt: hours(6) },
  { id: 't6', businessId: 'crumb', creatorId: 'dana', updatedAt: hours(30) },
  // A casual chat: Lee wrote without applying to anything
  { id: 't7', businessId: 'crumb', creatorId: 'lee', updatedAt: hours(4) },
];

export const applications: Application[] = [
  { id: 'ap1', postId: 'job4', creatorId: 'marcus', businessId: 'crumb', threadId: 't4', createdAt: hours(10) },
  { id: 'ap2', postId: 'job4', creatorId: 'priya', businessId: 'crumb', threadId: 't5', createdAt: hours(6) },
  { id: 'ap3', postId: 'job5', creatorId: 'dana', businessId: 'crumb', threadId: 't6', createdAt: hours(30) },
];

export const messages: Message[] = [
  { id: 'msg1', threadId: 't1', senderId: 'crumb', kind: 'offer', body: 'Finals-week Reel at our long tables?', price: 50, perks: ['2 pastries', 'A drink'], createdAt: hours(2) },
  { id: 'msg2', threadId: 't2', senderId: 'ravenna-bean', kind: 'offer', body: "We're new and barely on Maps. A quiet-afternoon video would help a lot.", price: 80, perks: ['A drink'], createdAt: hours(26) },
  { id: 'msg3', threadId: 't3', senderId: 'matcha-moto', kind: 'offer', body: 'Three stories on our hojicha menu? Brunch is on us.', price: 25, perks: ['Free brunch'], createdAt: hours(72) },
  { id: 'msg4', threadId: 't4', senderId: 'marcus', kind: 'application', postId: 'job4', body: 'Hi Crumb & Co.! I\'d like to apply for "Finals-week study Reels". I film study-with-me videos around UW and can do evenings next week.', createdAt: hours(10) },
  { id: 'msg5', threadId: 't5', senderId: 'priya', kind: 'application', postId: 'job4', body: 'Hi! Latte art and cozy study spots are my whole page. Would love to do these three.', createdAt: hours(6) },
  { id: 'msg6', threadId: 't6', senderId: 'dana', kind: 'application', postId: 'job5', body: 'Hi Crumb & Co.! Pastry content is my favorite. I can pick the box up this weekend.', createdAt: hours(30) },
  { id: 'msg7', threadId: 't7', senderId: 'lee', kind: 'text', body: 'Hey! Big fan of your cardamom buns. Would you ever want a study video at your place?', createdAt: hours(4) },
];

// Bells turned on: creators who get an update when these businesses post a job
export const follows: { creatorId: string; businessId: string }[] = [
  { creatorId: 'renee', businessId: 'ravenna-bean' },
  { creatorId: 'renee', businessId: 'matcha-moto' },
];

// Job updates already sent (Inbox > Updates)
export const alerts: { id: string; recipientId: string; postId: string; createdAt: number; read: boolean }[] = [
  { id: 'a1', recipientId: 'renee', postId: 'job1', createdAt: hours(7), read: false },
  { id: 'a2', recipientId: 'renee', postId: 'job3', createdAt: hours(50), read: false },
];

// Cloutlet reviews (creators rating businesses after a deal). Each business's
// rating is worked out from these, so the number always matches what you can read.
export const reviews: { id: string; revieweeId: string; reviewerId: string; stars: number; body: string; createdAt: number; serviceId?: 'reel' | 'maps' | 'stories' }[] = [
  { id: 'rv1', revieweeId: 'crumb', reviewerId: 'renee', stars: 5, body: 'Super easy to work with. They saved me the long table by the outlets and paid the same day.', createdAt: hours(120), serviceId: 'reel' },
  { id: 'rv2', revieweeId: 'crumb', reviewerId: 'dana', stars: 5, body: 'Clear brief, great pastries, and they reshared my video right away.', createdAt: hours(300), serviceId: 'reel' },
  { id: 'rv3', revieweeId: 'crumb', reviewerId: 'marcus', stars: 4, body: 'Good collab. The lighting at the counter is tricky in the afternoon, so come early.', createdAt: hours(700), serviceId: 'stories' },
  { id: 'rv4', revieweeId: 'ravenna-bean', reviewerId: 'lee', stars: 5, body: 'The owner is lovely and gave me free rein. Quiet space, perfect for a study video.', createdAt: hours(90), serviceId: 'maps' },
  { id: 'rv5', revieweeId: 'ravenna-bean', reviewerId: 'jordan', stars: 5, body: 'Fast replies and a fair rate for a new shop.', createdAt: hours(400), serviceId: 'maps' },
  { id: 'rv6', revieweeId: 'folio', reviewerId: 'renee', stars: 5, body: 'Best study spot on the Ave. They knew exactly what they wanted.', createdAt: hours(200), serviceId: 'reel' },
  { id: 'rv7', revieweeId: 'folio', reviewerId: 'jordan', stars: 4, body: 'Nice people. Took a few days to confirm the date, but the shoot went smoothly.', createdAt: hours(500), serviceId: 'reel' },
  { id: 'rv8', revieweeId: 'matcha-moto', reviewerId: 'priya', stars: 5, body: 'They let me try the whole hojicha menu. Very creator-friendly.', createdAt: hours(150), serviceId: 'stories' },
  { id: 'rv9', revieweeId: 'matcha-moto', reviewerId: 'dana', stars: 4, body: 'Good brief. Brunch perk was generous.', createdAt: hours(600), serviceId: 'stories' },
];
