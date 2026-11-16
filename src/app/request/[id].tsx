// Business > Request a collab with a creator (mockup B3 + audience pricing from P1).
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Chip, Divider, TopBar } from '../../components';
import {
  audienceTiers,
  currentBusinessId,
  getBusiness,
  getCreator,
  perkOptions,
  priceFor,
  ServiceId,
  services,
  tierIndexFor,
  tierPrices,
} from '../../data/fake';
import { addOffer } from '../../data/store';
import { colors, fonts, radius, spacing, type } from '../../theme';

export default function RequestCollab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const creator = getCreator(id);
  const business = getBusiness(currentBusinessId)!;

  const firstName = creator?.name.split(' ')[0] ?? '';
  const [serviceId, setServiceId] = useState<ServiceId>('maps');
  const [perks, setPerks] = useState<string[]>(['2 pastries', 'A drink']);
  const [message, setMessage] = useState(
    `Hi ${firstName}! We're ${business.name}, a ${business.kind.toLowerCase()} in the ${business.neighborhood}. ` +
      `We love your videos and would love a short one about a quiet afternoon here.`,
  );

  if (!creator) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar icon="close" />
        <Text style={[type.body, { padding: spacing.screen }]}>Couldn't find that creator.</Text>
      </SafeAreaView>
    );
  }

  const myTier = tierIndexFor(creator.followers);
  const price = priceFor(serviceId, creator.followers);

  const togglePerk = (perk: string) =>
    setPerks((current) => (current.includes(perk) ? current.filter((p) => p !== perk) : [...current, perk]));

  const send = () => {
    addOffer({
      businessId: business.id,
      creatorId: creator.id,
      serviceId,
      price: price ?? 0,
      perks,
      message,
      postBy: 'Fri, Dec 5',
    });
    router.replace(`/request/sent?creatorId=${creator.id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <TopBar icon="close" title="New request" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Who */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm }}>
          <Avatar uri={creator.avatar} size={44} />
          <View>
            <Text style={type.h2}>Collab with {firstName}</Text>
            <Text style={type.small}>{creator.replyTime}</Text>
          </View>
        </View>

        {/* What */}
        <Text style={[type.label, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>What do you need?</Text>
        <View style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, backgroundColor: colors.surface }}>
          {services.map((service, i) => {
            const selected = service.id === serviceId;
            const servicePrice = priceFor(service.id, creator.followers);
            return (
              <View key={service.id}>
                {i > 0 ? <Divider /> : null}
                <Pressable
                  onPress={() => setServiceId(service.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}
                >
                  <Radio selected={selected} />
                  <View style={{ flex: 1 }}>
                    <Text style={selected ? type.bodyStrong : type.body}>{service.name}</Text>
                    {selected ? <Text style={[type.small, { fontSize: 12 }]}>{service.description}</Text> : null}
                  </View>
                  <Text style={type.bodyStrong}>{servicePrice === null ? 'Ask' : `$${servicePrice}`}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Perks */}
        <Text style={[type.label, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>Add perks</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {perkOptions.map((perk) => (
            <Chip key={perk} label={perk} selected={perks.includes(perk)} onPress={() => togglePerk(perk)} />
          ))}
        </View>

        {/* Audience pricing */}
        <Text style={[type.label, { marginTop: spacing.xl, marginBottom: spacing.xs }]}>Price by audience size</Text>
        <Text style={[type.small, { marginBottom: spacing.sm }]}>
          Everyone pays the same rate for the same reach. No haggling over oat milk.
        </Text>
        <View style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, overflow: 'hidden' }}>
          {audienceTiers.map((tier, i) => {
            const isMine = i === myTier;
            const tierPrice = tierPrices[serviceId][i];
            return (
              <View key={tier.label}>
                {i > 0 ? <Divider /> : null}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    backgroundColor: isMine ? colors.buttonFill : colors.surface,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={isMine ? type.bodyStrong : type.body}>
                      {tier.label}
                      {isMine ? `  •  ${firstName}` : ''}
                    </Text>
                    <Text style={[type.small, { fontSize: 12 }]}>{tier.note}</Text>
                  </View>
                  <Text style={isMine ? type.bodyStrong : [type.body, { color: colors.textSecondary }]}>
                    {tierPrice === null ? '—' : `$${tierPrice}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Message */}
        <Text style={[type.label, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>Your message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          style={{
            minHeight: 120,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.divider,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 22,
            color: colors.text,
            textAlignVertical: 'top',
          }}
        />
      </ScrollView>

      {/* Summary + send, pinned to the bottom */}
      <View style={{ paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing.md, borderTopWidth: 1, borderColor: colors.divider, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={type.bodyStrong}>You'll pay {firstName}</Text>
          <Text style={type.h3}>
            {price === null ? 'Price on request' : `$${price}`}
            {perks.length ? ' + perks' : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Feather name="info" size={13} color={colors.textSecondary} style={{ marginTop: 2 }} />
          <Text style={[type.small, { flex: 1, fontSize: 12 }]}>
            You pay {firstName} directly, however you both like. Cloutlet never touches the money.
          </Text>
        </View>
        <Button title="Send request" onPress={send} disabled={!message.trim()} style={{ marginTop: spacing.xs }} />
      </View>
    </SafeAreaView>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: selected ? colors.text : colors.divider,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.text }} /> : null}
    </View>
  );
}
