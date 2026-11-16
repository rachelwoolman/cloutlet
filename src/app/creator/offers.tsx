// Creator > Offers inbox: accept or pass on requests from businesses.
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Divider, TopBar } from '../../components';
import { currentCreatorId, getBusiness, getCreator, getService, Offer } from '../../data/fake';
import { setOfferStatus, useOffers } from '../../data/store';
import { colors, spacing, type } from '../../theme';

export default function OffersInbox() {
  // "as" lets the Sent screen open the inbox of whoever got the request
  const { as } = useLocalSearchParams<{ as?: string }>();
  const creatorId = as ?? currentCreatorId;
  const creator = getCreator(creatorId);
  const offers = useOffers(creatorId);
  const newCount = offers.filter((o) => o.status === 'new').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <TopBar />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
          <Text style={type.label}>{creator ? `${creator.name} · ${creator.handle}` : 'Your inbox'}</Text>
          <Text style={type.h1}>Offers</Text>
          <Text style={[type.body, { color: colors.textSecondary }]}>
            {newCount === 0
              ? 'All caught up. Go film something nice.'
              : `${newCount} new. Local spots want you on camera.`}
          </Text>
        </View>

        {offers.length === 0 ? (
          <Text style={[type.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl }]}>
            No offers yet. Your inbox is as quiet as a library at 8 AM.
          </Text>
        ) : null}

        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const business = getBusiness(offer.businessId);
  const service = getService(offer.serviceId);
  if (!business) return null;

  return (
    <Card style={{ gap: spacing.md, opacity: offer.status === 'passed' ? 0.6 : 1 }}>
      {/* Who */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar initials={business.initials} shape="square" size={40} />
        <View style={{ flex: 1 }}>
          <Text style={type.bodyStrong}>{business.name}</Text>
          <Text style={[type.small, { fontSize: 12 }]}>
            {business.kind} · {business.neighborhood}
          </Text>
        </View>
        <Text style={[type.small, { fontSize: 12 }]}>{offer.sentAgo}</Text>
      </View>

      {/* How much */}
      <View>
        <Text style={type.h1}>${offer.price}</Text>
        {offer.perks.length ? (
          <Text style={type.small}>+ {offer.perks.join(' & ').toLowerCase()}</Text>
        ) : null}
      </View>

      <Divider />
      <Row label="You make" value={service.name} />
      <Row label="Post by" value={offer.postBy} />
      <Divider />

      <Text style={[type.body, { color: colors.textSecondary }]}>“{offer.message}”</Text>

      {/* Actions */}
      {offer.status === 'new' ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button title="Pass" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => setOfferStatus(offer.id, 'passed')} />
          <Button title="Accept" size="sm" style={{ flex: 1 }} onPress={() => setOfferStatus(offer.id, 'accepted')} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Feather
            name={offer.status === 'accepted' ? 'check-circle' : 'minus-circle'}
            size={16}
            color={offer.status === 'accepted' ? colors.text : colors.textSecondary}
          />
          <Text style={[type.small, { flex: 1, color: offer.status === 'accepted' ? colors.text : colors.textSecondary }]}>
            {offer.status === 'accepted'
              ? `Accepted. ${business.name} will share details soon.`
              : 'Passed. No hard feelings.'}
          </Text>
          <Button title="Undo" variant="ghost" size="sm" onPress={() => setOfferStatus(offer.id, 'new')} />
        </View>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={type.small}>{label}</Text>
      <Text style={[type.small, { color: colors.text }]}>{value}</Text>
    </View>
  );
}
