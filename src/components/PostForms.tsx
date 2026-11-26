// The two things people can post:
//  - VideoForm: a creator adds a portfolio video (at sign-up, or Settings > Portfolio)
//  - JobForm: a business posts or edits a job, with up to 10 photos/videos shown as a slideshow
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
import { DateField, Stepper } from './FormFields';
import { services } from '../data/catalog';
import { backend, useOffers } from '../data/hooks';
import { deliverablesLabel, JobField, MAX_DESCRIPTION, MAX_HIRES, MAX_QUANTITY, timeframeOptions, validateJob } from '../data/jobs';
import { useMe } from '../data/session';
import { FeedPost, Job, Media, ServiceId } from '../data/types';
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

// Create a job post, or edit one (pass `post`).
// Order: title, pay, what to deliver, details, deadline, photos. Timeframe and how many creators
// are under "More options". Problems show under the field they belong to.
// Pay is per creator: every creator hired gets it (it's never split between them).
export function JobForm({ post, onDone }: { post?: FeedPost; onDone: () => void }) {
  const me = useMe();
  const start = post?.job;
  const [caption, setCaption] = useState(post?.caption ?? '');
  const [description, setDescription] = useState(start?.description ?? '');
  const [serviceId, setServiceId] = useState<ServiceId>(start?.serviceId ?? 'reel');
  const [quantity, setQuantity] = useState(start?.quantity ?? 1);
  const [openBudget, setOpenBudget] = useState(start ? start.budget === null : false);
  const [price, setPrice] = useState(start?.budget ?? 50);
  const [perks, setPerks] = useState<string[]>(start?.perks ?? []);
  const [deadline, setDeadline] = useState<string | undefined>(start?.deadline);
  const [timeframe, setTimeframe] = useState<string | undefined>(start?.timeframe);
  const [hires, setHires] = useState<number | undefined>(start?.hires);
  const [more, setMore] = useState(Boolean(start?.timeframe || start?.hires));
  const [keepMedia, setKeepMedia] = useState<Media[]>(post?.media ?? []);
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false); // show problems once they've tried to post
  const [saveError, setSaveError] = useState<string | null>(null);
  const mediaCount = keepMedia.length + media.length;

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_MEDIA - mediaCount,
      quality: 0.8,
    });
    if (!result.canceled) setMedia((m) => [...m, ...result.assets].slice(0, MAX_MEDIA - keepMedia.length));
  };

  const job: Job = {
    serviceId,
    quantity,
    description: description.trim(),
    budget: openBudget ? null : price,
    perks,
    deadline,
    timeframe,
    hires,
    // Older posts had a free-text date; it's kept until a real deadline replaces it
    postBy: deadline ? undefined : start?.postBy,
  };
  const problems = validateJob({ caption, job });
  const errorFor = (field: JobField) => (tried ? problems.find((p) => p.field === field)?.message : undefined);

  const submit = async () => {
    setTried(true);
    setSaveError(null);
    if (problems.length) return;
    setBusy(true);
    try {
      const newMedia = media.map((a) => ({ localUri: a.uri, mimeType: a.mimeType ?? undefined, type: a.type === 'video' ? ('video' as const) : ('image' as const) }));
      if (post) await backend.updateJob(me, post.id, { caption: caption.trim(), job, keepMedia, newMedia });
      else await backend.createPost(me, { kind: 'job', caption: caption.trim(), job, media: newMedia });
      onDone();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const thumb = (key: string, uri: string, isVideo: boolean, onRemove: () => void) => (
    <View key={key} style={{ width: 64, height: 84, borderRadius: radius.md, overflow: 'hidden' }}>
      {isVideo ? <VideoPreview uri={uri} style={{ width: '100%', height: '100%' }} /> : <Photo uri={uri} style={{ width: '100%', height: '100%' }} />}
      <Pressable
        onPress={onRemove}
        hitSlop={6}
        accessibilityLabel="Remove"
        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,17,17,0.6)' }}
      >
        <Feather name="x" size={13} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  return (
    <>
      <Field label="Title" required error={errorFor('title')}>
        <Input value={caption} onChangeText={setCaption} placeholder="e.g. 3 Reels of our new menu" maxLength={80} invalid={Boolean(errorFor('title'))} accessibilityLabel="Title" />
      </Field>

      <Field label="Pay per creator" required error={errorFor('pay')}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Chip label="Set price" selected={!openBudget} onPress={() => setOpenBudget(false)} />
          <Chip label="Open to offers" selected={openBudget} onPress={() => setOpenBudget(true)} />
        </View>
        <TermsEditor hidePrice={openBudget} price={price} perks={perks} onChange={(p, k) => (setPrice(p), setPerks(k))} />
        {!openBudget && price > 0 && (hires ?? 1) > 1 ? <Text style={type.small}>Each of the {hires} creators gets ${price}. It isn’t split.</Text> : null}
      </Field>

      <Field label="Each creator makes" required error={errorFor('deliverables')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {services.map((s) => (
            <Chip key={s.id} label={s.name} selected={serviceId === s.id} onPress={() => setServiceId(s.id)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={type.bodyStrong}>{deliverablesLabel(serviceId, quantity)}</Text>
          <Stepper value={quantity} min={1} max={MAX_QUANTITY} onChange={setQuantity} label="deliverables" />
        </View>
      </Field>

      <Field label="Details" required error={errorFor('description')} note={description.length > MAX_DESCRIPTION * 0.8 ? `${description.length}/${MAX_DESCRIPTION}` : undefined}>
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="What to film, when to come by, tags to use"
          multiline
          maxLength={MAX_DESCRIPTION}
          invalid={Boolean(errorFor('description'))}
          accessibilityLabel="Details"
          style={{ minHeight: 110 }}
        />
      </Field>

      <Field label="Deadline" error={errorFor('deadline')} note={!deadline && start?.postBy ? `Was “${start.postBy}”` : undefined}>
        <DateField value={deadline} onChange={setDeadline} />
      </Field>

      <Field label={`Photos (${mediaCount}/${MAX_MEDIA})`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {keepMedia.map((m, i) => thumb(`k-${m.uri}-${i}`, m.uri, m.type === 'video', () => setKeepMedia((k) => k.filter((_, j) => j !== i))))}
          {media.map((a, i) => thumb(`n-${a.uri}-${i}`, a.uri, a.type === 'video', () => setMedia((m) => m.filter((_, j) => j !== i))))}
          {mediaCount < MAX_MEDIA ? (
            <Pressable
              onPress={pickMedia}
              accessibilityLabel="Add photos or videos"
              style={{ width: 64, height: 84, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.divider, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="plus" size={20} color={colors.accent} />
            </Pressable>
          ) : null}
        </ScrollView>
      </Field>

      <Pressable onPress={() => setMore((m) => !m)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Text style={type.bodyStrong}>More options</Text>
        <Feather name={more ? 'chevron-up' : 'chevron-down'} size={16} color={colors.text} />
      </Pressable>
      {more ? (
        <>
          <Field label="How long it takes">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {timeframeOptions.map((t) => (
                <Chip key={t} label={t} selected={timeframe === t} onPress={() => setTimeframe(timeframe === t ? undefined : t)} />
              ))}
            </View>
          </Field>
          <Field label="Creators to hire" error={errorFor('hires')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
              <Chip label="Not decided" selected={hires === undefined} onPress={() => setHires(undefined)} />
              {hires === undefined ? <Chip label="Set a number" onPress={() => setHires(1)} /> : <Stepper value={hires} min={1} max={MAX_HIRES} onChange={setHires} label="creators" />}
            </View>
          </Field>
        </>
      ) : null}

      {tried && problems.length ? (
        <Text style={[type.small, { color: colors.error }]} accessibilityRole="alert">
          {problems.length === 1 ? `Fix 1 thing above to ${post ? 'save' : 'post'}: ${problems[0].message}` : `Fix ${problems.length} things above to ${post ? 'save' : 'post'}.`}
        </Text>
      ) : null}
      {saveError ? <ErrorNote message={saveError} /> : null}
      <Button title={busy ? (post ? 'Saving…' : 'Posting…') : post ? 'Save changes' : 'Post job'} disabled={busy} onPress={submit} />
    </>
  );
}

function Field({ label, note, required, error, children }: { label: string; note?: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm }}>
        <Text style={type.label}>
          {label}
          {required ? <Text style={{ color: colors.accent }}> *</Text> : null}
        </Text>
        {note ? <Text style={[type.small, { fontSize: 12, flexShrink: 1, textAlign: 'right' }]}>{note}</Text> : null}
      </View>
      {children}
      {error ? (
        <Text style={[type.small, { color: colors.error }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function Input({ invalid, ...props }: React.ComponentProps<typeof TextInput> & { invalid?: boolean }) {
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
        borderColor: invalid ? colors.error : colors.divider,
        backgroundColor: colors.surface,
        fontFamily: fonts.body,
        fontSize: 15,
        color: colors.text,
        textAlignVertical: props.multiline ? 'top' : 'center',
        ...(props.style as object),
      }}
    />
  );
}
