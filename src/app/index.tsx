// Temporary screen showing every component.
// It becomes the Welcome screen in step 4.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Chip, MasonryFeed, VideoThumbnail } from '../components';
import { colors, spacing, type } from '../theme';

const coffee = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600';
const cafe = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600';

const sampleFeed = [
  { id: '1', height: 220, duration: '0:28', uri: cafe },
  { id: '2', height: 160, duration: '0:19', uri: coffee },
  { id: '3', height: 180, duration: '0:15', uri: coffee },
  { id: '4', height: 240, duration: '0:31', uri: cafe },
];

export default function Index() {
  const [perk, setPerk] = useState(true);

  const header = (
    <View style={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl }}>
      <Text style={type.label}>Component check</Text>
      <Text style={type.h1}>The building blocks</Text>

      <Text style={type.label}>Buttons</Text>
      <Button title="Request a collab" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button title="Message" variant="secondary" style={{ flex: 1 }} />
        <Button title="Pass" variant="secondary" style={{ flex: 1 }} />
      </View>
      <Button title="Offer a different price" variant="ghost" size="sm" />

      <Text style={type.label}>Chips (tap one)</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Chip label="2 pastries" selected={perk} onPress={() => setPerk(!perk)} />
        <Chip label="A drink" />
        <Chip label="#udistrict" />
      </View>

      <Text style={type.label}>Avatars</Text>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Avatar uri={coffee} size={56} />
        <Avatar initials="C&C" shape="square" size={56} />
        <Avatar size={56} />
      </View>

      <Text style={type.label}>Card</Text>
      <Card>
        <Text style={type.h3}>Crumb & Co.</Text>
        <Text style={type.small}>Bakery · U-District · 0.4 mi</Text>
      </Card>

      <Text style={type.label}>Video thumbnail + masonry feed</Text>
      <View style={{ height: 1, backgroundColor: colors.divider }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <MasonryFeed
        items={sampleFeed}
        header={header}
        getHeight={(item) => item.height}
        keyExtractor={(item) => item.id}
        renderItem={(item) => (
          <VideoThumbnail uri={item.uri} duration={item.duration} height={item.height} tag="Crumb & Co." />
        )}
      />
    </SafeAreaView>
  );
}
