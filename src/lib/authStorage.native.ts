// On phones, keep the login session in expo-sqlite's localStorage (per the Expo + Supabase guide).
import 'expo-sqlite/localStorage/install';

export const authStorage = globalThis.localStorage;
