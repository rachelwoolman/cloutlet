// Temporary screen showing every component.
// It becomes the Welcome screen in step 4.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Chip, MasonryFeed, VideoThumbnail } from '../components';
import { businesses, creators, feed } from '../data/fake';
import { colors, spacing, type } from '../theme';

const coffee = creators[0].avatar;

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
        <Text style={type.h3}>{businesses[0].name}</Text>
        <Text style={type.small}>{businesses[0].kind} · {businesses[0].neighborhood} · {businesses[0].distance}</Text>
      </Card>

      <Text style={type.label}>Fake feed from src/data/fake.ts</Text>
      <View style={{ height: 1, backgroundColor: colors.divider }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <MasonryFeed
        items={feed}
        header={header}
        getHeight={(item) => item.height}
        keyExtractor={(item) => item.id}
        renderItem={(item) => (
          <View style={{ gap: spacing.xs }}>
            <VideoThumbnail uri={item.image} duration={item.duration} height={item.height} />
            <Text style={type.bodyStrong} numberOfLines={2}>{item.title}</Text>
            <Text style={type.small}>{item.creator.name}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
