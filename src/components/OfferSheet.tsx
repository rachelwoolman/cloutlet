// Business > propose terms to one creator, from inside the chat. Two steps: edit, then review.
// Used for a new offer (casual chat, or terms copied from the post they applied to) and for
// changing an open offer. Sends no message: the business writes in the chat if it wants to.
// An individual offer: no post-level fields like "creators to hire".
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { firstName, offeredServices, priceFor, services } from '../data/catalog';
import { backend } from '../data/hooks';
import { MAX_QUANTITY, offerTermsLine } from '../data/jobs';
import { Offer, OfferTerms, Profile, ServiceId } from '../data/types';
import { colors, fonts, radius, spacing, type } from '../theme';
import { Button } from './Button';
import { Chip } from './Chip';
import { Stepper } from './FormFields';
import { ErrorNote } from './States';
import { TermsEditor } from './TermsEditor';

export type OfferSheetMode =
  | { kind: 'new'; postId?: string; postTitle?: string; start?: Partial<OfferTerms>; review?: boolean }
  | { kind: 'revise'; offer: Offer };

type Props = {
  me: Profile;
  creator: Profile;
  mode: OfferSheetMode;
  onClose: () => void;
  onSent: (threadId: string) => void;
};

export function OfferSheet({ me, creator, mode, onClose, onSent }: Props) {
  const insets = useSafeAreaInsets();
  const start: Partial<OfferTerms> = mode.kind === 'revise' ? mode.offer : (mode.start ?? {});
  const listed = offeredServices(creator).map((s) => s.id);
  const [serviceId, setServiceId] = useState<ServiceId>(start.serviceId ?? listed[0] ?? 'reel');
  const [quantity, setQuantity] = useState(start.quantity ?? 1);
  const suggested = priceFor(serviceId, creator.followers ?? 0);
  const [price, setPrice] = useState<number>(start.price ?? suggested ?? 0);
  const [perks, setPerks] = useState<string[]>(start.perks ?? []);
  const [postBy, setPostBy] = useState(start.postBy && start.postBy !== 'Flexible' ? start.postBy : '');
  const [step, setStep] = useState<'edit' | 'review'>(mode.kind === 'new' && mode.review ? 'review' : 'edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const terms: OfferTerms = { serviceId, quantity, price, perks, postBy: postBy.trim() || 'Flexible' };
  const empty = price <= 0 && perks.length === 0;
  const name = firstName(creator.name);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode.kind === 'revise') {
        await backend.reviseOffer(me, mode.offer.id, terms, '');
        onSent(mode.offer.threadId);
      } else {
        const offer = await backend.createOffer(me, { creatorId: creator.id, postId: mode.postId, ...terms, message: '' });
        onSent(offer.threadId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const title = mode.kind === 'revise' ? 'Change terms' : mode.postId ? 'Propose terms' : `Offer to ${name}`;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: '88%' }}>
        <View style={{ backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: insets.bottom }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.screen, paddingBottom: spacing.sm }}>
            <Text style={type.h2}>{step === 'review' ? 'Review' : title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Text style={type.small}>Cancel</Text>
            </Pressable>
          </View>

          {step === 'edit' ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
              {mode.kind === 'new' && mode.postTitle ? <Text style={type.small}>From your post “{mode.postTitle}”</Text> : null}

              <View style={{ gap: spacing.sm }}>
                <Text style={type.label}>Pay · total for {name}</Text>
                <TermsEditor price={price} perks={perks} onChange={(p, k) => (setPrice(p), setPerks(k))} />
                {suggested != null ? <Text style={[type.small, { fontSize: 12 }]}>Their rate for one {services.find((s) => s.id === serviceId)!.name}: ${suggested}</Text> : null}
              </View>

              <View style={{ gap: spacing.sm }}>
                <Text style={type.label}>Deliverables</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {services.map((s) => (
                    <Chip key={s.id} label={s.name} selected={serviceId === s.id} onPress={() => setServiceId(s.id)} />
                  ))}
                </View>
                {!listed.includes(serviceId) ? <Text style={[type.small, { fontSize: 12 }]}>{name} doesn’t list this format. Check with them in chat.</Text> : null}
                <Stepper value={quantity} min={1} max={MAX_QUANTITY} onChange={setQuantity} label="deliverables" />
              </View>

              <View style={{ gap: spacing.sm }}>
                <Text style={type.label}>Due (optional)</Text>
                <TextInput
                  value={postBy}
                  onChangeText={setPostBy}
                  placeholder="e.g. Dec 12"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={30}
                  accessibilityLabel="Due date"
                  style={{ height: 48, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 15, color: colors.text }}
                />
              </View>
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.md }}>
              <View style={{ padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, gap: 4 }}>
                <Text style={type.small}>{mode.kind === 'revise' ? `New terms for ${name}` : `To ${name}`}</Text>
                <Text style={type.bodyStrong}>{offerTermsLine(terms)}</Text>
              </View>
              <Text style={[type.small, { fontSize: 12 }]}>{name} accepts in the chat, then you confirm.</Text>
            </View>
          )}

          {error ? <ErrorNote message={error} /> : null}
          {step === 'edit' && empty ? <Text style={[type.small, { color: colors.accentPressed, paddingHorizontal: spacing.screen }]}>Add a price or a perk.</Text> : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.screen, paddingVertical: spacing.md, borderTopWidth: 1, borderColor: colors.divider }}>
            {step === 'review' ? (
              <>
                <Button title="Edit" variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => setStep('edit')} />
                <Button title={busy ? 'Sending…' : mode.kind === 'revise' ? 'Send new terms' : 'Send offer'} style={{ flex: 1 }} disabled={busy || empty} onPress={send} />
              </>
            ) : (
              <Button title="Review" style={{ flex: 1 }} disabled={empty} onPress={() => setStep('review')} />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
