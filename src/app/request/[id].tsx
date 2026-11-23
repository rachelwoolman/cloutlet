// Business > send a creator an offer. Only the formats they offer are listed, and the message
// starts from the business's default message (Settings). Opens the chat to keep talking.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Divider, Empty, ErrorNote, Loading, TermsEditor, TopBar } from '../../components';
import { audienceTiers, firstName, formatTerms, offeredServices, priceFor, tierIndexFor } from '../../data/catalog';
import { backend, useProfile } from '../../data/hooks';
import { useMe } from '../../data/session';
import { ServiceId } from '../../data/types';
import { colors, fonts, radius, spacing, type } from '../../theme';

export default function RequestCollab() {
  const me = useMe();
  const { id } = useLocalSearchParams<{ id: string }>();
  const creator = useProfile(id);
  const c = creator.data;

  const offered = c ? offeredServices(c) : [];
  const [picked, setServiceId] = useState<ServiceId>();
  const serviceId: ServiceId = picked && offered.some((s) => s.id === picked) ? picked : (offered[0]?.id ?? 'reel');
  const [customPrice, setCustomPrice] = useState<number | null>(null); // null = use the suggested rate
  const [perks, setPerks] = useState<string[]>([]);
  const [postBy, setPostBy] = useState('');
  const [edited, setMessage] = useState<string>(); // undefined until they type
  const message = edited ?? (c && me.pitch ? `Hi ${firstName(c.name)}! ${me.pitch}` : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const followers = c?.followers ?? 0;
  const suggested = priceFor(serviceId, followers);
  const price = customPrice ?? suggested ?? 0;

  if (me.role !== 'business') return <Empty title="Only businesses send offers" />;
  if (!c) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar icon="close" />
        {creator.loading ? <Loading /> : <Empty title="Creator not found" />}
      </SafeAreaView>
    );
  }

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const offer = await backend.createOffer(me, {
        creatorId: c.id,
        serviceId,
        price,
        perks,
        postBy: postBy.trim() || 'Flexible',
        message: message.trim() || `Hi ${firstName(c.name)}! Want to collab?`,
      });
      router.replace(`/chat/${offer.threadId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const tier = audienceTiers[tierIndexFor(followers)];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <TopBar icon="close" title="New offer" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm }}>
            <Avatar uri={c.avatar} initials={c.initials} size={44} />
            <View>
              <Text style={type.h2}>Collab with {firstName(c.name)}</Text>
              <Text style={type.small}>{c.replyTime ?? c.handle}</Text>
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text style={type.label}>Format</Text>
            <View style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, backgroundColor: colors.surface }}>
              {offered.map((s, i) => {
                const selected = s.id === serviceId;
                const p = priceFor(s.id, followers);
                return (
                  <View key={s.id}>
                    {i > 0 ? <Divider /> : null}
                    <Pressable onPress={() => (setServiceId(s.id), setCustomPrice(null))} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
                      <Radio selected={selected} />
                      <View style={{ flex: 1 }}>
                        <Text style={selected ? type.bodyStrong : type.body}>{s.name}</Text>
                        {selected ? <Text style={[type.small, { fontSize: 12 }]}>{s.description}</Text> : null}
                      </View>
                      <Text style={type.bodyStrong}>{p === null ? 'Ask' : `$${p}`}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text style={type.label}>Your offer</Text>
            <Text style={type.small}>
              Suggested {suggested === null ? 'on request' : `$${suggested}`} for {tier?.label ?? 'their'} followers.
            </Text>
            <TermsEditor price={price} perks={perks} onChange={(p, k) => (setCustomPrice(p), setPerks(k))} />
          </View>

          <Field value={postBy} onChangeText={setPostBy} placeholder="Post by (e.g. Dec 12)" />
          <Field value={message} onChangeText={setMessage} placeholder="Message" multiline />
          {error ? <ErrorNote message={error} /> : null}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.screen, paddingVertical: spacing.md, borderTopWidth: 1, borderColor: colors.divider, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={type.bodyStrong}>Total</Text>
            <Text style={type.h3}>{formatTerms(price, perks)}</Text>
          </View>
          <Text style={[type.small, { fontSize: 12 }]}>They can accept, or message you to talk it over.</Text>
          <Button title={busy ? 'Sending…' : 'Send offer'} onPress={send} disabled={busy || (price === 0 && perks.length === 0)} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      {...props}
      style={{
        minHeight: props.multiline ? 88 : 52,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        fontFamily: fonts.body,
        fontSize: 15,
        color: colors.text,
        textAlignVertical: props.multiline ? 'top' : 'center',
      }}
    />
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: selected ? colors.accent : colors.divider, alignItems: 'center', justifyContent: 'center' }}>
      {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} /> : null}
    </View>
  );
}
