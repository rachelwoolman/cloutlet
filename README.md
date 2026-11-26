# cloutlet

Cloutlet connects small local businesses (cafes, bakeries) with local micro-creators who make paid content for them.

Runs in **demo mode** (sample data, no setup) until you add Supabase keys. See **[SETUP.md](SETUP.md)** to turn on the real backend, maps and verification.

## Run it

```bash
npm install
npx expo start        # scan the QR code with Expo Go, or press w for web
```

## What's in the app

- **Explore**: one feed for both sides. Creator videos plus business job posts, ranked by `src/data/rank.ts`. Tap any post to open it full screen and swipe up and down, like Reels.
- **Collab tags**: videos booked through Cloutlet link both the creator and the business.
- **Map**: local businesses on a map (Apple Maps on iPhone, Google Maps on Android, OpenStreetMap on web). Orange pins are hiring.
- **Post**: creators upload portfolio videos. Businesses post jobs or videos.
- **Hiring posts**: businesses describe the work (format, how many, description, pay per creator, optional deadline, timeframe and number of creators) and edit it later from **Your posts** on their profile. Creators tap **Apply**, review a default message and send it; only a sent message counts as an application.
- **Inbox**: deals are agreed in the chat in three steps: the business sends an offer, the creator accepts the terms, the business confirms. Businesses see Sent offers, Applicants (by post) and Messages (filter by post or Casual).
- **Verification**: creators connect Instagram/TikTok. Businesses verify their Google listing.

## Where things live

| What | File |
| --- | --- |
| Colors (orange accent), fonts, spacing | `src/theme.ts` |
| Data types | `src/data/types.ts` |
| Services, pricing tiers, perks | `src/data/catalog.ts` |
| Feed algorithm | `src/data/rank.ts` |
| Job posts (labels, checks, Apply message) | `src/data/jobs.ts` |
| Deal and conversation labels | `src/data/deals.ts` |
| Tests (`npm test`) | `src/data/__tests__/` |
| Hooks screens use to read data | `src/data/hooks.ts` |
| Login session | `src/data/session.ts` |
| Demo backend + sample data | `src/data/demo/` |
| Supabase backend | `src/data/live/liveBackend.ts` |
| Database + server functions | `supabase/` |
| Reusable pieces | `src/components/` |
| Screens (every file is a screen) | `src/app/` |

Built with Expo SDK 58, Expo Router, Supabase, react-native-maps, Leaflet + OpenStreetMap (web map), expo-video.
