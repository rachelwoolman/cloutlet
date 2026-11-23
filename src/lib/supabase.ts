// The Supabase client. Only created when keys are in .env.
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { authStorage } from './authStorage';
import { config, isLive } from './config';

export const supabase: SupabaseClient = isLive
  ? createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : (null as unknown as SupabaseClient);

// Keep the login fresh only while the app is open (phones only)
if (isLive && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

// Uploaded videos and photos go in this Storage bucket (created in the SQL migration)
export const MEDIA_BUCKET = 'media';
