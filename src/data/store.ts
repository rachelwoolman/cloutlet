// A tiny in-memory store for things that change while you click around:
// new requests a business sends, and Accept / Pass on offers.
// It resets when the app reloads. A real backend would replace this later.
import { useSyncExternalStore } from 'react';
import { Offer, OfferStatus, offers as startingOffers } from './fake';

let offers: Offer[] = [...startingOffers];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addOffer(offer: Omit<Offer, 'id' | 'status' | 'sentAgo'>) {
  const newOffer: Offer = { ...offer, id: `o${Date.now()}`, status: 'new', sentAgo: 'Just now' };
  offers = [newOffer, ...offers];
  emit();
  return newOffer;
}

export function setOfferStatus(id: string, status: OfferStatus) {
  offers = offers.map((o) => (o.id === id ? { ...o, status } : o));
  emit();
}

// Use inside a screen: const offers = useOffers('renee');
export function useOffers(creatorId: string) {
  const all = useSyncExternalStore(subscribe, () => offers, () => offers);
  return all.filter((o) => o.creatorId === creatorId);
}
