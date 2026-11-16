# cloutlet

Cloutlet connects small local businesses (cafes, bakeries) with local micro-creators who make paid content for them.

This is a **clickable prototype with fake data**: no backend, no login, no payments yet.

## Run it

```bash
npm install
npx expo start        # then scan the QR code with Expo Go on your phone
npx expo start --web  # or open it in your browser
```

## The flow

Welcome → **I'm a business** → Discover feed → Creator profile → Request a collab → Sent
Welcome → **I'm a creator** → Offers inbox (Accept / Pass)

## Where things live

| What | File |
| --- | --- |
| Colors, fonts, spacing | `src/theme.ts` |
| All fake creators, businesses, prices, offers | `src/data/fake.ts` |
| Things that change while you click (sent requests, Accept/Pass) | `src/data/store.ts` |
| Reusable pieces (Button, Card, Chip, Avatar, VideoThumbnail, MasonryFeed) | `src/components/` |
| Screens (every file is a screen) | `src/app/` |
| Logo | `assets/logo.jpg` |
| Design mockups | `mockups/` |

Built with Expo + TypeScript + Expo Router.
