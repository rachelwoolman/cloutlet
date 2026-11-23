// Everything the app can ask the server for, in one list.
// Two versions exist: demo (in memory, no setup) and live (Supabase).
// Screens use the hooks in ./hooks.ts and never import either version directly.
import {
  Availability,
  FeedPost,
  JobAlert,
  Review,
  LatLng,
  Message,
  NewOffer,
  NewPost,
  Offer,
  OfferWithPeople,
  PlaceResult,
  Profile,
  Role,
  ServiceId,
  ThreadWithPeople,
} from './types';

// Things screens can listen to. When one changes, screens showing it reload.
export type Topic = 'feed' | 'profiles' | 'offers' | 'threads' | 'saved' | 'follows' | 'alerts' | `messages:${string}`;

export type SocialPlatform = 'instagram' | 'tiktok';

export type NewProfile = {
  role: Role;
  name: string;
  handle: string;
  neighborhood: string;
  kind?: string; // businesses
  niche?: string; // creators
  availability?: Availability; // creators
};

// Fields you can change on your own profile
export type ProfilePatch = { availability?: Availability; pitch?: string; services?: ServiceId[] };

export interface Backend {
  mode: 'demo' | 'live';

  // Reads
  listFeed(): Promise<FeedPost[]>;
  getProfile(id: string): Promise<Profile | null>;
  listPostsFor(profileId: string): Promise<FeedPost[]>; // their own posts + collabs they're tagged in
  listBusinesses(): Promise<Profile[]>;
  listOffers(me: Profile): Promise<OfferWithPeople[]>;
  listThreads(me: Profile): Promise<ThreadWithPeople[]>;
  getThread(id: string): Promise<ThreadWithPeople | null>;
  listMessages(threadId: string): Promise<Message[]>;
  listReviews(profileId: string): Promise<Review[]>; // Cloutlet reviews about this profile, newest first

  // Writes
  createProfile(userId: string, input: NewProfile): Promise<Profile>;
  createOffer(me: Profile, input: NewOffer): Promise<Offer>;
  openThread(me: Profile, otherId: string): Promise<string>; // existing thread id, or a new one
  sendMessage(me: Profile, threadId: string, body: string): Promise<void>;
  counterOffer(me: Profile, offerId: string, price: number, perks: string[], note: string): Promise<void>;
  respondToOffer(me: Profile, offerId: string, answer: 'accepted' | 'declined'): Promise<void>;
  createPost(me: Profile, input: NewPost): Promise<void>;
  likePost(postId: string): Promise<void>;
  setLocation(me: Profile, location: LatLng | null): Promise<void>; // rounded to ~half a mile; null clears it
  updateProfile(me: Profile, patch: ProfilePatch): Promise<void>;

  // Saved posts: job posts and videos, bookmarked to look at later
  listSavedIds(me: Profile): Promise<string[]>;
  listSavedPosts(me: Profile): Promise<FeedPost[]>;
  setSaved(me: Profile, postId: string, saved: boolean): Promise<void>;

  // The bell on a business profile: creators get an update when that business posts a job
  listFollowingIds(me: Profile): Promise<string[]>;
  setFollowing(me: Profile, businessId: string, on: boolean): Promise<void>;
  listAlerts(me: Profile): Promise<JobAlert[]>;
  markAlertsRead(me: Profile): Promise<void>;

  // Verification
  connectSocial(me: Profile, platform: SocialPlatform): Promise<void>;
  searchPlaces(query: string): Promise<PlaceResult[]>;
  claimPlace(me: Profile, place: PlaceResult): Promise<void>;
  verifyGoogleOwnership(me: Profile): Promise<void>;

  subscribe(topic: Topic, onChange: () => void): () => void;
}
