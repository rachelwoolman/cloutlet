// Keys from .env (see .env.example and SETUP.md).
// EXPO_PUBLIC_ values are built into the app, so only put public keys here.
// Secret keys (Instagram, TikTok, Google OAuth) live in Supabase, never in the app.

export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
};

// No Supabase keys yet? The app runs in demo mode with the data in src/data/demo/seed.ts.
export const isLive = Boolean(config.supabaseUrl && config.supabaseKey);
