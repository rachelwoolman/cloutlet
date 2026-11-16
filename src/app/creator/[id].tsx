// Creator profile, as a business sees it (mockup B2).
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Divider, TopBar, VideoThumbnail } from '../../components';
import { formatFollowers, getCreator, priceFor, services } from '../../data/fake';
import { colors, spacing, type } from '../../theme';

export default function CreatorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const creator = getCreator(id);
  const [messageNote, setMessageNote] = useState(false);

  if (!creator) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar />
        <Text style={[type.body, { padding: spacing.screen }]}>This creator wandered off. Try another one.</Text>
      </SafeAreaView>
    );
  }

  const firstName = creator.name.split(' ')[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TopBar />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Name and photo */}
        <View style={{ alignItems: 'center', paddingHorizontal: spacing.screen, gap: spacing.xs }}>
          <Avatar uri={creator.avatar} size={88} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md }}>
            <Text style={type.h1}>{creator.name}</Text>
            {creator.verified ? <Feather name="check-circle" size={16} color={colors.text} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="map-pin" size={12} color={colors.textSecondary} />
            <Text style={type.small}>
              {creator.neighborhood}, Seattle · {creator.niche}
            </Text>
          </View>
          <Text style={[type.body, { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.sm }]}>
            {creator.bio}
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.screen, marginTop: spacing.xl }}>
          {/* Stats */}
          <Divider />
          <View style={{ flexDirection: 'row', paddingVertical: spacing.md }}>
            <Stat value={formatFollowers(creator.followers)} label="followers" />
            <Stat value={`${creator.engagement}%`} label="engagement" />
            <Stat value={String(creator.collabs)} label="collabs" />
          </View>
          <Divider />

          {/* Rates (worked out from their audience size) */}
          <Text style={[type.label, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>Rates</Text>
          {services.map((service) => {
            const price = priceFor(service.id, creator.followers);
            return (
              <View
                key={service.id}
                style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm }}
              >
                <Text style={type.body}>{service.name}</Text>
                <Text style={type.bodyStrong}>{price === null ? 'Ask' : `$${price}`}</Text>
              </View>
            );
          })}
          {creator.openToPerksOnly ? (
            <Text style={[type.small, { marginTop: spacing.xs }]}>Also open to perks-only deals. Croissants accepted.</Text>
          ) : null}

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
            <Button
              title="Request a collab"
              style={{ flex: 1 }}
              onPress={() => router.push(`/request/${creator.id}`)}
            />
            <Button title="Message" variant="secondary" onPress={() => setMessageNote(true)} />
          </View>
          <Text style={[type.small, { textAlign: 'center', marginTop: spacing.sm }]}>
            {messageNote
              ? `Messaging is coming soon. For now, send ${firstName} a request.`
              : 'Contact details are shared once a collab is booked.'}
          </Text>

          {/* Work */}
          <Text style={[type.label, { marginTop: spacing.xxl, marginBottom: spacing.md }]}>Work</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.lg }}>
            {creator.videos.map((video) => (
              <View key={video.id} style={{ width: '48.5%', gap: 6 }}>
                <VideoThumbnail uri={video.image} duration={video.duration} height={190} />
                <Text style={[type.small, { color: colors.text }]} numberOfLines={2}>
                  {video.title}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={type.bodyStrong}>{value}</Text>
      <Text style={[type.small, { fontSize: 12 }]}>{label}</Text>
    </View>
  );
}
