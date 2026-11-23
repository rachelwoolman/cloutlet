// Starts a verification sign-in with Instagram, TikTok or Google.
// The app calls this, gets back a URL, and opens it in a browser sheet.
//
// POST { provider: 'instagram' | 'tiktok' | 'google', returnTo: string }
//   -> { url: string }
import { admin, callbackUrl, callerId, corsHeaders, env, isAllowedReturn, json } from '../_shared/util.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = await callerId(req);
    if (!userId) return json({ error: 'Sign in first' }, 401);

    const { provider, returnTo } = await req.json();
    if (!['instagram', 'tiktok', 'google'].includes(provider)) return json({ error: 'Unknown provider' }, 400);
    if (typeof returnTo !== 'string' || !isAllowedReturn(returnTo)) return json({ error: 'Bad return URL' }, 400);

    // A random one-time code ties the round trip back to this user
    const state = crypto.randomUUID();
    const { error } = await admin()
      .from('oauth_states')
      .insert({ state, profile_id: userId, provider, return_to: returnTo });
    if (error) throw error;

    const redirect = callbackUrl();
    let url: URL;

    if (provider === 'instagram') {
      // Instagram API with Instagram Login (works for Business and Creator accounts)
      url = new URL('https://www.instagram.com/oauth/authorize');
      url.searchParams.set('client_id', env('INSTAGRAM_APP_ID'));
      url.searchParams.set('redirect_uri', redirect);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'instagram_business_basic');
    } else if (provider === 'tiktok') {
      // TikTok Login Kit (v2)
      url = new URL('https://www.tiktok.com/v2/auth/authorize/');
      url.searchParams.set('client_key', env('TIKTOK_CLIENT_KEY'));
      url.searchParams.set('redirect_uri', redirect);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'user.info.basic,user.info.profile,user.info.stats');
    } else {
      // Google sign-in with Business Profile access, to prove they manage the listing
      url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', env('GOOGLE_OAUTH_CLIENT_ID'));
      url.searchParams.set('redirect_uri', redirect);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'https://www.googleapis.com/auth/business.manage');
      url.searchParams.set('prompt', 'select_account');
    }
    url.searchParams.set('state', state);

    return json({ url: url.toString() });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
