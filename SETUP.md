# Cloutlet setup: turning on the real backend

Without any keys the app runs in **demo mode**, using sample data that resets when you reload.

**Maps need no setup.** iPhone shows Apple Maps, Android shows Google Maps through Expo Go, and the web map uses [OpenStreetMap](https://www.openstreetmap.org) via Leaflet (no key, no account). OpenStreetMap's free tiles are for light use; pick a tile provider before launch ([usage policy](https://operations.osmfoundation.org/policies/tiles/)).
Work through the steps below to make it real. Each one says what it unlocks.

| Step | Unlocks | Cost to start |
| --- | --- | --- |
| 1. Supabase | Accounts, database, live chat, video uploads | Free tier |
| 2. Google Cloud | Business search, Google verification, your own phone map keys (optional) | Needs a billing account |
| 3. Instagram (Meta) | Creator verification | Free (needs app review) |
| 4. TikTok | Creator verification | Free (needs app review) |
| 5. Development build | Google Maps on iPhone (optional) | Free tier on Expo |

---

## 1. Supabase (backend)

1. Create a project at https://supabase.com/dashboard.
2. Copy `.env.example` to `.env`. From **Project Settings → API**, fill in:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Create the database tables and deploy the server functions:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   npx supabase functions deploy oauth-start oauth-callback places-search
   ```
4. **Authentication → Email**: keep Email on. In **Email Templates → Magic Link**, add `{{ .Token }}` so emails include the 6-digit code the app asks for.
5. Tell the server functions where your website lives (for web sign-in popups):
   ```bash
   npx supabase secrets set APP_WEB_ORIGINS=http://localhost:8081,https://your-site.com
   ```
6. Restart `npx expo start`. The "Demo mode" label on the welcome screen disappears.

Your OAuth callback URL, which steps 2–4 ask for, is:
```
https://<your-project-ref>.supabase.co/functions/v1/oauth-callback
```

## 2. Google Cloud (business verification, optional phone map keys)

Create a project at https://console.cloud.google.com and turn on billing (the free monthly credit covers early use).

**Turn on these APIs** (APIs & Services → Library):
- Maps SDK for iOS and Maps SDK for Android (only if you want your own map keys on phones)
- Places API (New) (business search)
- My Business Account Management API and My Business Business Information API (proving ownership)

**Keys** (APIs & Services → Credentials → Create API key). Make one per use and restrict each:
| Key | Restrict to | Put it in |
| --- | --- | --- |
| iOS maps | iOS apps: your bundle id | `.env` → `GOOGLE_MAPS_IOS_KEY` |
| Android maps | Android apps: package + SHA-1 | `.env` → `GOOGLE_MAPS_ANDROID_KEY` |
| Places | Places API (New) only | `npx supabase secrets set GOOGLE_PLACES_API_KEY=...` |

**Google sign-in (ownership check):**
1. **OAuth consent screen**: External. Add the scope `https://www.googleapis.com/auth/business.manage`.
2. **Credentials → Create OAuth client ID → Web application**. Authorized redirect URI = the callback URL above.
3. ```bash
   npx supabase secrets set GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=...
   ```
4. ⚠️ Google has to approve access to the Business Profile APIs. Apply here: https://developers.google.com/my-business/content/prereqs (approval can take a few weeks). Until then, the listing search works but "Sign in with Google" returns no listings.

## 3. Instagram (creator verification)

Uses the **Instagram API with Instagram Login**. It only works for Instagram **Creator or Business** accounts, since Meta shut off personal-account access in Dec 2024.

1. https://developers.facebook.com → Create app → type **Business** → add the **Instagram** product → "API setup with Instagram login".
2. Add the callback URL above as a redirect URL in **Business login settings**.
3. ```bash
   npx supabase secrets set INSTAGRAM_APP_ID=... INSTAGRAM_APP_SECRET=...
   ```
4. Testing: add your own Instagram account as an Instagram Tester under App roles.
5. Going public: submit the `instagram_business_basic` permission for **App Review**.

## 4. TikTok (creator verification)

1. https://developers.tiktok.com → Manage apps → Create app. Add **Login Kit**.
2. Scopes: `user.info.basic`, `user.info.profile`, `user.info.stats`.
3. Redirect URI: the callback URL above.
4. ```bash
   npx supabase secrets set TIKTOK_CLIENT_KEY=... TIKTOK_CLIENT_SECRET=...
   ```
5. Testing works in Sandbox mode with test users. Going public needs TikTok's app review.

## 5. Development build (Google Maps on iPhone, push later)

Expo Go can't use your own Google Maps key, so on iPhone it shows Apple Maps instead. Android uses Google Maps either way, and web uses OpenStreetMap. To get Google Maps on iPhone, build your own dev app:
```bash
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile development --platform ios
```
Install it on your phone, then run `npx expo start` as usual.

---

## Where things live

| What | Where |
| --- | --- |
| Database tables, permissions, deal logic | `supabase/migrations/20261118000000_init.sql` |
| Instagram / TikTok / Google verification | `supabase/functions/oauth-start`, `oauth-callback` |
| Google business search | `supabase/functions/places-search` |
| App ↔ Supabase | `src/data/live/liveBackend.ts` |
| Demo data | `src/data/demo/seed.ts` |
| Feed algorithm (tune the weights here) | `src/data/rank.ts` |
