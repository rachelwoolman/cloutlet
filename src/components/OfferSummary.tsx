// An offer at a glance: who, how much, what, and whose move it is.
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { formatPerks } from '../data/catalog';
import { offerStatus, offerStep, OfferStep, Tone } from '../data/deals';
import { deliverablesLabel } from '../data/jobs';
import { Offer, Profile, Role } from '../data/types';
import { colors, fonts, radius, spacing, type } from '../theme';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { Divider } from './TopBar';
import { Verified } from './Verified';

export { isOpenOffer, needsMyMove, offerStatus, offerStep } from '../data/deals';
export type { OfferStep } from '../data/deals';

// What the terms on the card are, so it's clear when they're final
const termsHeading: Record<OfferStep, string> = {
  accept: 'Proposed terms',
  waiting: 'Proposed terms',
  confirm: 'Agreed terms · not confirmed yet',
  confirming: 'Agreed terms · not confirmed yet',
  deal: 'Confirmed deal',
  declined: 'Declined terms',
};

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
            {deliverablesLabel(offer.serviceId, offer.quantity ?? 1)} · {offer.postBy && offer.postBy !== 'Flexible' ? `by ${offer.postBy}` : 'Flexible date'}
          </Text>
        </View>
        <StatusPill {...status} />
      </View>

      <View>
        <Text style={[type.small, { fontSize: 12 }]}>{termsHeading[offerStep(offer, myRole)]}</Text>
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

const pillLook: Record<Tone, { bg: string; fg: string; border?: string }> = {
  action: { bg: colors.accent, fg: colors.onAccent },
  applied: { bg: colors.appliedSoft, fg: colors.applied },
  sent: { bg: 'transparent', fg: colors.accentPressed, border: colors.accent },
  waiting: { bg: colors.buttonFill, fg: colors.textSecondary },
  deal: { bg: colors.openSoft, fg: colors.open },
  declined: { bg: 'transparent', fg: colors.textSecondary, border: colors.divider },
};

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const look = pillLook[tone];
  return (
    <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: look.bg, borderWidth: look.border ? 1 : 0, borderColor: look.border }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: look.fg }}>{label}</Text>
    </View>
  );
}
