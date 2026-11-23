// Your location: asks permission once, then saves a rough location (~half a mile) on
// your profile so Explore, Nearby and the Map can show spots near you.
//
// - Businesses with a Google listing use the listing's address instead, so we never ask them.
// - The location is rounded before saving, because profiles are readable by other users.
// - Demo mode: if you're far from the sample spots (Seattle), we keep the sample
//   location so the demo still has things nearby to show.
// - The Location switch in Settings can turn it off. That clears the saved location and
//   is remembered on this device, so we don't quietly turn it back on.
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { authStorage } from '../lib/authStorage';
import { isLive } from '../lib/config';
import { backend } from './hooks';
import { distanceMiles } from './rank';
import { LatLng, Profile } from './types';

const DEMO_AREA = { lat: 47.6615, lng: -122.3132 };
const DEMO_RADIUS_MILES = 30;

export type LocationStatus = 'checking' | 'on' | 'off' | 'blocked' | 'listing';
// on: allowed and saved · off: not asked yet, or asked and can ask again
// blocked: said no, must change it in Settings · listing: business using its Google address

export const usesListingLocation = (me: Profile) => me.role === 'business' && Boolean(me.google);

// 2 decimal places: about 0.7 mi north-south, 0.5 mi east-west in Seattle
const round = (n: number) => Math.round(n * 100) / 100;

async function saveCurrentPosition(me: Profile) {
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
  const here: LatLng = { lat: round(pos.coords.latitude), lng: round(pos.coords.longitude) };
  if (!isLive && distanceMiles(here, DEMO_AREA) > DEMO_RADIUS_MILES) return; // keep the sample location
  if (me.location && me.location.lat === here.lat && me.location.lng === here.lng) return;
  await backend.setLocation(me, here);
}

let askedThisSession = false;

const OFF_KEY = 'cloutlet.location.off';
function isTurnedOff(): boolean {
  try {
    return authStorage?.getItem(OFF_KEY) === '1';
  } catch {
    return false;
  }
}
function setTurnedOff(off: boolean) {
  try {
    if (off) authStorage?.setItem(OFF_KEY, '1');
    else authStorage?.removeItem(OFF_KEY);
  } catch {
    // storage unavailable; the choice just won't be remembered
  }
}

// Runs once when you're signed in: asks the first time, refreshes quietly after that.
export function useLocationSync(me: Profile) {
  const skip = usesListingLocation(me);
  useEffect(() => {
    if (skip || isTurnedOff()) return;
    let alive = true;
    (async () => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === 'undetermined' && perm.canAskAgain && !askedThisSession) {
          askedThisSession = true;
          perm = await Location.requestForegroundPermissionsAsync();
        }
        if (alive && perm.granted) await saveCurrentPosition(me);
      } catch {
        // Location is a nice-to-have; the app works without it
      }
    })();
    return () => {
      alive = false;
    };
    // Only on sign-in (me.id), not every time the profile changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id, skip]);
}

async function readPermission(): Promise<'on' | 'off' | 'blocked'> {
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    return perm.granted ? 'on' : perm.canAskAgain ? 'off' : 'blocked';
  } catch {
    return 'off';
  }
}

// For the Location switch in Settings
export function useLocationStatus(me: Profile) {
  const listing = usesListingLocation(me);
  const [permission, setPermission] = useState<'checking' | 'on' | 'off' | 'blocked'>('checking');
  const [off, setOff] = useState(isTurnedOff);

  const check = useCallback(() => readPermission().then(setPermission), []);

  useEffect(() => {
    if (listing) return;
    let alive = true;
    readPermission().then((p) => alive && setPermission(p));
    return () => {
      alive = false;
    };
  }, [listing]);

  const setEnabled = useCallback(
    async (on: boolean) => {
      setTurnedOff(!on);
      setOff(!on);
      try {
        if (!on) {
          await backend.setLocation(me, null);
          return;
        }
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) await saveCurrentPosition(me);
        else {
          setTurnedOff(true);
          setOff(true);
        }
      } catch {
        // ignore; the switch below shows what happened
      }
      await check();
    },
    [me, check],
  );

  const status: LocationStatus = listing ? 'listing' : off ? 'off' : permission;
  return { status, enabled: status === 'on', setEnabled };
}
