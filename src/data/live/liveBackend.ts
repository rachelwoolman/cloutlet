// Live backend: talks to Supabase (database, login, realtime chat, file storage).
// Used automatically when EXPO_PUBLIC_SUPABASE_URL is set in .env.
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { MEDIA_BUCKET, supabase } from '../../lib/supabase';
import { Backend, SocialPlatform, Topic } from '../backend';
import { FeedPost, JobAlert, Media, Review, Message, NewMedia, Offer, OfferWithPeople, PlaceResult, Profile, ThreadWithPeople } from '../types';

// ---------- Row -> app type ----------

const PROFILE = '*, social_accounts(*), google_listings(*)';
const POST = `*, author:profiles!author_id(${PROFILE}), collab_business:profiles!collab_business_id(${PROFILE}), collab_creator:profiles!collab_creator_id(${PROFILE})`;
const OFFER = `*, business:profiles!business_id(${PROFILE}), creator:profiles!creator_id(${PROFILE})`;
const THREAD = `*, business:profiles!business_id(${PROFILE}), creator:profiles!creator_id(${PROFILE}), offer:offers!offer_id(*)`;

const one = <T,>(x: T | T[] | null | undefined): T | undefined => (Array.isArray(x) ? x[0] : (x ?? undefined));
const ms = (iso: string) => new Date(iso).getTime();

function toProfile(r: any): Profile {
  const social = (platform: string) => {
    const s = (r.social_accounts ?? []).find((a: any) => a.platform === platform);
    return s ? { username: s.username, followers: s.followers, verifiedAt: s.verified_at } : undefined;
  };
  const g = one<any>(r.google_listings);
  return {
    id: r.id,
    role: r.role,
    name: r.name,
    handle: r.handle,
    avatar: r.avatar_url ?? undefined,
    initials: r.initials ?? r.name.slice(0, 2).toUpperCase(),
    bio: r.bio,
    neighborhood: r.neighborhood,
    location: r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : undefined,
    niche: r.niche ?? undefined,
    followers: r.followers ?? undefined,
    engagement: r.engagement != null ? Number(r.engagement) : undefined,
    replyTime: r.reply_time ?? undefined,
    openToPerksOnly: r.open_to_perks_only ?? undefined,
    availability: r.availability ?? undefined,
    pitch: r.pitch || undefined,
    services: Array.isArray(r.services) && r.services.length ? r.services : undefined,
    kind: r.kind ?? undefined,
    cover: r.cover_url ?? undefined,
    collabs: r.collabs,
    rating: r.rating_count > 0 ? { average: Number(r.rating_avg), count: r.rating_count } : undefined,
    instagram: social('instagram'),
    tiktok: social('tiktok'),
    google: g
      ? { placeId: g.place_id, address: g.address, rating: g.rating, reviewCount: g.review_count, ownerVerified: g.owner_verified }
      : undefined,
  };
}

function toPost(r: any): FeedPost {
  return {
    id: r.id,
    kind: r.kind,
    authorId: r.author_id,
    caption: r.caption,
    image: r.image_url ?? r.author?.cover_url ?? '',
    videoUrl: r.video_url ?? undefined,
    duration: r.duration ?? undefined,
    createdAt: ms(r.created_at),
    likes: r.likes,
    views: r.views,
    collabBusinessId: r.collab_business_id ?? undefined,
    collabCreatorId: r.collab_creator_id ?? undefined,
    media: Array.isArray(r.media) && r.media.length ? (r.media as Media[]) : undefined,
    job:
      r.kind === 'job'
        ? { serviceId: r.job_service, budget: r.job_budget, perks: r.job_perks ?? [], postBy: r.job_post_by ?? undefined }
        : undefined,
    author: toProfile(r.author),
    collabBusiness: r.collab_business ? toProfile(r.collab_business) : undefined,
    collabCreator: r.collab_creator ? toProfile(r.collab_creator) : undefined,
  };
}

