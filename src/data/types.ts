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

export type Job = {
  serviceId: ServiceId;
  budget: number | null; // null = "Open to offers"
  perks: string[];
  postBy?: string;
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
};

// A post with the people on it already looked up
export type FeedPost = Post & {
  author: Profile;
  collabBusiness?: Profile;
  collabCreator?: Profile;
};

// pending   = waiting on the other side
// accepted  = deal agreed
// declined  = one side said no
export type OfferStatus = 'pending' | 'accepted' | 'declined';

export type Offer = {
  id: string;
  businessId: string;
  creatorId: string;
  serviceId: ServiceId;
  price: number;
  perks: string[];
  postBy: string;
  status: OfferStatus;
  lastProposedBy: Role; // whoever set the current terms; the other side responds
  threadId: string;
  createdAt: number;
  updatedAt: number;
};

export type OfferWithPeople = Offer & { business: Profile; creator: Profile };

export type MessageKind = 'text' | 'offer' | 'counter' | 'accepted' | 'declined';

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  kind: MessageKind;
  body: string;
  price?: number;
  perks?: string[];
  createdAt: number;
};

export type Thread = {
  id: string;
  businessId: string;
  creatorId: string;
  offerId?: string;
  lastMessage?: string;
  updatedAt: number;
};

export type ThreadWithPeople = Thread & { business: Profile; creator: Profile; offer?: Offer };

export type Service = { id: ServiceId; name: string; description: string };

export type AudienceTier = {
  label: string;
  note: string;
  minFollowers: number;
  maxFollowers: number | null;
};

export type NewOffer = {
  creatorId: string;
  serviceId: ServiceId;
  price: number;
  perks: string[];
  postBy: string;
  message: string;
};

export type NewPost =
  | { kind: 'video'; caption: string; localUri: string; mimeType?: string; collabBusinessId?: string }
  | { kind: 'job'; caption: string; job: Job; media?: NewMedia[] };

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
