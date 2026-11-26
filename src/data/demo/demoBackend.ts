// Demo backend: keeps everything in memory. Resets when the app reloads.
// Lets you click through every feature before Supabase is set up.
import { Backend, Topic } from '../backend';
import { Application, FeedPost, Message, Offer, Post, Profile, Thread, ThreadWithPeople } from '../types';
import * as seed from './seed';

// Ratings come from the sample reviews, so the number matches what you can read
const ratingFor = (pid: string) => {
  const rs = seed.reviews.filter((r) => r.revieweeId === pid);
  return rs.length ? { average: Math.round((rs.reduce((n, r) => n + r.stars, 0) / rs.length) * 10) / 10, count: rs.length } : undefined;
};
let profiles: Profile[] = seed.profiles.map((p) => ({ ...p, rating: ratingFor(p.id) }));
let posts = [...seed.posts];
let offers = [...seed.offers];
let threads = [...seed.threads];
let messages = [...seed.messages];
let applications: Application[] = [...seed.applications];
// Job post views: "postId|viewerId|day". Starts empty: only views seen in this session are counted
let views = new Set<string>();
const viewCount = (postId: string) => [...views].filter((v) => v.startsWith(`${postId}|`)).length;
let saved = new Map<string, string[]>(); // profile id -> saved post ids, newest first
let follows = [...seed.follows]; // { creatorId, businessId }: bell turned on
let alerts = [...seed.alerts]; // job updates sent to followers

const listeners = new Map<Topic, Set<() => void>>();
function emit(...topics: Topic[]) {
  topics.forEach((t) => listeners.get(t)?.forEach((fn) => fn()));
}