function toOffer(r: any): Offer {
  return {
    id: r.id,
    businessId: r.business_id,
    creatorId: r.creator_id,
    serviceId: r.service_id,
    price: r.price,
    perks: r.perks ?? [],
    postBy: r.post_by,
    status: r.status,
    lastProposedBy: r.last_proposed_by,
    threadId: r.thread_id,
    createdAt: ms(r.created_at),
    updatedAt: ms(r.updated_at),
  };
}

function toThread(r: any): ThreadWithPeople {
  const offer = one<any>(r.offer);
  return {
    id: r.id,
    businessId: r.business_id,
    creatorId: r.creator_id,
    offerId: r.offer_id ?? undefined,
    lastMessage: r.last_message ?? undefined,
    updatedAt: ms(r.updated_at),
    business: toProfile(r.business),
    creator: toProfile(r.creator),
    offer: offer ? toOffer(offer) : undefined,
  };
}

function toMessage(r: any): Message {
  return {
    id: r.id,
    threadId: r.thread_id,
    senderId: r.sender_id,
    kind: r.kind,
    body: r.body,
    price: r.price ?? undefined,
    perks: r.perks ?? undefined,
    createdAt: ms(r.created_at),
  };
}

function check<T>({ data, error }: { data: T; error: any }): NonNullable<T> {
  if (error) throw new Error(error.message ?? String(error));
  return data as NonNullable<T>;
}

