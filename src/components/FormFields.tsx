// Small form pieces used by the job and offer forms.
//  - Stepper: a number with − and + (how many Reels, how many creators)
//  - DateField: pick a day from a small calendar. Built in plain components so it works the
//    same on iPhone, Android and web without a native date picker.
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatDay, parseDay, toDay } from '../data/jobs';
import { colors, fonts, radius, spacing, type } from '../theme';

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <RoundButton icon="minus" disabled={value <= min} onPress={() => onChange(Math.max(min, value - 1))} label={`Fewer ${label}`} />
      <Text style={[type.h2, { minWidth: 32, textAlign: 'center' }]} accessibilityLabel={`${value} ${label}`}>
        {value}
      </Text>
      <RoundButton icon="plus" disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))} label={`More ${label}`} />
    </View>
  );
}

function RoundButton({ icon, onPress, label, disabled }: { icon: 'minus' | 'plus' | 'chevron-left' | 'chevron-right'; onPress: () => void; label: string; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.buttonFillPressed : colors.buttonFill, opacity: disabled ? 0.4 : 1 })}
    >
      <Feather name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// value: "2026-12-12" or undefined (no deadline). Days before today can't be picked.
export function DateField({ value, onChange, placeholder = 'No deadline' }: { value?: string; onChange: (day: string | undefined) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = value ? parseDay(value) : today;
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1));

  const firstWeekday = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const canGoBack = month > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel={value ? `Deadline ${formatDay(value)}. Change` : 'Pick a deadline'}
          style={{ flex: 1, height: 52, paddingHorizontal: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: open ? colors.accent : colors.divider, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
        >
          <Feather name="calendar" size={16} color={colors.textSecondary} />
          <Text style={{ fontFamily: fonts.body, fontSize: 15, color: value ? colors.text : colors.textSecondary }}>{value ? formatDay(value) : placeholder}</Text>
        </Pressable>
        {value ? (
          <Pressable onPress={() => (onChange(undefined), setOpen(false))} hitSlop={8} accessibilityLabel="Clear deadline">
            <Text style={[type.small, { textDecorationLine: 'underline' }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {open ? (
        <View style={{ padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <RoundButton icon="chevron-left" label="Previous month" disabled={!canGoBack} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
            <Text style={type.bodyStrong}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            <RoundButton icon="chevron-right" label="Next month" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={[type.small, { flex: 1, textAlign: 'center', fontSize: 12 }]}>
                {d}
              </Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 40 }} />;
              const day = toDay(d);
              const past = d < today;
              const selected = day === value;
              return (
                <Pressable
                  key={day}
                  disabled={past}
                  onPress={() => (onChange(day), setOpen(false))}
                  accessibilityLabel={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  accessibilityState={{ selected, disabled: past }}
                  style={{ width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' }}
                >
                  <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.accent : 'transparent' }}>
                    <Text style={{ fontFamily: selected ? fonts.bodySemiBold : fonts.body, fontSize: 14, color: selected ? colors.onAccent : past ? colors.textSecondary : colors.text, opacity: past ? 0.35 : 1 }}>{d.getDate()}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