const wait = (ms = 150) => new Promise((r) => setTimeout(r, ms));
const id = (prefix: string) => `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
const profile = (pid: string) => profiles.find((p) => p.id === pid)!;

function withPeople(post: Post): FeedPost {
  return {
    ...post,
    author: profile(post.authorId),
    collabBusiness: post.collabBusinessId ? profile(post.collabBusinessId) : undefined,
    collabCreator: post.collabCreatorId ? profile(post.collabCreatorId) : undefined,
    applicationCount: post.kind === 'job' ? applications.filter((a) => a.postId === post.id).length : undefined,
    viewCount: post.kind === 'job' ? viewCount(post.id) : undefined,
  };
}

function threadWithPeople(t: Thread): ThreadWithPeople {
  return {
    ...t,
    business: profile(t.businessId),
    creator: profile(t.creatorId),
    offer: offers.find((o) => o.id === t.offerId),
    lastMessage: [...messages].reverse().find((m) => m.threadId === t.id)?.body,
    applications: applications
      .filter((a) => a.threadId === t.id)
      .map((a) => ({ postId: a.postId, title: posts.find((p) => p.id === a.postId)?.caption ?? 'Job post', createdAt: a.createdAt })),
  };
}

const sides = (me: Profile, otherId: string): [string, string] => {
  const other = profile(otherId);
  if (!other || other.role === me.role) throw new Error('Chats are between a creator and a business');
  return me.role === 'business' ? [me.id, otherId] : [otherId, me.id];
};

function addMessage(m: Omit<Message, 'id' | 'createdAt'>) {
  const msg: Message = { ...m, id: id('msg'), createdAt: Date.now() };
  messages = [...messages, msg];
  threads = threads.map((t) => (t.id === m.threadId ? { ...t, updatedAt: msg.createdAt } : t));
  emit(`messages:${m.threadId}`, 'threads');
}

function updateOffer(offerId: string, patch: Partial<Offer>) {
  offers = offers.map((o) => (o.id === offerId ? { ...o, ...patch, updatedAt: Date.now() } : o));
  emit('offers', 'threads');
}

const termsOf = (o: Offer) => ({ serviceId: o.serviceId, quantity: o.quantity, price: o.price, perks: o.perks, postBy: o.postBy });

function findOrCreateThread(businessId: string, creatorId: string, offerId?: string): Thread {
  let t = threads.find((x) => x.businessId === businessId && x.creatorId === creatorId);
  if (!t) {
    t = { id: id('t'), businessId, creatorId, offerId, updatedAt: Date.now() };
    threads = [t, ...threads];
  } else if (offerId) {
    t = { ...t, offerId };
    threads = threads.map((x) => (x.id === t!.id ? t! : x));
  }
  return t;
}

export const demoBackend: Backend = {
  mode: 'demo',

  async listFeed() {
    await wait();
    return posts.filter((p) => !p.archived).map(withPeople);
  },

  async getPost(pid) {
    const post = posts.find((p) => p.id === pid);
    return post ? withPeople(post) : null;
  },

  async getProfile(pid) {
    return profiles.find((p) => p.id === pid) ?? null;
  },

  async listPostsFor(pid) {
    return posts
      .filter((p) => p.authorId === pid || p.collabBusinessId === pid || p.collabCreatorId === pid)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(withPeople);
  },

  async listBusinesses() {
    return profiles.filter((p) => p.role === 'business');
  },

  async listOffers(me) {
    return offers
      .filter((o) => (me.role === 'creator' ? o.creatorId : o.businessId) === me.id)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((o) => ({ ...o, business: profile(o.businessId), creator: profile(o.creatorId) }));
  },

  async listThreads(me) {
    // A chat shows up once something has been sent in it
    return threads
      .filter((t) => (me.role === 'creator' ? t.creatorId : t.businessId) === me.id)
      .filter((t) => messages.some((m) => m.threadId === t.id))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(threadWithPeople);
  },

  async getThread(tid) {
    const t = threads.find((x) => x.id === tid);
    return t ? threadWithPeople(t) : null;
  },

  async listReviews(pid) {
    return seed.reviews
      .filter((r) => r.revieweeId === pid)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({ id: r.id, reviewer: profile(r.reviewerId), stars: r.stars, body: r.body, createdAt: r.createdAt, serviceId: r.serviceId }));
  },

  async listMessages(tid) {
    return messages.filter((m) => m.threadId === tid);
  },

  async createProfile(userId, input) {
    const p: Profile = { id: userId, collabs: 0, bio: '', ...input };
    profiles = [...profiles, p];
    emit('profiles');
    return p;
  },

  async createOffer(me, input) {
    if (me.role !== 'business') throw new Error('Only businesses send offers');
    if (offers.some((o) => o.businessId === me.id && o.creatorId === input.creatorId && (o.status === 'pending' || o.status === 'agreed'))) {
      throw new Error('You already have an open offer with them. Update it instead.');
    }
    const offerId = id('o');
    const thread = findOrCreateThread(me.id, input.creatorId, offerId);
    const offer: Offer = {
      id: offerId,
      businessId: me.id,
      creatorId: input.creatorId,
      serviceId: input.serviceId,
      quantity: input.quantity,
      price: input.price,
      perks: input.perks,
      postBy: input.postBy,
      status: 'pending',
      lastProposedBy: 'business',
      threadId: thread.id,
      postId: input.postId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    offers = [offer, ...offers];
    addMessage({ threadId: thread.id, senderId: me.id, kind: 'offer', body: input.message.trim(), ...termsOf(offer), postId: input.postId });
    emit('offers');
    return offer;
  },

  async findThread(me, otherId) {
    const [businessId, creatorId] = sides(me, otherId);
    return threads.find((t) => t.businessId === businessId && t.creatorId === creatorId)?.id ?? null;
  },

  async startChat(me, otherId, body) {
    const [businessId, creatorId] = sides(me, otherId);
    const t = findOrCreateThread(businessId, creatorId);
    addMessage({ threadId: t.id, senderId: me.id, kind: 'text', body });
    return t.id;
  },

  async sendMessage(me, threadId, body) {
    addMessage({ threadId, senderId: me.id, kind: 'text', body });
  },

  // Same rules as apply_to_post in supabase/migrations
  async applyToPost(me, postId, message) {
    const post = posts.find((p) => p.id === postId);
    if (me.role !== 'creator') throw new Error('Only creators apply to jobs');
    if (!post || post.kind !== 'job') throw new Error('Job post not found');
    if (post.archived) throw new Error('This job is closed');
    if (applications.some((a) => a.postId === postId && a.creatorId === me.id)) throw new Error('You already applied to this post');
    if (!message.trim()) throw new Error('Write a message to apply');
    const t = findOrCreateThread(post.authorId, me.id);
    addMessage({ threadId: t.id, senderId: me.id, kind: 'application', body: message.trim(), postId });
    applications = [...applications, { id: id('ap'), postId, creatorId: me.id, businessId: post.authorId, threadId: t.id, createdAt: Date.now() }];
    emit('applications', 'feed', 'threads');
    return t.id;
  },

  async reviseOffer(me, offerId, terms, note) {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer || offer.businessId !== me.id) throw new Error('Not your offer');
    if (offer.status !== 'pending' && offer.status !== 'agreed') throw new Error('This offer is closed. Send a new one.');
    updateOffer(offerId, { ...terms, status: 'pending', lastProposedBy: 'business' });
    addMessage({ threadId: offer.threadId, senderId: me.id, kind: 'counter', body: note.trim(), ...terms });
  },

  async listApplications(me) {
    return applications
      .filter((a) => (me.role === 'business' ? a.businessId : a.creatorId) === me.id)
      .map((a) => ({ a, post: posts.find((p) => p.id === a.postId) }))
      .filter((x): x is { a: Application; post: Post } => Boolean(x.post))
      .sort((x, y) => y.a.createdAt - x.a.createdAt)
      .map(({ a, post }) => ({ ...a, creator: profile(a.creatorId), post: withPeople(post) }));
  },

  // Same rules as respond_offer / confirm_offer in supabase/migrations
  async respondToOffer(me, offerId, answer) {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer || ![offer.businessId, offer.creatorId].includes(me.id)) throw new Error('Not your offer');
    if (answer === 'agreed' && offer.status !== 'pending') throw new Error('This offer is not waiting on you');
    if (answer === 'agreed' && offer.lastProposedBy === me.role) throw new Error('Waiting on the other side');
    if (answer === 'declined' && offer.status !== 'pending' && offer.status !== 'agreed') throw new Error('This offer is closed');
    updateOffer(offerId, { status: answer });
    addMessage({
      threadId: offer.threadId,
      senderId: me.id,
      kind: answer,
      body: answer === 'agreed' ? 'Terms accepted' : 'Declined',
      ...termsOf(offer),
    });
  },

  async confirmOffer(me, offerId) {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer || ![offer.businessId, offer.creatorId].includes(me.id)) throw new Error('Not your offer');
    if (offer.status !== 'agreed') throw new Error('The other side has not accepted these terms yet');
    if (offer.lastProposedBy !== me.role) throw new Error('Only the side that made the offer confirms it');
    updateOffer(offerId, { status: 'accepted' });
    addMessage({ threadId: offer.threadId, senderId: me.id, kind: 'accepted', body: 'Deal', ...termsOf(offer) });
    profiles = profiles.map((p) => (p.id === offer.creatorId || p.id === offer.businessId ? { ...p, collabs: p.collabs + 1 } : p));
    emit('profiles');
  },

  async createPost(me, input) {
    const base = { id: id('post'), authorId: me.id, caption: input.caption, createdAt: Date.now(), likes: 0, views: 0 };
    const post: Post =
      input.kind === 'video'
        ? { ...base, kind: 'video', image: '', videoUrl: input.localUri, collabBusinessId: input.collabBusinessId }
        : (() => {
            const media = (input.media ?? []).slice(0, 10).map((m) => ({ uri: m.localUri, type: m.type }));
            const firstPhoto = media.find((m) => m.type === 'image')?.uri;
            return { ...base, kind: 'job' as const, image: firstPhoto ?? me.cover ?? '', job: input.job, media: media.length ? media : undefined };
          })();
    posts = [post, ...posts];
    // A new job: tell everyone who turned on the bell for this business
    if (post.kind === 'job') {
      const fans = follows.filter((f) => f.businessId === me.id);
      alerts = [...fans.map((f) => ({ id: id('alert'), recipientId: f.creatorId, postId: post.id, createdAt: post.createdAt, read: false })), ...alerts];
      if (fans.length) emit('alerts');
    }
    emit('feed');
  },

  async updateJob(me, postId, input) {
    const post = posts.find((p) => p.id === postId);
    if (!post || post.authorId !== me.id || post.kind !== 'job') throw new Error('You can only edit your own job posts');
    const media = [...input.keepMedia, ...input.newMedia.map((m) => ({ uri: m.localUri, type: m.type }))].slice(0, 10);
    const firstPhoto = media.find((m) => m.type === 'image')?.uri;
    posts = posts.map((p) => (p.id === postId ? { ...p, caption: input.caption, job: input.job, media: media.length ? media : undefined, image: firstPhoto ?? me.cover ?? p.image } : p));
    emit('feed', 'applications');
  },

  async setArchived(me, postId, archived) {
    const post = posts.find((p) => p.id === postId);
    if (!post || post.authorId !== me.id || post.kind !== 'job') throw new Error('You can only archive your own job posts');
    posts = posts.map((p) => (p.id === postId ? { ...p, archived } : p));
    emit('feed', 'applications');
  },

  async recordView(me, postId) {
    const post = posts.find((p) => p.id === postId);
    if (!post || post.kind !== 'job' || post.authorId === me.id) return;
    const key = `${postId}|${me.id}|${new Date().toDateString()}`;
    if (views.has(key)) return;
    views = new Set(views).add(key);
    emit('feed');
  },

  async likePost(postId) {
    posts = posts.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  },

  async setLocation(me, location) {
    profiles = profiles.map((p) => (p.id === me.id ? { ...p, location: location ?? undefined } : p));
    emit('profiles', 'feed');
  },

  async updateProfile(me, patch) {
    profiles = profiles.map((p) => (p.id === me.id ? { ...p, ...patch } : p));
    emit('profiles', 'feed');
  },

  async listSavedIds(me) {
    return saved.get(me.id) ?? [];
  },

  async listSavedPosts(me) {
    const ids = saved.get(me.id) ?? [];
    return ids.map((pid) => posts.find((p) => p.id === pid)).filter((p): p is Post => Boolean(p)).map(withPeople);
  },

  async setSaved(me, postId, on) {
    const ids = (saved.get(me.id) ?? []).filter((x) => x !== postId);
    saved = new Map(saved).set(me.id, on ? [postId, ...ids] : ids);
    emit('saved');
  },

  async listFollowingIds(me) {
    return follows.filter((f) => f.creatorId === me.id).map((f) => f.businessId);
  },

  async setFollowing(me, businessId, on) {
    follows = follows.filter((f) => !(f.creatorId === me.id && f.businessId === businessId));
    if (on) follows = [...follows, { creatorId: me.id, businessId }];
    emit('follows');
  },

  async listAlerts(me) {
    return alerts
      .filter((a) => a.recipientId === me.id)
      .map((a) => ({ a, post: posts.find((p) => p.id === a.postId) }))
      .filter((x): x is { a: (typeof alerts)[number]; post: Post } => Boolean(x.post))
      .sort((x, y) => y.a.createdAt - x.a.createdAt)
      .map(({ a, post }) => ({ id: a.id, post: withPeople(post), createdAt: a.createdAt, read: a.read }));
  },

  async markAlertsRead(me) {
    alerts = alerts.map((a) => (a.recipientId === me.id ? { ...a, read: true } : a));
    emit('alerts');
  },

  async connectSocial(me, platform) {
    await wait(800);
    const handle = me.handle.replace('@', '');
    const patch = { [platform]: { username: handle, followers: me.followers ?? 1200, verifiedAt: new Date().toISOString() } };
    profiles = profiles.map((p) => (p.id === me.id ? { ...p, ...patch } : p));
    emit('profiles', 'feed');
  },

  async searchPlaces(query) {
    await wait(400);
    const q = query.trim();
    if (!q) return [];
    return [
      { placeId: `demo-${q}`, name: q, address: 'University Way NE, Seattle', location: { lat: 47.6612, lng: -122.3131 }, rating: 4.6, reviewCount: 34 },
      { placeId: `demo-${q}-2`, name: `${q} (Capitol Hill)`, address: 'E Pine St, Seattle', location: { lat: 47.6152, lng: -122.3202 }, rating: 4.3, reviewCount: 12 },
    ];
  },

  async claimPlace(me, place) {
    profiles = profiles.map((p) =>
      p.id === me.id
        ? {
            ...p,
            location: place.location,
            google: { placeId: place.placeId, address: place.address, rating: place.rating, reviewCount: place.reviewCount, ownerVerified: false },
          }
        : p,
    );
    emit('profiles');
  },

  async verifyGoogleOwnership(me) {
    await wait(800);
    profiles = profiles.map((p) => (p.id === me.id && p.google ? { ...p, google: { ...p.google, ownerVerified: true } } : p));
    emit('profiles', 'feed');
  },

  subscribe(topic, onChange) {
    if (!listeners.has(topic)) listeners.set(topic, new Set());
    listeners.get(topic)!.add(onChange);
    return () => listeners.get(topic)!.delete(onChange);
  },
};