// Upload a picked photo or video to storage and return its public URL
async function upload(ownerId: string, m: NewMedia): Promise<string> {
  const ext = m.type === 'video' ? (m.mimeType?.includes('quicktime') ? 'mov' : 'mp4') : m.mimeType?.includes('png') ? 'png' : 'jpg';
  const path = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = await (await fetch(m.localUri)).arrayBuffer();
  check(await supabase.storage.from(MEDIA_BUCKET).upload(path, bytes, { contentType: m.mimeType ?? (m.type === 'video' ? 'video/mp4' : 'image/jpeg') }));
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

// ---------- Change notifications ----------
// Local: after this device writes something. Remote: Supabase Realtime.

const local = new Map<Topic, Set<() => void>>();
function emit(...topics: Topic[]) {
  topics.forEach((t) => local.get(t)?.forEach((fn) => fn()));
}

function realtimeFor(topic: Topic, onChange: () => void) {
  const table = topic.startsWith('messages:') ? 'messages' : topic === 'offers' ? 'offers' : topic === 'threads' ? 'threads' : topic === 'alerts' ? 'job_alerts' : null;
  if (!table) return () => {};
  const filter = topic.startsWith('messages:') ? `thread_id=eq.${topic.slice('messages:'.length)}` : undefined;
  const channel = supabase
    .channel(`${topic}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes' as any, { event: '*', schema: 'public', table, filter }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------- OAuth round trip (Instagram, TikTok, Google) ----------

async function runOAuth(provider: SocialPlatform | 'google') {
  const returnTo = Linking.createURL('verify');
  const { data, error } = await supabase.functions.invoke('oauth-start', { body: { provider, returnTo } });
  if (error || !data?.url) throw new Error(data?.error ?? error?.message ?? 'Could not start sign-in');

  const result = await WebBrowser.openAuthSessionAsync(data.url, returnTo);
  if (result.type !== 'success') throw new Error('Cancelled');
  const params = new URL(result.url).searchParams;
  if (params.get('status') !== 'ok') throw new Error(params.get('message') ?? 'Verification failed');
}

// ---------- The backend ----------

export const liveBackend: Backend = {
  mode: 'live',

  async listFeed() {
    const rows = check(await supabase.from('posts').select(POST).order('created_at', { ascending: false }).limit(200));
    return rows.map(toPost);
  },

  async getProfile(id) {
    const row = check(await supabase.from('profiles').select(PROFILE).eq('id', id).maybeSingle());
    return row ? toProfile(row) : null;
  },

  async listPostsFor(id) {
    const rows = check(
      await supabase
        .from('posts')
        .select(POST)
        .or(`author_id.eq.${id},collab_business_id.eq.${id},collab_creator_id.eq.${id}`)
        .order('created_at', { ascending: false }),
    );
    return rows.map(toPost);
  },

  async listBusinesses() {
    const rows = check(await supabase.from('profiles').select(PROFILE).eq('role', 'business'));
    return rows.map(toProfile);
  },

  async listOffers(me) {
    const column = me.role === 'creator' ? 'creator_id' : 'business_id';
    const rows = check(await supabase.from('offers').select(OFFER).eq(column, me.id).order('updated_at', { ascending: false }));
    return rows.map((r: any): OfferWithPeople => ({ ...toOffer(r), business: toProfile(r.business), creator: toProfile(r.creator) }));
  },

  async listThreads(me) {
    const column = me.role === 'creator' ? 'creator_id' : 'business_id';
    const rows = check(await supabase.from('threads').select(THREAD).eq(column, me.id).order('updated_at', { ascending: false }));
    return rows.map(toThread);
  },

  async getThread(id) {
    const row = check(await supabase.from('threads').select(THREAD).eq('id', id).maybeSingle());
    return row ? toThread(row) : null;
  },

  async listReviews(profileId) {
    const rows = check(
      await supabase
        .from('reviews')
        .select(`id, stars, body, created_at, reviewer:profiles!reviewer_id(${PROFILE}), offer:offers!offer_id(service_id)`)
        .eq('reviewee_id', profileId)
        .order('created_at', { ascending: false }),
    );
    return rows.map((r: any): Review => ({
      id: r.id,
      reviewer: toProfile(one(r.reviewer)),
      stars: r.stars,
      body: r.body,
      createdAt: ms(r.created_at),
      serviceId: one<any>(r.offer)?.service_id ?? undefined,
    }));
  },

  async listMessages(threadId) {
    const rows = check(await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at'));
    return rows.map(toMessage);
  },

  async createProfile(userId, input) {
    const row = check(
      await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: input.role,
          name: input.name,
          handle: input.handle.startsWith('@') ? input.handle : `@${input.handle}`,
          neighborhood: input.neighborhood,
          kind: input.kind ?? null,
          niche: input.niche ?? null,
          availability: input.availability ?? 'open',
          initials: input.name.slice(0, 2).toUpperCase(),
        })
        .select(PROFILE)
        .single(),
    );
    emit('profiles');
    return toProfile(row);
  },

  async createOffer(_me, input) {
    const row = check(
      await supabase.rpc('create_offer', {
        creator: input.creatorId,
        service: input.serviceId,
        price: input.price,
        perks: input.perks,
        post_by: input.postBy,
        message: input.message,
      }),
    );
    emit('offers', 'threads');
    return toOffer(row);
  },

  async openThread(_me, otherId) {
    const id = check(await supabase.rpc('open_thread', { other: otherId })) as string;
    emit('threads');
    return id;
  },

  async sendMessage(me, threadId, body) {
    check(await supabase.from('messages').insert({ thread_id: threadId, sender_id: me.id, kind: 'text', body }));
    emit(`messages:${threadId}`, 'threads');
  },

  async counterOffer(_me, offerId, price, perks, note) {
    check(await supabase.rpc('counter_offer', { offer: offerId, new_price: price, new_perks: perks, note }));
    emit('offers', 'threads');
  },

  async respondToOffer(_me, offerId, answer) {
    check(await supabase.rpc('respond_offer', { offer: offerId, answer }));
    emit('offers', 'threads', 'profiles');
  },

  async createPost(me, input) {
    if (input.kind === 'job') {
      const media: Media[] = [];
      for (const m of (input.media ?? []).slice(0, 10)) media.push({ uri: await upload(me.id, m), type: m.type });
      check(
        await supabase.from('posts').insert({
          kind: 'job',
          author_id: me.id,
          caption: input.caption,
          image_url: media.find((m) => m.type === 'image')?.uri ?? me.cover ?? null,
          media,
          job_service: input.job.serviceId,
          job_budget: input.job.budget,
          job_perks: input.job.perks,
          job_post_by: input.job.postBy ?? null,
        }),
      );
    } else {
      const ext = input.mimeType?.includes('quicktime') ? 'mov' : 'mp4';
      const path = `${me.id}/${Date.now()}.${ext}`;
      const bytes = await (await fetch(input.localUri)).arrayBuffer();
      check(
        await supabase.storage.from(MEDIA_BUCKET).upload(path, bytes, { contentType: input.mimeType ?? 'video/mp4' }),
      );
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      check(
        await supabase.from('posts').insert({
          kind: 'video',
          author_id: me.id,
          caption: input.caption,
          video_url: data.publicUrl,
          collab_business_id: input.collabBusinessId ?? null,
        }),
      );
    }
    emit('feed');
  },

  async likePost(postId) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from('post_likes').upsert({ post_id: postId, profile_id: data.user.id }, { ignoreDuplicates: true });
  },

  async connectSocial(_me, platform) {
    await runOAuth(platform);
    emit('profiles', 'feed');
  },

  async setLocation(me, location) {
    check(await supabase.from('profiles').update({ lat: location?.lat ?? null, lng: location?.lng ?? null }).eq('id', me.id));
    emit('profiles', 'feed');
  },

  async updateProfile(me, patch) {
    check(await supabase.from('profiles').update(patch).eq('id', me.id));
    emit('profiles', 'feed');
  },

  async listSavedIds(me) {
    const rows = check(await supabase.from('saved_posts').select('post_id').eq('profile_id', me.id).order('created_at', { ascending: false }));
    return rows.map((r: any) => r.post_id as string);
  },

  async listSavedPosts(me) {
    const rows = check(
      await supabase.from('saved_posts').select(`post:posts!post_id(${POST})`).eq('profile_id', me.id).order('created_at', { ascending: false }),
    );
    return rows.map((r: any) => one<any>(r.post)).filter(Boolean).map(toPost);
  },

  async setSaved(me, postId, on) {
    if (on) check(await supabase.from('saved_posts').upsert({ profile_id: me.id, post_id: postId }, { ignoreDuplicates: true }));
    else check(await supabase.from('saved_posts').delete().eq('profile_id', me.id).eq('post_id', postId));
    emit('saved');
  },

  async listFollowingIds(me) {
    const rows = check(await supabase.from('follows').select('business_id').eq('creator_id', me.id));
    return rows.map((r: any) => r.business_id as string);
  },

  async setFollowing(me, businessId, on) {
    if (on) check(await supabase.from('follows').upsert({ creator_id: me.id, business_id: businessId }, { ignoreDuplicates: true }));
    else check(await supabase.from('follows').delete().eq('creator_id', me.id).eq('business_id', businessId));
    emit('follows');
  },

  async listAlerts(me) {
    const rows = check(
      await supabase.from('job_alerts').select(`id, created_at, read_at, post:posts!post_id(${POST})`).eq('recipient_id', me.id).order('created_at', { ascending: false }).limit(100),
    );
    return rows
      .filter((r: any) => one(r.post))
      .map((r: any): JobAlert => ({ id: r.id, post: toPost(one(r.post)), createdAt: ms(r.created_at), read: r.read_at != null }));
  },

  async markAlertsRead(me) {
    check(await supabase.from('job_alerts').update({ read_at: new Date().toISOString() }).eq('recipient_id', me.id).is('read_at', null));
    emit('alerts');
  },

  async searchPlaces(query) {
    const { data, error } = await supabase.functions.invoke('places-search', { body: { query } });
    if (error) throw new Error(error.message);
    return (data?.places ?? []) as PlaceResult[];
  },

  async claimPlace(_me, place) {
    check(
      await supabase.rpc('claim_place', {
        place_id: place.placeId,
        address: place.address,
        rating: place.rating,
        review_count: place.reviewCount,
        lat: place.location.lat,
        lng: place.location.lng,
      }),
    );
    emit('profiles');
  },

  async verifyGoogleOwnership() {
    await runOAuth('google');
    emit('profiles', 'feed');
  },

  subscribe(topic, onChange) {
    if (!local.has(topic)) local.set(topic, new Set());
    local.get(topic)!.add(onChange);
    const stopRealtime = realtimeFor(topic, onChange);
    return () => {
      local.get(topic)!.delete(onChange);
      stopRealtime();
    };
  },
};
