// Pick a price and perks. Used for job posts and offers.
// Perks: tap a suggestion, or type your own ("Free refills all week").
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { perkOptions } from '../data/catalog';
import { MAX_PERK_LENGTH } from '../data/jobs';
import { colors, fonts, radius, spacing, type } from '../theme';
import { Chip } from './Chip';

type Props = {
  price: number;
  perks: string[];
  onChange: (price: number, perks: string[]) => void;
  step?: number;
  hidePrice?: boolean; // perks only (e.g. budget is "open to offers")
};

export function TermsEditor({ price, perks, onChange, step = 5, hidePrice }: Props) {
  const setPrice = (p: number) => onChange(Math.max(0, Math.round(p)), perks);
  const togglePerk = (perk: string) =>
    onChange(price, perks.includes(perk) ? perks.filter((p) => p !== perk) : [...perks, perk]);
  const [custom, setCustom] = useState('');
  const addCustom = () => {
    const perk = custom.trim().slice(0, MAX_PERK_LENGTH);
    if (!perk) return;
    if (!perks.some((p) => p.toLowerCase() === perk.toLowerCase())) onChange(price, [...perks, perk]);
    setCustom('');
  };
  // Your own perks show as selected chips next to the suggestions; tap to remove
  const chips = [...perkOptions, ...perks.filter((p) => !perkOptions.includes(p))];

  return (
    <View style={{ gap: spacing.lg }}>
      {hidePrice ? null : <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <StepButton icon="minus" onPress={() => setPrice(price - step)} label="Lower price" />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface }}>
          <Text style={[type.h2, { color: colors.textSecondary }]}>$</Text>
          <TextInput
            value={String(price)}
            onChangeText={(t) => setPrice(Number(t.replace(/[^0-9]/g, '')) || 0)}
            keyboardType="number-pad"
            accessibilityLabel="Price"
            style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.text, minWidth: 48, textAlign: 'center', outlineStyle: 'none' } as any}
          />
        </View>
        <StepButton icon="plus" onPress={() => setPrice(price + step)} label="Raise price" />
      </View>}

      <View style={{ gap: spacing.sm }}>
        <Text style={type.label}>Perks</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {chips.map((perk) => (
            <Chip key={perk} label={perk} selected={perks.includes(perk)} onPress={() => togglePerk(perk)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={addCustom}
            maxLength={MAX_PERK_LENGTH}
            placeholder="Add your own perk"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Add your own perk"
            returnKeyType="done"
            style={{ flex: 1, height: 44, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 15, color: colors.text }}
          />
          <Pressable onPress={addCustom} disabled={!custom.trim()} accessibilityLabel="Add perk" style={({ pressed }) => ({ height: 44, paddingHorizontal: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.buttonFillPressed : colors.buttonFill, opacity: custom.trim() ? 1 : 0.5 })}>
            <Text style={type.bodyStrong}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function StepButton({ icon, onPress, label }: { icon: 'minus' | 'plus'; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.buttonFillPressed : colors.buttonFill,
      })}
    >
      <Feather name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}
