// Instagram, TikTok and Google send people here after they approve.
// We swap the one-time code for a token, read the account, save the
// verification, then send the person back to the app.
//
// This function must be public (verify_jwt = false in supabase/config.toml),
// because the provider's browser redirect has no Supabase login attached.
import { admin, callbackUrl, env } from '../_shared/util.ts';

const MAX_AGE_MS = 15 * 60 * 1000;

Deno.serve(async (req) => {
  const params = new URL(req.url).searchParams;
  const state = params.get('state') ?? '';
  const code = params.get('code');

  const db = admin();
  const { data: row } = await db.from('oauth_states').select('*').eq('state', state).maybeSingle();
  if (!row) return new Response('This link expired. Go back to Cloutlet and try again.', { status: 400 });
  await db.from('oauth_states').delete().eq('state', state); // one use only

  const back = (status: 'ok' | 'error', message = '') => {
    const url = new URL(row.return_to);
    url.searchParams.set('provider', row.provider);
    url.searchParams.set('status', status);
    if (message) url.searchParams.set('message', message);
    return Response.redirect(url.toString(), 302);
  };

  try {
    if (Date.now() - new Date(row.created_at).getTime() > MAX_AGE_MS) return back('error', 'Took too long. Try again.');
    if (!code) return back('error', params.get('error_description') ?? 'Cancelled');

    if (row.provider === 'instagram') {
      const account = await instagramAccount(code);
      await saveSocial(db, row.profile_id, 'instagram', account);
    } else if (row.provider === 'tiktok') {
      const account = await tiktokAccount(code);
      await saveSocial(db, row.profile_id, 'tiktok', account);
    } else if (row.provider === 'google') {
      const ok = await googleOwnsListing(db, row.profile_id, code);
      if (!ok) return back('error', "That Google account doesn't manage this listing.");
    }
    return back('ok');
  } catch (e) {
    console.error(e);
    return back('error', e instanceof Error ? e.message : 'Something went wrong');
  }
});

type Account = { id: string; username: string; followers: number | null };

async function saveSocial(db: ReturnType<typeof admin>, profileId: string, platform: string, a: Account) {
  const { error } = await db.from('social_accounts').upsert({
    profile_id: profileId,
    platform,
    username: a.username,
    external_id: a.id,
    followers: a.followers,
    verified_at: new Date().toISOString(),
  });
  if (error) {
    if (error.code === '23505') throw new Error('That account is already linked to another Cloutlet profile.');
    throw error;
  }
  // Use the biggest verified audience as the creator's follower count (drives pricing tiers)
  const { data: all } = await db.from('social_accounts').select('followers').eq('profile_id', profileId);
  const best = Math.max(0, ...(all ?? []).map((r) => r.followers ?? 0));
  await db.from('profiles').update({ followers: best }).eq('id', profileId);
}

function form(values: Record<string, string>) {
  return { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(values) };
}

// ---------- Instagram (Instagram API with Instagram Login) ----------
async function instagramAccount(code: string): Promise<Account> {
  const tokenRes = await fetch(
    'https://api.instagram.com/oauth/access_token',
    form({
      client_id: env('INSTAGRAM_APP_ID'),
      client_secret: env('INSTAGRAM_APP_SECRET'),
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl(),
      code,
    }),
  );
  const tokenJson = await tokenRes.json();
  const token = tokenJson.access_token ?? tokenJson.data?.[0]?.access_token;
  if (!token) throw new Error('Instagram sign-in failed');

  const me = await fetch(
    `https://graph.instagram.com/me?fields=user_id,username,followers_count&access_token=${encodeURIComponent(token)}`,
  ).then((r) => r.json());
  if (!me.username) throw new Error('Could not read your Instagram account. It must be a Creator or Business account.');
  return { id: String(me.user_id ?? me.id), username: me.username, followers: me.followers_count ?? null };
}

// ---------- TikTok (Login Kit v2) ----------
async function tiktokAccount(code: string): Promise<Account> {
  const tokenJson = await fetch(
    'https://open.tiktokapis.com/v2/oauth/token/',
    form({
      client_key: env('TIKTOK_CLIENT_KEY'),
      client_secret: env('TIKTOK_CLIENT_SECRET'),
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl(),
      code,
    }),
  ).then((r) => r.json());
  if (!tokenJson.access_token) throw new Error('TikTok sign-in failed');

  const info = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name,follower_count',
    { headers: { Authorization: `Bearer ${tokenJson.access_token}` } },
  ).then((r) => r.json());
  const user = info.data?.user;
  if (!user?.open_id) throw new Error('Could not read your TikTok account');
  return { id: user.open_id, username: user.username ?? user.display_name, followers: user.follower_count ?? null };
}

// ---------- Google (Business Profile APIs) ----------
// True if the Google account that signed in manages the listing this business claimed.
async function googleOwnsListing(db: ReturnType<typeof admin>, profileId: string, code: string): Promise<boolean> {
  const { data: listing } = await db.from('google_listings').select('place_id').eq('profile_id', profileId).maybeSingle();
  if (!listing) throw new Error('Pick your business on Google Maps first');

  const tokenJson = await fetch(
    'https://oauth2.googleapis.com/token',
    form({
      client_id: env('GOOGLE_OAUTH_CLIENT_ID'),
      client_secret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl(),
      code,
    }),
  ).then((r) => r.json());
  if (!tokenJson.access_token) throw new Error('Google sign-in failed');
  const auth = { headers: { Authorization: `Bearer ${tokenJson.access_token}` } };

  const accounts = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', auth).then((r) => r.json());
  for (const account of accounts.accounts ?? []) {
    let pageToken = '';
    do {
      const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`);
      url.searchParams.set('readMask', 'name,title,metadata');
      url.searchParams.set('pageSize', '100');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const page = await fetch(url, auth).then((r) => r.json());
      if (page.locations?.some((l: { metadata?: { placeId?: string } }) => l.metadata?.placeId === listing.place_id)) {
        await db
          .from('google_listings')
          .update({ owner_verified: true, verified_at: new Date().toISOString() })
          .eq('profile_id', profileId);
        return true;
      }
      pageToken = page.nextPageToken ?? '';
    } while (pageToken);
  }
  return false;
}
