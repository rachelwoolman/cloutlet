// Creator status ("Open to work", like LinkedIn) and pitch.
// Others see a green ring and a small banner on the creator's profile picture.
// The creator turns it on or off in Settings (or at sign-up).
import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { backend } from '../data/hooks';
import { offeredServices, priceFor, services } from '../data/catalog';
import { pitchTips } from '../data/pitch';
import { Availability, Profile, ServiceId } from '../data/types';
import { colors, fonts, radius, spacing, type } from '../theme';
import { Avatar } from './Avatar';
import { Button } from './Button';

export const isOpenToWork = (p: Pick<Profile, 'role' | 'availability'>) => p.role === 'creator' && (p.availability ?? 'open') === 'open';

// Profile picture with the LinkedIn-style "Open to work" ring and banner
export function ProfileAvatar({ profile, size }: { profile: Profile; size: number }) {
  const shape = profile.role === 'business' ? 'square' : 'circle';
  if (!isOpenToWork(profile)) return <Avatar uri={profile.avatar} initials={profile.initials} size={size} shape={shape} />;
  const ring = 3;
  return (
    <View style={{ alignItems: 'center' }} accessibilityLabel={`${profile.name}, open to work`}>
      <View style={{ padding: 2, borderRadius: (size + ring * 2 + 4) / 2, borderWidth: ring, borderColor: colors.open }}>
        <Avatar uri={profile.avatar} initials={profile.initials} size={size} shape={shape} />
      </View>
      <View style={{ position: 'absolute', bottom: -5, left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
        <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: colors.open, borderWidth: 2, borderColor: colors.background }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemiBold, fontSize: 8, letterSpacing: 0.4, color: '#FFFFFF' }}>
            OPEN TO WORK
          </Text>
        </View>
      </View>
    </View>
  );
}

// The app's on/off switch, in the accent color
export function Toggle({ value, onChange, label, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      accessibilityLabel={label}
      trackColor={{ false: colors.divider, true: colors.accent }}
      thumbColor="#FFFFFF"
      {...({ activeThumbColor: '#FFFFFF' } as object)}
    />
  );
}

// A settings row with a title, a short note and a switch
export function ToggleRow({ title, note, value, onChange, disabled }: { title: string; note: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface }}>
      <View style={{ flex: 1 }}>
        <Text style={type.bodyStrong}>{title}</Text>
        <Text style={[type.small, { fontSize: 12 }]}>{note}</Text>
      </View>
      <Toggle value={value} onChange={onChange} label={title} disabled={disabled} />
    </View>
  );
}

export function OpenToWorkToggle({ value, onChange }: { value: Availability; onChange: (v: Availability) => void }) {
  const on = value === 'open';
  return <ToggleRow title="Open to work" note={on ? 'Businesses see you first' : 'Your posts still show in the feed'} value={on} onChange={(v) => onChange(v ? 'open' : 'closed')} />;
}

// Settings (creators): status, the services you offer, and your pitch
export function MyCreatorSettings({ me }: { me: Profile }) {
  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <Text style={type.label}>Your status</Text>
        <OpenToWorkToggle value={me.availability ?? 'open'} onChange={(v) => backend.updateProfile(me, { availability: v })} />
      </View>
      <ServicesEditor me={me} />
      <MessageEditor
        me={me}
        title="Your pitch"
        note="Added to your message when you tap Message on a job. You can edit it before sending."
        tip={pitchTips}
        placeholder="Write a few lines about you and your work"
        empty="You haven’t written a pitch yet."
      />
    </View>
  );
}

// Settings (businesses): the default message used when you request a collab
export function MyBusinessSettings({ me }: { me: Profile }) {
  return (
    <MessageEditor
      me={me}
      title="Default message"
      note="Filled in when you tap Request collab on a creator. You can edit it before sending."
      tip="Tip: say what your spot is like and what kind of video you’re looking for."
      placeholder="Write the message you’d send a creator you’d like to work with"
      empty="You haven’t written a default message yet."
    />
  );
}

// Which formats you take on. Businesses only see these on your profile and in offers.
function ServicesEditor({ me }: { me: Profile }) {
  const on = new Set(offeredServices(me).map((s) => s.id));
  const set = (id: ServiceId, v: boolean) => {
    const next = services.map((s) => s.id).filter((x) => (x === id ? v : on.has(x)));
    if (next.length) backend.updateProfile(me, { services: next });
  };
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={type.label}>Services you offer</Text>
      <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface }}>
        {services.map((s, i) => {
          const rate = me.followers != null ? priceFor(s.id, me.followers) : null;
          const isOn = on.has(s.id);
          return (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderColor: colors.divider }}>
              <View style={{ flex: 1 }}>
                <Text style={type.bodyStrong}>{s.name}</Text>
                <Text style={[type.small, { fontSize: 12 }]}>{rate != null ? `Your rate: $${rate}` : s.description}</Text>
              </View>
              {/* Keep at least one on */}
              <Toggle value={isOn} onChange={(v) => set(s.id, v)} label={s.name} disabled={isOn && on.size === 1} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// A message you write once and reuse (creator pitch, business default message)
function MessageEditor({ me, title, note, tip, placeholder, empty }: { me: Profile; title: string; note: string; tip: string; placeholder: string; empty: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(me.pitch ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await backend.updateProfile(me, { pitch: draft.trim() });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={type.label}>{title}</Text>
        {!editing ? (
          <Pressable onPress={() => (setDraft(me.pitch ?? ''), setEditing(true))} hitSlop={8}>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent }}>{me.pitch ? 'Edit' : 'Write one'}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[type.small, { fontSize: 12 }]}>{note}</Text>

      {editing ? (
        <View style={{ gap: spacing.sm }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={{ minHeight: 110, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text, textAlignVertical: 'top' }}
          />
          <Text style={[type.small, { fontSize: 12 }]}>{tip}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title="Cancel" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => setEditing(false)} />
            <Button title={busy ? 'Saving…' : 'Save'} size="sm" style={{ flex: 1 }} disabled={busy} onPress={save} />
          </View>
        </View>
      ) : (
        <View style={{ padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface }}>
          <Text style={[type.body, { color: me.pitch ? colors.text : colors.textSecondary }]}>{me.pitch || empty}</Text>
          {!me.pitch ? <Text style={[type.small, { fontSize: 12, marginTop: spacing.xs }]}>{tip}</Text> : null}
        </View>
      )}
    </View>
  );
}
