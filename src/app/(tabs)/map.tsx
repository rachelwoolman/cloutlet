// Map: local businesses on Google Maps. Orange pins are hiring.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Empty, Loading, MapPin, MapPins, StatusPill, Verified } from '../../components';
import { inBounds, MapBounds } from '../../components/MapPins.types';
import { formatTerms, getService } from '../../data/catalog';
import { backend, useBusinesses, useFeed } from '../../data/hooks';
import { distanceMiles, formatDistance } from '../../data/rank';
import { useMe } from '../../data/session';
import { Job, Profile } from '../../data/types';
import { colors, fonts, spacing, type } from '../../theme';

const SEATTLE = { lat: 47.6615, lng: -122.3132 };

type OpenJob = Job & { caption: string };

export default function MapTab() {
  const me = useMe();
  const businesses = useBusinesses();
  const feed = useFeed(me);
  const [selectedId, setSelectedId] = useState<string>();
  const [view, setView] = useState<MapBounds>(); // the area on screen

  const jobsBy = useMemo(() => {
    const m = new Map<string, OpenJob>();
    (feed.data ?? []).forEach((p) => {
      if (p.kind === 'job' && p.job && !m.has(p.authorId)) m.set(p.authorId, { caption: p.caption, ...p.job });
    });
    return m;
  }, [feed.data]);

  const center = me.location ?? SEATTLE;
  const spots = (businesses.data ?? [])
    .filter((b) => b.location)
    .map((b) => ({ b, miles: distanceMiles(center, b.location!) }))
    .sort((x, y) => x.miles - y.miles);

  const pins: MapPin[] = spots.map(({ b }) => ({ id: b.id, title: b.name, location: b.location!, hiring: jobsBy.has(b.id) }));

  // Counts and list follow what's on the map: zoom in and they shrink to match
  const visible = view ? spots.filter(({ b }) => inBounds(view, b.location!)) : spots;
  const hiringCount = visible.filter(({ b }) => jobsBy.has(b.id)).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingVertical: spacing.md }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 26, color: colors.text }}>Map</Text>
        <Text style={type.small}>
          {visible.length} {visible.length === 1 ? 'spot' : 'spots'} · <Text style={{ color: colors.accent }}>{hiringCount} hiring</Text>
        </Text>
      </View>

      <View style={{ height: '50%', overflow: 'hidden', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider }}>
        <MapPins pins={pins} center={center} selectedId={selectedId} onSelect={setSelectedId} onBoundsChange={setView} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingVertical: spacing.md, gap: spacing.sm }}>
        {businesses.loading && !businesses.data ? <Loading /> : null}
        {businesses.data && spots.length === 0 ? <Empty title="No spots yet" /> : null}
        {businesses.data && spots.length > 0 && visible.length === 0 ? <Empty title="No spots in this area" note="Zoom out or move the map to see more." /> : null}
        {visible.map(({ b, miles }) => (
          <SpotRow
            key={b.id}
            business={b}
            distance={formatDistance(miles)}
            job={jobsBy.get(b.id)}
            selected={b.id === selectedId}
            onPress={() => setSelectedId(b.id)}
            onOpen={() => router.push(`/profile/${b.id}`)}
            onMessage={
              me.role === 'creator'
                ? async () => router.push(`/chat/${await backend.openThread(me, b.id)}`)
                : undefined
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

type SpotProps = {
  business: Profile;
  distance: string;
  job?: OpenJob;
  selected: boolean;
  onPress: () => void;
  onOpen: () => void;
  onMessage?: () => void;
};

function SpotRow({ business, distance, job, selected, onPress, onOpen, onMessage }: SpotProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.divider,
        backgroundColor: colors.surface,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar initials={business.initials} uri={business.avatar} shape="square" size={40} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={type.bodyStrong} numberOfLines={1}>
              {business.name}
            </Text>
            <Verified profile={business} size={13} />
          </View>
          <Text style={[type.small, { fontSize: 12 }]} numberOfLines={1}>
            {business.kind} · {distance}
            {business.google?.rating ? ` · ★ ${business.google.rating}` : ''}
          </Text>
        </View>
        {job ? <StatusPill label="Hiring" tone="accent" /> : null}
      </View>

      {selected ? (
        <>
          {job ? (
            <Text style={type.small}>
              {getService(job.serviceId).name} · {job.budget === null ? 'Open to offers' : formatTerms(job.budget, job.perks)}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title="View" size="sm" variant="secondary" style={{ flex: 1 }} onPress={onOpen} />
            {onMessage ? <Button title="Message" size="sm" style={{ flex: 1 }} onPress={onMessage} /> : null}
          </View>
        </>
      ) : null}
    </Pressable>
  );
}
