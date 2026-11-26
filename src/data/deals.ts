// Where a deal or a conversation stands. No React here, so it's easy to test.
import { Offer, Role, ThreadWithPeople } from './types';

// Where a deal stands, from my side. Proposer = whoever set the current terms.
//   accept      the other side proposed terms; I can accept or decline them
//   waiting     I proposed; waiting on them to accept
//   confirm     they accepted my terms; I confirm to make it a deal
//   confirming  I accepted their terms; waiting on them to confirm
//   deal        confirmed by both · declined: closed
export type OfferStep = 'accept' | 'waiting' | 'confirm' | 'confirming' | 'deal' | 'declined';

export function offerStep(offer: Offer, myRole: Role): OfferStep {
  if (offer.status === 'accepted') return 'deal';
  if (offer.status === 'declined') return 'declined';
  const iProposed = offer.lastProposedBy === myRole;
  if (offer.status === 'agreed') return iProposed ? 'confirm' : 'confirming';
  return iProposed ? 'waiting' : 'accept';
}

// Offers that still need me to do something (Inbox badge)
export const needsMyMove = (offer: Offer, myRole: Role) => ['accept', 'confirm'].includes(offerStep(offer, myRole));

// Still being worked out: not a deal yet, not declined
export const isOpenOffer = (offer: Offer) => offer.status === 'pending' || offer.status === 'agreed';

// How a status pill looks. Each status has its own look so they're easy to tell apart:
// action = needs you (solid orange) · applied (blue) · sent (orange outline) · waiting (grey)
// deal (green) · declined (faded outline)
export type Tone = 'action' | 'applied' | 'sent' | 'waiting' | 'deal' | 'declined';

export function offerStatus(offer: Offer, myRole: Role): { label: string; tone: Tone } {
  switch (offerStep(offer, myRole)) {
    case 'deal':
      return { label: 'Deal', tone: 'deal' };
    case 'declined':
      return { label: 'Declined', tone: 'declined' };
    case 'accept':
      return { label: 'Your move', tone: 'action' };
    case 'confirm':
      return { label: 'Confirm', tone: 'action' };
    default:
      return { label: 'Waiting', tone: 'waiting' };
  }
}

// The label on a conversation in the Inbox. Only follows things that really happened
// (an application was sent, an offer moved a step); nobody sets it by hand.
//   Applied             creator applied to a post, no offer yet
//   Offer sent / New offer    offer waiting on the creator
//   Confirm deal / Waiting to confirm   creator accepted, business to confirm
//   Deal · in progress  confirmed
//   Declined
// A casual chat with no application and no offer has no label.
// There is no "Done" yet: nothing in the app marks a collab finished.
export function conversationLabel(thread: ThreadWithPeople, myRole: Role): { label: string; tone: Tone } | null {
  const o = thread.offer;
  if (o) {
    switch (offerStep(o, myRole)) {
      case 'deal':
        return { label: 'Deal · in progress', tone: 'deal' };
      case 'declined':
        return { label: 'Declined', tone: 'declined' };
      case 'waiting':
        return { label: 'Offer sent', tone: 'sent' };
      case 'accept':
        return { label: 'New offer', tone: 'action' };
      case 'confirm':
        return { label: 'Confirm deal', tone: 'action' };
      case 'confirming':
        return { label: 'Waiting to confirm', tone: 'waiting' };
    }
  }
  if (thread.applications.length) return { label: 'Applied', tone: 'applied' };
  return null;
}
