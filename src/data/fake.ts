// ─────────────────────────────────────────────────────────────
// All of Cloutlet's FAKE data lives here.
// Edit names, prices or photos in this file and the screens update.
// Later, a real backend can replace this file without touching screens.
// ─────────────────────────────────────────────────────────────

// ---------- Types (the "shape" of each thing) ----------

export type ServiceId = 'reel' | 'maps' | 'stories';

export type Service = {
  id: ServiceId;
  name: string;
  description: string;
};

export type AudienceTier = {
  label: string; // "2K – 10K"
  note: string; // "Most local creators"
  minFollowers: number;
  maxFollowers: number | null; // null = no upper limit
};

export type Video = {
  id: string;
  title: string;
  image: string;
  duration: string; // "0:28"
  height: number; // thumbnail height in the feed, so the masonry looks uneven
  businessId?: string; // which business it was made for, if any
};

export type Creator = {
  id: string;
  name: string;
  handle: string;
  neighborhood: string;
  niche: string; // "Study & cafe vlogs"
  bio: string;
  avatar: string;
  followers: number;
  engagement: number; // percent
  collabs: number; // collabs done on Cloutlet
  replyTime: string;
  verified: boolean;
  openToPerksOnly: boolean;
  videos: Video[];
};

export type Business = {
  id: string;
  name: string;
  initials: string;
  kind: string; // "Bakery"
  neighborhood: string;
  distance: string;
  about: string;
  cover: string;
};

export type OfferStatus = 'new' | 'accepted' | 'passed';

export type Offer = {
  id: string;
  businessId: string;
  creatorId: string;
  serviceId: ServiceId;
  price: number;
  perks: string[];
  message: string;
  postBy: string;
  sentAgo: string;
  status: OfferStatus;
};

// ---------- Photos (Unsplash) ----------
// If one stops loading, the app shows a calm grey block instead.
const img = (id: string, w = 600) => `https://images.unsplash.com/${id}?w=${w}&q=70&auto=format&fit=crop`;

const photos = {
  cafeInterior: img('photo-1554118811-1e0d58224f24'),
  latteCheers: img('photo-1495474472287-4d71bcdd2085'),
  latteArt: img('photo-1509042239860-f550ce710b93'),
  cafeWindow: img('photo-1501339847302-ac426a4a7cbb'),
  cafeTables: img('photo-1521017432531-fbd92d768814'),
  coffeeBeans: img('photo-1442512595331-e89e73853f31'),
  bread: img('photo-1509440159596-0249088772ff'),
  restaurant: img('photo-1517248135467-4c7edcad34c4'),
};

const portrait = (id: string) => img(id, 200);

// ---------- Services and pricing ----------

export const services: Service[] = [
  { id: 'reel', name: 'Instagram Reel', description: 'A short vertical video on their feed' },
  { id: 'maps', name: 'Google Maps video', description: 'A short video for your Google listing' },
  { id: 'stories', name: 'Story set (3)', description: 'Three stories, gone in 24 hours' },
];

export const audienceTiers: AudienceTier[] = [
  { label: 'Under 2K', note: 'Newer creators', minFollowers: 0, maxFollowers: 1999 },
  { label: '2K – 10K', note: 'Most local creators', minFollowers: 2000, maxFollowers: 9999 },
  { label: '10K – 50K', note: 'Bigger local reach', minFollowers: 10000, maxFollowers: 49999 },
  { label: '50K+', note: 'Price on request', minFollowers: 50000, maxFollowers: null },
];

// Price for each service, one number per tier above (null = "on request")
export const tierPrices: Record<ServiceId, (number | null)[]> = {
  reel: [25, 50, 120, null],
  maps: [35, 80, 150, null],
  stories: [15, 25, 60, null],
};

export const perkOptions = ['2 pastries', 'A drink', 'Lunch for two', 'Free brunch', 'A tote bag'];

// ---------- Businesses (Seattle, around the U-District) ----------

export const businesses: Business[] = [
  {
    id: 'crumb',
    name: 'Crumb & Co.',
    initials: 'C&C',
    kind: 'Bakery',
    neighborhood: 'U-District',
    distance: '0.4 mi',
    about: 'Strange, lovely pastries and long tables with outlets. The cardamom bun has a fan club.',
    cover: photos.bread,
  },
  {
    id: 'ravenna-bean',
    name: 'Ravenna Bean',
    initials: 'RB',
    kind: 'Coffee shop',
    neighborhood: 'Ravenna',
    distance: '0.9 mi',
    about: 'Opened three months ago. Great coffee, nine Google reviews, and a lot of empty chairs.',
    cover: photos.cafeWindow,
  },
  {
    id: 'folio',
    name: 'Folio Books',
    initials: 'FB',
    kind: 'Bookstore cafe',
    neighborhood: 'U-District',
    distance: '0.2 mi',
    about: 'Used books, good tea, and the quietest corner on the Ave. Finals-week headquarters.',
    cover: photos.cafeTables,
  },
  {
    id: 'matcha-moto',
    name: 'Matcha Moto',
    initials: 'MM',
    kind: 'Matcha bar',
    neighborhood: 'U-District',
    distance: '0.5 mi',
    about: 'Whisked to order. Very green, very photogenic, slightly too many flavors.',
    cover: photos.latteArt,
  },
];

