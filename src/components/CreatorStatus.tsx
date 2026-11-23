// Creator status ("Open to work", like LinkedIn) and pitch.
// Others see a green ring and a small banner on the creator's profile picture.
// The creator turns it on or off in Settings (or at sign-up).
import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { backend } from '../data/hooks';
import { pitchTips } from '../data/pitch';
import { Availability, Profile } from '../data/types';
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

// Settings: your status and the pitch used when you message about a job
export function MyCreatorSettings({ me }: { me: Profile }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(me.pitch ?? '');
  const [busy, setBusy] = useState(false);

  const savePitch = async () => {
    setBusy(true);
    try {
      await backend.updateProfile(me, { pitch: draft.trim() });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <Text style={type.label}>Your status</Text>
        <OpenToWorkToggle value={me.availability ?? 'open'} onChange={(v) => backend.updateProfile(me, { availability: v })} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={type.label}>Your pitch</Text>
          {!editing ? (
            <Pressable onPress={() => (setDraft(me.pitch ?? ''), setEditing(true))} hitSlop={8}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.accent }}>{me.pitch ? 'Edit' : 'Write one'}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={[type.small, { fontSize: 12 }]}>Added to your message when you tap Message on a job. You can edit it before sending.</Text>

        {editing ? (
          <View style={{ gap: spacing.sm }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholder="Write a few lines about you and your work"
              placeholderTextColor={colors.textSecondary}
              style={{ minHeight: 110, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text, textAlignVertical: 'top' }}
            />
            <Text style={[type.small, { fontSize: 12 }]}>{pitchTips}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button title="Cancel" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => setEditing(false)} />
              <Button title={busy ? 'Saving…' : 'Save'} size="sm" style={{ flex: 1 }} disabled={busy} onPress={savePitch} />
            </View>
          </View>
        ) : (
          <View style={{ padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface }}>
            <Text style={[type.body, { color: me.pitch ? colors.text : colors.textSecondary }]}>{me.pitch || 'You haven’t written a pitch yet.'}</Text>
            {!me.pitch ? <Text style={[type.small, { fontSize: 12, marginTop: spacing.xs }]}>{pitchTips}</Text> : null}
          </View>
        )}
      </View>
    </View>
  );
}
