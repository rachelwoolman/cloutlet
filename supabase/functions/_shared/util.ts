// Shared helpers for Cloutlet's Edge Functions (Deno).
import { createClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}. Set it with: npx supabase secrets set ${name}=...`);
  return value;
}

// Full-access client. Only ever used on the server.
export const admin = () => createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

// The signed-in user who called this function, from their Authorization header
export async function callerId(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  return data.user?.id ?? null;
}

// Where OAuth providers send people back to. Register this exact URL with
// Instagram, TikTok and Google: https://<project-ref>.supabase.co/functions/v1/oauth-callback
export const callbackUrl = () => `${env('SUPABASE_URL')}/functions/v1/oauth-callback`;

// Only send people back to our own app (or our own website)
export function isAllowedReturn(url: string): boolean {
  const allowed = ['cloutlet://', 'exp://', ...(Deno.env.get('APP_WEB_ORIGINS') ?? 'http://localhost:8081').split(',')];
  return allowed.some((prefix) => prefix && url.startsWith(prefix.trim()));
}
