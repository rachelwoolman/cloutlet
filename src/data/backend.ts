// Everything the app can ask the server for, in one list.
// Two versions exist: demo (in memory, no setup) and live (Supabase).
// Screens use the hooks in ./hooks.ts and never import either version directly.
import {
  ApplicationWithPeople,
  Availability,
  FeedPost,
  JobUpdate,
  JobAlert,
  Review,
  LatLng,
  Message,
  NewOffer,
  NewPost,
  Offer,
  OfferTerms,
  OfferWithPeople,
  PlaceResult,
  Profile,
  Role,
  ServiceId,
  ThreadWithPeople,
} from './types';

// Things screens can listen to. When one changes, screens showing it reload.
export type Topic = 'feed' | 'profiles' | 'offers' | 'threads' | 'applications' | 'saved' | 'follows' | 'alerts' | `messages:${string}`;

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
  getPost(id: string): Promise<FeedPost | null>;
  listPostsFor(profileId: string): Promise<FeedPost[]>; // their own posts + collabs they're tagged in (archived jobs included)
  listBusinesses(): Promise<Profile[]>;
  listOffers(me: Profile): Promise<OfferWithPeople[]>;
  listThreads(me: Profile): Promise<ThreadWithPeople[]>;
  getThread(id: string): Promise<ThreadWithPeople | null>;
  listMessages(threadId: string): Promise<Message[]>;
  listReviews(profileId: string): Promise<Review[]>; // Cloutlet reviews about this profile, newest first
  // Business: everyone who applied to its posts. Creator: their own applications.
  listApplications(me: Profile): Promise<ApplicationWithPeople[]>;
  // The existing chat with this person, or null. Never creates one.
  findThread(me: Profile, otherId: string): Promise<string | null>;

  // Writes
  createProfile(userId: string, input: NewProfile): Promise<Profile>;
  createOffer(me: Profile, input: NewOffer): Promise<Offer>;
  // A chat only exists once someone sends something. startChat sends the first message
  // (or adds to the existing chat) and returns the chat's id.
  startChat(me: Profile, otherId: string, body: string): Promise<string>;
  sendMessage(me: Profile, threadId: string, body: string): Promise<void>;
  // Creator applies to a job post: sends the message and records the application, together.
  // Returns the chat's id. Applying twice to the same post is refused.
  applyToPost(me: Profile, postId: string, message: string): Promise<string>;
  // Business changes the terms of its open offer (same offer, back to waiting on the creator)
  reviseOffer(me: Profile, offerId: string, terms: OfferTerms, note: string): Promise<void>;
  // The side that didn't propose the terms accepts them ('agreed'). Either side can decline while it's open.
  respondToOffer(me: Profile, offerId: string, answer: 'agreed' | 'declined'): Promise<void>;
  // The side that proposed the terms confirms after the other side accepted them. This makes it a deal.
  confirmOffer(me: Profile, offerId: string): Promise<void>;
  createPost(me: Profile, input: NewPost): Promise<void>;
  updateJob(me: Profile, postId: string, input: JobUpdate): Promise<void>; // your own job posts only
  setArchived(me: Profile, postId: string, archived: boolean): Promise<void>; // your own job posts only
  // Someone saw a job post in the full-screen viewer. Counted once per person per day; your own views don't count.
  recordView(me: Profile, postId: string): Promise<void>;
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
