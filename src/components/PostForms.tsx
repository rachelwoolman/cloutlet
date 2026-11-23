// The two things people can post:
//  - VideoForm: a creator adds a portfolio video (at sign-up, or Settings > Portfolio)
//  - JobForm: a business posts a job, with up to 10 photos/videos shown as a slideshow
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from './Button';
import { Chip } from './Chip';
import { Photo } from './Photo';
import { ErrorNote } from './States';
import { TermsEditor } from './TermsEditor';
import { VideoPreview } from './VideoPreview';
import { services } from '../data/catalog';
import { backend, useOffers } from '../data/hooks';
import { useMe } from '../data/session';
import { ServiceId } from '../data/types';
import { colors, fonts, radius, spacing, type } from '../theme';

const MAX_MEDIA = 10;

export function VideoForm({ onDone }: { onDone: () => void }) {
  const me = useMe();
  const offers = useOffers(me);
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset>();
  const [caption, setCaption] = useState('');
  const [partnerId, setPartnerId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // You can tag a business only after closing a deal with them on Cloutlet
  const partners = me.role === 'creator'
    ? [...new Map((offers.data ?? []).filter((o) => o.status === 'accepted').map((o) => [o.business.id, o.business])).values()]
    : [];

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (!result.canceled) setVideo(result.assets[0]);
  };

  const submit = async () => {
    if (!video) return;
    setBusy(true);
    setError(null);
    try {
      await backend.createPost(me, { kind: 'video', caption: caption.trim(), localUri: video.uri, mimeType: video.mimeType ?? undefined, collabBusinessId: partnerId });
      setVideo(undefined);
      setCaption('');
      setPartnerId(undefined);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={pick}
        style={{ height: 320, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.divider, backgroundColor: colors.surface, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
      >
        {video ? (
          <VideoPreview uri={video.uri} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <Feather name="video" size={28} color={colors.accent} />
            <Text style={type.bodyStrong}>Pick a video</Text>
            <Text style={type.small}>Vertical works best</Text>
          </View>
        )}
      </Pressable>
      {video ? <Button title="Choose another" variant="ghost" size="sm" onPress={pick} /> : null}

      <Input value={caption} onChangeText={setCaption} placeholder="Caption" multiline />

      {partners.length ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={type.label}>Collab with</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {partners.map((b) => (
              <Chip key={b.id} label={b.name} selected={partnerId === b.id} onPress={() => setPartnerId(partnerId === b.id ? undefined : b.id)} />
            ))}
          </View>
        </View>
      ) : null}

      <Button title={busy ? 'Posting…' : 'Post'} disabled={!video || busy} onPress={submit} />
      {error ? <ErrorNote message={error} /> : null}
    </>
  );
}

export function JobForm({ onDone }: { onDone: () => void }) {
  const me = useMe();
  const [caption, setCaption] = useState('');
  const [serviceId, setServiceId] = useState<ServiceId>('reel');
  const [openBudget, setOpenBudget] = useState(false);
  const [price, setPrice] = useState(50);
  const [perks, setPerks] = useState<string[]>([]);
  const [postBy, setPostBy] = useState('');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Photos and videos of the space, shown as a swipeable slideshow (up to 10)
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_MEDIA - media.length,
      quality: 0.8,
    });
    if (!result.canceled) setMedia((m) => [...m, ...result.assets].slice(0, MAX_MEDIA));
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await backend.createPost(me, {
        kind: 'job',
        caption: caption.trim(),
        job: { serviceId, budget: openBudget ? null : price, perks, postBy: postBy.trim() || undefined },
        media: media.map((a) => ({ localUri: a.uri, mimeType: a.mimeType ?? undefined, type: a.type === 'video' ? 'video' : 'image' })),
      });
      setCaption('');
      setMedia([]);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Input value={caption} onChangeText={setCaption} placeholder="What do you need? (e.g. Cozy morning Reel)" />

      <View style={{ gap: spacing.sm }}>
        <Text style={type.label}>Photos and videos of your space ({media.length}/{MAX_MEDIA})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {media.map((a, i) => (
            <View key={`${a.uri}-${i}`} style={{ width: 72, height: 96, borderRadius: radius.md, overflow: 'hidden' }}>
              {a.type === 'video' ? <VideoPreview uri={a.uri} style={{ width: '100%', height: '100%' }} /> : <Photo uri={a.uri} style={{ width: '100%', height: '100%' }} />}
              <Pressable
                onPress={() => setMedia((m) => m.filter((_, j) => j !== i))}
                hitSlop={6}
                accessibilityLabel="Remove"
                style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,17,17,0.6)' }}
              >
                <Feather name="x" size={13} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {media.length < MAX_MEDIA ? (
            <Pressable
              onPress={pickMedia}
              accessibilityLabel="Add photos or videos"
              style={{ width: 72, height: 96, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <Feather name="plus" size={20} color={colors.accent} />
              <Text style={[type.small, { fontSize: 11 }]}>Add</Text>
            </Pressable>
          ) : null}
        </ScrollView>
        <Text style={[type.small, { fontSize: 12 }]}>Creators swipe through these. Skip it and we’ll use your cover photo.</Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={type.label}>Format</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {services.map((s) => (
            <Chip key={s.id} label={s.name} selected={serviceId === s.id} onPress={() => setServiceId(s.id)} />
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={type.label}>Budget</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Chip label="Set price" selected={!openBudget} onPress={() => setOpenBudget(false)} />
          <Chip label="Open to offers" selected={openBudget} onPress={() => setOpenBudget(true)} />
        </View>
      </View>
      <TermsEditor
        hidePrice={openBudget}
        price={price}
        perks={perks}
        onChange={(p, k) => {
          setPrice(p);
          setPerks(k);
        }}
      />

      <Input value={postBy} onChangeText={setPostBy} placeholder="Post by (e.g. Dec 12)" />

      <Button title={busy ? 'Posting…' : 'Post job'} disabled={!caption.trim() || busy} onPress={submit} />
      {error ? <ErrorNote message={error} /> : null}
    </>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      {...props}
      style={{
        minHeight: props.multiline ? 88 : 52,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: colors.surface,
        fontFamily: fonts.body,
        fontSize: 15,
        color: colors.text,
        textAlignVertical: props.multiline ? 'top' : 'center',
      }}
    />
  );
}