// ---------- Creators ----------

export const creators: Creator[] = [
  {
    id: 'renee',
    name: 'Renee Park',
    handle: '@renee.reels',
    neighborhood: 'U-District',
    niche: 'Study & cafe vlogs',
    bio: 'Calm study vlogs and cozy cafe finds. If it has outlets and good light, I will find it.',
    avatar: portrait('photo-1494790108377-be9c29b29330'),
    followers: 4200,
    engagement: 8.1,
    collabs: 6,
    replyTime: 'Usually replies within an hour',
    verified: true,
    openToPerksOnly: true,
    videos: [
      { id: 'r1', title: 'Studying till close at a hidden U-District bakery', image: photos.cafeInterior, duration: '0:28', height: 230, businessId: 'crumb' },
      { id: 'r2', title: 'A bookstore cafe made for finals week', image: photos.cafeTables, duration: '0:31', height: 180, businessId: 'folio' },
      { id: 'r3', title: 'Rainy afternoon, cardamom buns', image: photos.bread, duration: '0:22', height: 200 },
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus Lee',
    handle: '@marcuseats',
    neighborhood: 'Ballard',
    niche: 'Cheap eats tours',
    bio: 'Feeding you for under $15. Ballard born, U-District adjacent.',
    avatar: portrait('photo-1507003211169-0a1dd7228f2d'),
    followers: 6800,
    engagement: 6.4,
    collabs: 9,
    replyTime: 'Usually replies within a day',
    verified: true,
    openToPerksOnly: false,
    videos: [
      { id: 'm1', title: '$10 lunch tour of Ballard', image: photos.restaurant, duration: '0:19', height: 170 },
      { id: 'm2', title: 'Rating every bakery on the Ave', image: photos.bread, duration: '0:44', height: 220 },
    ],
  },
  {
    id: 'priya',
    name: 'Priya Shah',
    handle: '@priyasips',
    neighborhood: 'Capitol Hill',
    niche: 'Matcha & desserts',
    bio: 'I have tried every matcha in Seattle. I have opinions.',
    avatar: portrait('photo-1438761681033-6461ffad8d80'),
    followers: 3100,
    engagement: 9.2,
    collabs: 4,
    replyTime: 'Usually replies within a few hours',
    verified: true,
    openToPerksOnly: true,
    videos: [
      { id: 'p1', title: 'Rating every matcha on Capitol Hill', image: photos.latteArt, duration: '0:15', height: 190, businessId: 'matcha-moto' },
      { id: 'p2', title: 'Is this latte art or a cry for help', image: photos.latteCheers, duration: '0:12', height: 240 },
    ],
  },
  {
    id: 'jordan',
    name: 'Jordan Tran',
    handle: '@jordanreads',
    neighborhood: 'Fremont',
    niche: 'Books & quiet places',
    bio: 'Where to read, what to read, and what to drink while reading it.',
    avatar: portrait('photo-1500648767791-00dcc994a43e'),
    followers: 1500,
    engagement: 11.3,
    collabs: 2,
    replyTime: 'Usually replies within a day',
    verified: true,
    openToPerksOnly: true,
    videos: [
      { id: 'j1', title: 'Finals week, but make it cozy', image: photos.cafeTables, duration: '0:26', height: 210, businessId: 'folio' },
    ],
  },
  {
    id: 'alex',
    name: 'Alex Moreno',
    handle: '@alexspins',
    neighborhood: 'Wallingford',
    niche: 'Coffee & vinyl',
    bio: 'Espresso, records, and cafes that play the whole album.',
    avatar: portrait('photo-1506794778202-cad84cf45f1d'),
    followers: 3100,
    engagement: 7.0,
    collabs: 3,
    replyTime: 'Usually replies within a few hours',
    verified: true,
    openToPerksOnly: false,
    videos: [
      { id: 'a1', title: 'The beans behind my morning', image: photos.coffeeBeans, duration: '0:18', height: 180 },
      { id: 'a2', title: 'Cafes that let you pick the record', image: photos.cafeWindow, duration: '0:34', height: 230 },
    ],
  },
  {
    id: 'sam',
    name: 'Sam Okafor',
    handle: '@samoncampus',
    neighborhood: 'U-District',
    niche: 'Campus life',
    bio: 'UW student. Day-in-the-life videos and where to eat between classes.',
    avatar: portrait('photo-1534528741775-53994a69daeb'),
    followers: 1800,
    engagement: 10.1,
    collabs: 1,
    replyTime: 'Usually replies within an hour',
    verified: true,
    openToPerksOnly: true,
    videos: [
      { id: 's1', title: 'Where I eat between 9 AM lectures', image: photos.latteCheers, duration: '0:21', height: 200 },
    ],
  },
  {
    id: 'dana',
    name: 'Dana Kim',
    handle: '@danabakes',
    neighborhood: 'Ballard',
    niche: 'Bakery reviews',
    bio: 'Honest bakery reviews. I will drive across town for a good croissant.',
    avatar: portrait('photo-1544005313-94ddf0286df2'),
    followers: 6400,
    engagement: 7.8,
    collabs: 7,
    replyTime: 'Usually replies within a few hours',
    verified: true,
    openToPerksOnly: false,
    videos: [
      { id: 'd1', title: 'The cardamom bun that ruined all other buns', image: photos.bread, duration: '0:29', height: 220, businessId: 'crumb' },
      { id: 'd2', title: 'Seattle croissant power rankings', image: photos.cafeInterior, duration: '0:52', height: 170 },
    ],
  },
  {
    id: 'lee',
    name: 'Lee Wong',
    handle: '@studywithlee',
    neighborhood: 'Ravenna',
    niche: 'Study with me',
    bio: 'Two-hour study sessions filmed in cafes you have not found yet.',
    avatar: portrait('photo-1517841905240-472988babdf9'),
    followers: 900,
    engagement: 12.4,
    collabs: 0,
    replyTime: 'Usually replies within a day',
    verified: false,
    openToPerksOnly: true,
    videos: [
      { id: 'l1', title: 'Study with me at a cafe nobody knows yet', image: photos.cafeWindow, duration: '0:24', height: 190, businessId: 'ravenna-bean' },
    ],
  },
];

// ---------- Offers in the creator's inbox ----------
// The prototype pretends you are Renee when you pick "I'm a creator",
// and Crumb & Co. when you pick "I'm a business".
export const currentCreatorId = 'renee';
export const currentBusinessId = 'crumb';

export const offers: Offer[] = [
  {
    id: 'o1',
    businessId: 'crumb',
    creatorId: 'renee',
    serviceId: 'reel',
    price: 50,
    perks: ['2 pastries', 'A drink'],
    message: 'We love how calm your study vlogs feel. Would you film a finals-week Reel at our long tables?',
    postBy: 'Fri, Nov 28',
    sentAgo: '2h ago',
    status: 'new',
  },
  {
    id: 'o2',
    businessId: 'ravenna-bean',
    creatorId: 'renee',
    serviceId: 'maps',
    price: 80,
    perks: ['A drink'],
    message: 'We are new and barely show up on Maps. A short video of a quiet afternoon here would mean a lot.',
    postBy: 'Wed, Dec 3',
    sentAgo: 'Yesterday',
    status: 'new',
  },
  {
    id: 'o3',
    businessId: 'matcha-moto',
    creatorId: 'renee',
    serviceId: 'stories',
    price: 25,
    perks: ['Free brunch'],
    message: 'Three stories about our new hojicha menu? Brunch is on us.',
    postBy: 'Sun, Nov 30',
    sentAgo: '3 days ago',
    status: 'new',
  },
];

// ---------- Helpers ----------

export const getCreator = (id: string) => creators.find((c) => c.id === id);
export const getBusiness = (id: string) => businesses.find((b) => b.id === id);
export const getService = (id: ServiceId) => services.find((s) => s.id === id)!;

// Which audience tier a creator falls into (index into audienceTiers)
export function tierIndexFor(followers: number): number {
  return audienceTiers.findIndex(
    (t) => followers >= t.minFollowers && (t.maxFollowers === null || followers <= t.maxFollowers),
  );
}

// What a creator charges for a service, based on their audience size
export function priceFor(serviceId: ServiceId, followers: number): number | null {
  return tierPrices[serviceId][tierIndexFor(followers)];
}

// 4200 -> "4.2K"
export function formatFollowers(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '')}K`;
}

// Every video for the Discover feed, mixed so creators take turns:
// everyone's 1st video, then everyone's 2nd video, and so on.
export type FeedItem = Video & { creator: Creator };
const mostVideos = Math.max(...creators.map((c) => c.videos.length));
export const feed: FeedItem[] = Array.from({ length: mostVideos }).flatMap((_, i) =>
  creators.filter((c) => c.videos[i]).map((creator) => ({ ...creator.videos[i], creator })),
);
