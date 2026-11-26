// The shape of everything in Cloutlet.
// Both the demo data and the real Supabase backend return these types,
// so screens never care which one is running.

export type Role = 'creator' | 'business';

export type ServiceId = 'reel' | 'maps' | 'stories';

export type LatLng = { lat: number; lng: number };

// A creator's status, like LinkedIn's "Open to work". Changed any time from their profile.
// open = wants paid work now (ranked higher) · networking = happy to chat · closed = not looking
export type Availability = 'open' | 'networking' | 'closed';

// Rating left by people they've done a deal with on Cloutlet (not Google's rating)
export type AppRating = { average: number; count: number };

// A photo or video on a job post (up to 10, shown as a swipeable slideshow)
export type Media = { uri: string; type: 'image' | 'video' };

export type SocialVerification = {
  username: string;
  followers: number | null;
  verifiedAt: string; // ISO date
};

export type GoogleVerification = {
  placeId: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  ownerVerified: boolean; // true once they proved they own the Google listing
};

export type Profile = {
  id: string;
  role: Role;
  name: string;
  handle: string; // "@renee.reels" or "@crumbandco"
  avatar?: string; // photo URL (creators)
  initials?: string; // shown when there's no photo (businesses)
  bio: string;
  neighborhood: string;
  location?: LatLng;

  // Creators
  niche?: string;
  followers?: number;
  engagement?: number; // percent
  replyTime?: string;
  openToPerksOnly?: boolean;
  availability?: Availability;
  pitch?: string; // creators: their intro on job messages · businesses: their default collab-request message
  services?: ServiceId[]; // creators: what they offer (all formats if not set)

  // Businesses
  kind?: string; // "Bakery"
  cover?: string; // background photo for job posts and the profile

  collabs: number;
  rating?: AppRating; // Cloutlet rating; undefined until someone rates them
  instagram?: SocialVerification;
  tiktok?: SocialVerification;
  google?: GoogleVerification;
};

export type PostKind = 'video' | 'job';

// What a hiring post asks for. Required: title (the post caption), description, format,
// how many, and a budget (or "open to offers"). Everything else is optional.
// Pay is a starting point: terms for each creator are worked out in chat.
export type Job = {
  serviceId: ServiceId; // format
  quantity: number; // how many of that format, e.g. 3 Reels (1-20)
  description?: string; // what the creator would do; can be long
  budget: number | null; // per creator; null = "Open to offers"
  perks: string[]; // presets or the business's own
  deadline?: string; // "2026-12-12" (local date)
  timeframe?: string; // how long the work takes, e.g. "1–2 weeks"
  hires?: number; // how many creators they want; unset = not decided
  postBy?: string; // older posts only: free-text date ("Dec 3"). New posts use `deadline`
};

export type Post = {
  id: string;
  kind: PostKind;
  authorId: string;
  caption: string;
  image: string; // thumbnail (video) or background (job)
  videoUrl?: string; // plays in the full-screen viewer
  duration?: string; // "0:28"
  createdAt: number; // ms since 1970
  likes: number;
  views: number;
  // Set when the video was a collab booked on Cloutlet: links both sides on the post
  collabBusinessId?: string;
  collabCreatorId?: string;
  job?: Job;
  media?: Media[]; // job posts: the business's own photos/videos of their space
  applicationCount?: number; // job posts: applications actually sent (see Application)
  viewCount?: number; // job posts: people who saw it in the full-screen viewer (one per person per day), counted since tracking started
  archived?: boolean; // job posts: closed by the business. Hidden from the feed; still listed under Archived
};

// A post with the people on it already looked up
export type FeedPost = Post & {
  author: Profile;
  collabBusiness?: Profile;
  collabCreator?: Profile;
};

// How a deal is agreed, all inside the chat:
// pending   = one side proposed terms; waiting on the other side to accept them
// agreed    = the other side accepted the terms; waiting on the side that proposed them to confirm
// accepted  = the proposer confirmed: deal done, the collab can start
// declined  = one side said no
// Opening a chat or sending a message never changes the status.
export type OfferStatus = 'pending' | 'agreed' | 'accepted' | 'declined';

export type Offer = {
  id: string;
  businessId: string;
  creatorId: string;
  serviceId: ServiceId;
  quantity: number; // e.g. 3 Reels
  price: number;
  perks: string[];
  postBy: string;
  status: OfferStatus;
  lastProposedBy: Role; // whoever set the current terms; the other side accepts them, then this side confirms
  threadId: string;
  postId?: string; // the job post these terms started from, when the creator applied to one
  createdAt: number;
  updatedAt: number;
};

export type OfferWithPeople = Offer & { business: Profile; creator: Profile };

// application = a creator applied to a job post (postId says which)
// agreed = the other side accepted the terms · accepted = the proposer confirmed the deal
export type MessageKind = 'text' | 'application' | 'offer' | 'counter' | 'agreed' | 'accepted' | 'declined';

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  kind: MessageKind;
  body: string;
  price?: number;
  perks?: string[];
  // Offer messages carry the full terms, so every version stays readable in the chat
  serviceId?: ServiceId;
  quantity?: number;
  postBy?: string;
  postId?: string; // application messages, and offers made from a job post
  createdAt: number;
};

// A creator applied to a job post. Only exists once they actually sent the application message:
// opening the Apply screen and closing it creates nothing.
export type Application = {
  id: string;
  postId: string;
  creatorId: string;
  businessId: string;
  threadId: string;
  createdAt: number;
};

export type ApplicationWithPeople = Application & { creator: Profile; post: FeedPost };

export type Thread = {
  id: string;
  businessId: string;
  creatorId: string;
  offerId?: string;
  lastMessage?: string;
  updatedAt: number;
};

// applications: job posts this creator applied to in this chat (one chat per business + creator)
export type ThreadWithPeople = Thread & {
  business: Profile;
  creator: Profile;
  offer?: Offer;
  applications: { postId: string; title: string; createdAt: number }[];
};

export type Service = { id: ServiceId; name: string; plural: string; description: string };

export type AudienceTier = {
  label: string;
  note: string;
  minFollowers: number;
  maxFollowers: number | null;
};

export type OfferTerms = {
  serviceId: ServiceId;
  quantity: number;
  price: number;
  perks: string[];
  postBy: string;
};

export type NewOffer = {
  creatorId: string;
  postId?: string; // proposing terms to someone who applied to this post
  serviceId: ServiceId;
  quantity: number;
  price: number;
  perks: string[];
  postBy: string;
  message: string;
};

export type NewPost =
  | { kind: 'video'; caption: string; localUri: string; mimeType?: string; collabBusinessId?: string }
  | { kind: 'job'; caption: string; job: Job; media?: NewMedia[] };

// Editing a job post: keep some of the photos/videos already on it, add new ones
export type JobUpdate = { caption: string; job: Job; keepMedia: Media[]; newMedia: NewMedia[] };

// A rating left on Cloutlet after a deal (1-5 stars and a few words)
export type Review = { id: string; reviewer: Profile; stars: number; body: string; createdAt: number; serviceId?: ServiceId };

// "Ravenna Bean posted a new job" — sent to creators who turned on the bell for that business.
// Shows in Inbox > Updates, separate from regular messages.
export type JobAlert = { id: string; post: FeedPost; createdAt: number; read: boolean };

export type NewMedia = { localUri: string; mimeType?: string; type: 'image' | 'video' };

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  location: LatLng;
  rating: number | null;
  reviewCount: number | null;
};
