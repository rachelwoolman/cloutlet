// Search Google Maps for a business (Places API, New).
// Runs on the server so the Places key stays secret.
//
// POST { query: string } -> { places: PlaceResult[] }
import { callerId, corsHeaders, env, json } from '../_shared/util.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!(await callerId(req))) return json({ error: 'Sign in first' }, 401);
    const { query } = await req.json();
    if (typeof query !== 'string' || query.trim().length < 2) return json({ places: [] });

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env('GOOGLE_PLACES_API_KEY'),
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount',
      },
      body: JSON.stringify({ textQuery: query.trim(), pageSize: 8 }),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data.error?.message ?? 'Google search failed' }, 502);

    const places = (data.places ?? []).map((p: any) => ({
      placeId: p.id,
      name: p.displayName?.text ?? '',
      address: p.formattedAddress ?? '',
      location: { lat: p.location?.latitude, lng: p.location?.longitude },
      rating: p.rating ?? null,
      reviewCount: p.userRatingCount ?? null,
    }));
    return json({ places });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
