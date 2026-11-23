// An offer at a glance: who, how much, what, and whose move it is.
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { formatPerks, getService } from '../data/catalog';
import { Offer, Profile, Role } from '../data/types';
import { colors, fonts, radius, spacing, type } from '../theme';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { Divider } from './TopBar';
import { Verified } from './Verified';

export function offerStatus(offer: Offer, myRole: Role): { label: string; tone: 'accent' | 'muted' | 'done' } {
  if (offer.status === 'accepted') return { label: 'Deal', tone: 'done' };
  if (offer.status === 'declined') return { label: 'Declined', tone: 'muted' };
  return offer.lastProposedBy === myRole ? { label: 'Waiting', tone: 'muted' } : { label: 'Your move', tone: 'accent' };
}

type Props = {
  offer: Offer;
  other: Profile; // the person on the other side
  myRole: Role;
  onPress?: () => void;
  children?: ReactNode; // buttons
  compact?: boolean;
};

export function OfferSummary({ offer, other, myRole, onPress, children, compact }: Props) {
  const status = offerStatus(offer, myRole);
  const service = getService(offer.serviceId);

  return (
    <Card onPress={onPress} style={{ gap: compact ? spacing.sm : spacing.md, opacity: offer.status === 'declined' ? 0.6 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar uri={other.avatar} initials={other.initials} size={compact ? 32 : 40} shape={other.role === 'business' ? 'square' : 'circle'} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={type.bodyStrong} numberOfLines={1}>
              {other.name}
            </Text>
            <Verified profile={other} size={13} />
          </View>
          <Text style={[type.small, { fontSize: 12 }]} numberOfLines={1}>
            {service.name} · {offer.postBy && offer.postBy !== 'Flexible' ? `by ${offer.postBy}` : 'Flexible date'}
          </Text>
        </View>
        <StatusPill {...status} />
      </View>

      <View>
        <Text style={compact ? type.h2 : type.h1}>{offer.price > 0 ? `$${offer.price}` : 'Perks only'}</Text>
        {offer.perks.length ? <Text style={type.small}>+ {formatPerks(offer.perks)}</Text> : null}
      </View>

      {children ? (
        <>
          {!compact ? <Divider /> : null}
          {children}
        </>
      ) : null}
    </Card>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: 'accent' | 'muted' | 'done' }) {
  const bg = tone === 'accent' ? colors.accent : tone === 'done' ? colors.accentSoft : colors.buttonFill;
  const fg = tone === 'accent' ? colors.onAccent : tone === 'done' ? colors.accentPressed : colors.textSecondary;
  return (
    <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: bg }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: fg }}>{label}</Text>
    </View>
  );
}
