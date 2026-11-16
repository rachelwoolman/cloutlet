// Business > Discover: a feed of local creators' videos (mockup B1).
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, MasonryFeed, VideoThumbnail } from '../../components';
import { feed, getBusiness, currentBusinessId } from '../../data/fake';
import { colors, fonts, radius, spacing, type } from '../../theme';

const tabs = ['For you', 'Near you'] as const;
type Tab = (typeof tabs)[number];

export default function Discover() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('For you');
  const me = getBusiness(currentBusinessId)!;

  const q = query.trim().toLowerCase();
  const items = feed.filter((item) => {
    if (tab === 'Near you' && item.creator.neighborhood !== me.neighborhood) return false;
    if (!q) return true;
    return [item.title, item.creator.name, item.creator.neighborhood, item.creator.niche]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const header = (
    <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg }}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 26, color: colors.text }}>cloutlet</Text>

      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          height: 44,
          paddingHorizontal: spacing.md,
          borderRadius: radius.pill,
          backgroundColor: colors.buttonFill,
        }}
      >
        <Feather name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search styles, creators, neighborhoods"
          placeholderTextColor={colors.textSecondary}
          style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text, outlineStyle: 'none' } as any}
        />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: spacing.xl, borderBottomWidth: 1, borderColor: colors.divider }}>
        {tabs.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={{ paddingBottom: spacing.sm, marginBottom: -1 }}>
            <Text
              style={{
                fontFamily: tab === t ? fonts.bodyMedium : fonts.body,
                fontSize: 14,
                color: tab === t ? colors.text : colors.textSecondary,
              }}
            >
              {t}
            </Text>
            {tab === t ? (
              <View style={{ height: 2, backgroundColor: colors.text, marginTop: spacing.sm, borderRadius: 1 }} />
            ) : null}
          </Pressable>
        ))}
      </View>

      {items.length === 0 ? (
        <Text style={[type.body, { color: colors.textSecondary, paddingTop: spacing.xl, textAlign: 'center' }]}>
          Nothing for “{query}” yet. Try “matcha”. Everyone tries matcha.
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <MasonryFeed
        items={items}
        header={header}
        getHeight={(item) => item.height + 60}
        keyExtractor={(item) => item.id}
        renderItem={(item) => (
          <Pressable
            onPress={() => router.push(`/creator/${item.creator.id}`)}
            style={({ pressed }) => ({ gap: 6, opacity: pressed ? 0.7 : 1 })}
          >
            <VideoThumbnail uri={item.image} duration={item.duration} height={item.height} />
            <Text style={[type.bodyStrong, { fontSize: 14, lineHeight: 19 }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Avatar uri={item.creator.avatar} size={18} />
              <Text style={[type.small, { fontSize: 12 }]}>{item.creator.name}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
