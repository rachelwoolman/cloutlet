// One full-screen post in the vertical viewer (like Reels / TikTok).
// Videos: like, message, profile on the right; caption and collab partner bottom-left.
// Job posts: a swipeable slideshow of the business's photos, their Cloutlet rating,
// and a bookmark so creators can save the job for later. What's asked (how many, by when, pay)
// is on the post; the full description opens in a sheet. Creators tap Apply.
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { timeAgo } from '../data/catalog';
import { applicationCountLabel, deadlineLabel, deliverablesLabel, hiresLabel, jobSummary, payLabel } from '../data/jobs';
import { FeedPost, Media, Profile } from '../data/types';
import { colors, fonts, radius, spacing } from '../theme';
import { Avatar } from './Avatar';
import { Photo } from './Photo';
import { Verified } from './Verified';

const CTA_HEIGHT = 54;

type Props = {
  post: FeedPost;
  me: Profile;
  active: boolean; // on screen right now (only this one plays)
  width: number;
  height: number;
  topInset: number;
  bottomInset: number;
  canSave: boolean; // save this post (videos for anyone, job posts for creators)
  saved: boolean;
  onOpenProfile: (id: string) => void;
  onMessage: (otherId: string) => void; // casual message, not an application
  onRequest: (creatorId: string) => void;
  appliedThreadId?: string; // creator already applied to this job post: the chat it's in
  onApply: (postId: string) => void; // opens the Apply screen; nothing is sent until they tap Send there
  onOpenChat: (threadId: string) => void;
  onManage: (postId: string) => void; // business, its own job post
  onLike: (postId: string) => void;
  onToggleSave: (saved: boolean) => void;
  onOpenReviews: (profileId: string) => void;
};

export function Reel({ post, me, active, width, height, topInset, bottomInset, canSave, saved, onOpenProfile, onMessage, onRequest, onLike, onToggleSave, onOpenReviews, appliedThreadId, onApply, onOpenChat, onManage }: Props) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(false); // job post: full description sheet
  const isMine = post.authorId === me.id;
  const isJob = post.kind === 'job';

  // Who's on the other side of a deal from me
  const dealPartnerId = post.author.role !== me.role ? post.authorId : undefined;

  const cta =
    isMine && isJob
      ? { label: 'Manage post', onPress: () => onManage(post.id) }
      : isMine || !dealPartnerId || post.archived // a closed job takes no new applications
        ? null
        : isJob
          ? appliedThreadId
            ? { label: 'Applied · Open chat', onPress: () => onOpenChat(appliedThreadId) }
            : { label: 'Apply', onPress: () => onApply(post.id) }
          : me.role === 'business'
            ? { label: 'Request collab', onPress: () => onRequest(post.authorId) }
            : null;

  const countLabel = isJob ? applicationCountLabel(post.applicationCount, isMine) : null;

  const above = (cta ? CTA_HEIGHT + bottomInset : bottomInset) + spacing.lg; // room for the bottom bar

  const like = () => {
    if (liked) return;
    setLiked(true);
    onLike(post.id);
  };

  const slides: Media[] | null = isJob && post.media?.length ? post.media : null;

  return (
    <View style={{ height, backgroundColor: colors.reelBackground, overflow: 'hidden' }}>
      {/* Media */}
      {slides ? (
        <Slideshow media={slides} active={active} width={width} height={height} topInset={topInset} />
      ) : post.videoUrl ? (
        <ReelVideo uri={post.videoUrl} active={active} />
      ) : (
        <Photo uri={post.image} style={StyleSheet.absoluteFill} />
      )}
      {isJob && !slides ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.reelScrim }]} /> : null}

      {/* Bottom shade so white text reads on any photo */}
      <View pointerEvents="none" style={[styles.shade, { height: height * 0.5 }]}>
        {[0.03, 0.08, 0.16, 0.26, 0.38, 0.5].map((o) => (
          <View key={o} style={{ flex: 1, backgroundColor: `rgba(0,0,0,${o})` }} />
        ))}
      </View>

      {/* Right rail */}
      <View style={[styles.rail, { bottom: above + spacing.sm }]}>
        {isJob ? (
          <>
            <RatingBadge business={post.author} onPress={() => onOpenReviews(post.authorId)} />
            {canSave ? <SaveButton saved={saved} onPress={() => onToggleSave(!saved)} /> : null}
          </>
        ) : (
          <>
            <RailButton icon={liked ? 'heart' : 'heart-outline'} color={liked ? colors.accent : colors.reelText} label={String(post.likes + (liked ? 1 : 0))} onPress={like} />
            {dealPartnerId && !isMine ? <RailButton icon="chatbubble-outline" label="Message" onPress={() => onMessage(dealPartnerId)} /> : null}
            {canSave ? <SaveButton saved={saved} onPress={() => onToggleSave(!saved)} /> : null}
          </>
        )}
        <Pressable onPress={() => onOpenProfile(post.authorId)} accessibilityLabel={`Open ${post.author.name}`}>
          <View style={[styles.railAvatar, { borderRadius: post.author.role === 'business' ? radius.md : radius.pill }]}>
            <Avatar uri={post.author.avatar} initials={post.author.initials} size={40} shape={post.author.role === 'business' ? 'square' : 'circle'} />
          </View>
        </Pressable>
      </View>

      {/* Bottom-left: job details or caption, then who */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: spacing.screen, right: 84, bottom: above, gap: spacing.sm }}>
        {isJob && post.job ? (
          <View style={{ gap: 6 }}>
            <View style={styles.hiring}>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: '#FFFFFF' }}>Hiring</Text>
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 28, lineHeight: 33, color: colors.reelText }}>{post.caption}</Text>
            <Text style={styles.jobLine}>{jobSummary(post.job)}</Text>
            <Text style={[styles.jobLine, { fontFamily: fonts.bodySemiBold }]}>
              {budgetLabel(post.job)}
              {hiresLabel(post.job) ? <Text style={{ fontFamily: fonts.body }}> · {hiresLabel(post.job)}</Text> : null}
            </Text>
            {countLabel ? <Text style={[styles.meta, { color: colors.reelText }]}>{countLabel}</Text> : null}
            {/* Two lines of the description. "More" opens the whole post in a sheet, so reading it
                never gets mixed up with swiping photos (sideways) or the next post (up). */}
            {post.job.description ? (
              <Pressable onPress={() => setDetails(true)} accessibilityRole="button" accessibilityLabel="Read the full job description" hitSlop={6}>
                <Text style={styles.caption} numberOfLines={2}>
                  {post.job.description}
                </Text>
                <Text style={[styles.caption, { fontFamily: fonts.bodySemiBold, marginTop: 2 }]}>More</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Pressable onPress={() => onOpenProfile(post.authorId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.name} numberOfLines={1}>
            {post.author.name}
          </Text>
          <Verified profile={post.author} size={16} onDark />
          <Text style={styles.meta}>· {timeAgo(post.createdAt)}</Text>
        </Pressable>

        {!isJob ? (
          <Pressable onPress={() => setExpanded((e) => !e)}>
            <Text style={styles.caption} numberOfLines={expanded ? undefined : 2}>
              {post.caption}
            </Text>
          </Pressable>
        ) : null}

        {/* Booked on Cloutlet: name the partner, like "Paid partnership with" */}
        <CollabLine post={post} onOpenProfile={onOpenProfile} />
      </View>

      {/* Full-width bar at the very bottom */}
      {cta ? (
        <Pressable
          onPress={cta.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cta, { height: CTA_HEIGHT + bottomInset, paddingBottom: bottomInset, backgroundColor: pressed ? 'rgba(207, 78, 9, 0.95)' : 'rgba(234, 90, 12, 0.82)' }]}
        >
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.onAccent }}>{cta.label}</Text>
        </Pressable>
      ) : null}

      {isJob && post.job ? (
        <JobDetailsSheet
          visible={details}
          post={post}
          countLabel={countLabel}
          bottomInset={bottomInset}
          cta={cta}
          onClose={() => setDetails(false)}
        />
      ) : null}
    </View>
  );
}

const budgetLabel = payLabel; // always "per creator"

// Everything about a job post, readable at your own pace. Slides up over the post; swipe or tap
// outside to close. The same button as the post (Apply, Manage) is at the bottom.
function JobDetailsSheet({ visible, post, countLabel, bottomInset, cta, onClose }: { visible: boolean; post: FeedPost; countLabel: string | null; bottomInset: number; cta: { label: string; onPress: () => void } | null; onClose: () => void }) {
  const job = post.job!;
  const rows: [string, string][] = [
    ['What', deliverablesLabel(job.serviceId, job.quantity)],
    ['Pay', budgetLabel(job)],
    ...(deadlineLabel(job) ? [['Deadline', deadlineLabel(job)!] as [string, string]] : []),
    ...(job.timeframe ? [['Takes about', job.timeframe] as [string, string]] : []),
    ...(job.hires ? [['Hiring', `${job.hires} ${job.hires === 1 ? 'creator' : 'creators'}`] as [string, string]] : []),
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} accessibilityLabel="Close details" />
      <View style={{ maxHeight: '80%', backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: bottomInset }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.screen, paddingBottom: spacing.sm, gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.text }}>{post.caption}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary }}>{post.author.name}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.lg }}>
          <View style={{ gap: spacing.sm }}>
            {rows.map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', gap: spacing.md }}>
                <Text style={{ width: 92, fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary }}>{k}</Text>
                <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text }}>{v}</Text>
              </View>
            ))}
            {countLabel ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary }}>{countLabel}</Text> : null}
          </View>
          {job.description ? <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text }}>{job.description}</Text> : null}
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary }}>Terms for each creator are worked out in chat.</Text>
        </ScrollView>
        {cta ? (
          <View style={{ paddingHorizontal: spacing.screen, paddingVertical: spacing.md, borderTopWidth: 1, borderColor: colors.divider }}>
            <Pressable
              onPress={() => {
                onClose();
                cta.onPress();
              }}
              accessibilityRole="button"
              style={({ pressed }) => ({ height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.accentPressed : colors.accent })}
            >
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.onAccent }}>{cta.label}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function CollabLine({ post, onOpenProfile }: { post: FeedPost; onOpenProfile: (id: string) => void }) {
  const partner = post.author.role === 'creator' ? post.collabBusiness : post.collabCreator;
  if (!partner) return null;
  return (
    <Pressable onPress={() => onOpenProfile(partner.id)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
      <Text style={styles.collabText}>Collab with</Text>
      <Avatar uri={partner.avatar} initials={partner.initials} size={18} shape={partner.role === 'business' ? 'square' : 'circle'} />
      <Text style={[styles.collabText, { fontFamily: fonts.bodySemiBold, color: colors.reelText }]} numberOfLines={1}>
        {partner.name}
      </Text>
    </Pressable>
  );
}

// The business's Cloutlet rating (from creators they've worked with), not Google's
function RatingBadge({ business, onPress }: { business: Profile; onPress: () => void }) {
  const r = business.rating;
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ alignItems: 'center', gap: 2 }} accessibilityLabel={r ? `Rated ${r.average.toFixed(1)} from ${r.count} reviews on Cloutlet. Open reviews` : 'No ratings yet'}>
      <Ionicons name="star" size={28} color={r ? colors.accent : colors.reelTextSecondary} />
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.reelText }}>{r ? r.average.toFixed(1) : 'New'}</Text>
      {r ? <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.reelTextSecondary }}>{r.count} {r.count === 1 ? 'review' : 'reviews'}</Text> : null}
    </Pressable>
  );
}

// Up to 10 photos/videos, swiped sideways (or tap the left/right side), like a TikTok photo post
function Slideshow({ media, active, width, height, topInset }: { media: Media[]; active: boolean; width: number; height: number; topInset: number }) {
  const scroller = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);
  const go = (i: number) => {
    const to = Math.max(0, Math.min(media.length - 1, i));
    scroller.current?.scrollTo({ x: to * width, animated: true });
    setIndex(to);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={StyleSheet.absoluteFill}
      >
        {media.map((m, i) => (
          <View key={`${m.uri}-${i}`} style={{ width, height }}>
            {m.type === 'video' ? <ReelVideo uri={m.uri} active={active && i === index} /> : <Photo uri={m.uri} style={StyleSheet.absoluteFill} />}
          </View>
        ))}
      </ScrollView>

      {/* Tap the left or right side to move (photos only; tapping a video pauses it) */}
      {media[index]?.type !== 'video' && media.length > 1 ? (
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', top: topInset + 56, bottom: height * 0.45 }]}>
          <Pressable style={{ flex: 1 }} onPress={() => go(index - 1)} accessibilityLabel="Previous photo" />
          <Pressable style={{ flex: 1 }} onPress={() => go(index + 1)} accessibilityLabel="Next photo" />
        </View>
      ) : null}

      {media.length > 1 ? (
        <View pointerEvents="none" style={[styles.dots, { top: topInset + spacing.lg }]}>
          {media.map((m, i) => (
            <View key={`${m.uri}-dot-${i}`} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ReelVideo({ uri, active }: { uri: string; active: boolean }) {
  const [paused, setPaused] = useState(false);
  const [wasActive, setWasActive] = useState(active);
  // Scrolling away and back always resumes
  if (active !== wasActive) {
    setWasActive(active);
    if (!active) setPaused(false);
  }
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    if (active && !paused) player.play();
    else player.pause();
  }, [active, paused, player]);

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused((p) => !p)} accessibilityLabel={paused ? 'Play' : 'Pause'}>
      <VideoView player={player} nativeControls={false} contentFit="cover" style={StyleSheet.absoluteFill} pointerEvents="none" />
      {paused ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          <Ionicons name="play" size={64} color="rgba(255,255,255,0.85)" />
        </View>
      ) : null}
    </Pressable>
  );
}

function SaveButton({ saved, onPress }: { saved: boolean; onPress: () => void }) {
  return <RailButton icon={saved ? 'bookmark' : 'bookmark-outline'} color={saved ? colors.accent : colors.reelText} label={saved ? 'Saved' : 'Save'} onPress={onPress} />;
}

function RailButton({ icon, label, onPress, color = colors.reelText }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ alignItems: 'center', gap: 2 }} accessibilityLabel={label}>
      <Ionicons name={icon} size={30} color={color} />
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.reelText }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  rail: { position: 'absolute', right: spacing.md, alignItems: 'center', gap: spacing.xl },
  railAvatar: { borderWidth: 2, borderColor: colors.reelText, overflow: 'hidden' },
  name: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.reelText, flexShrink: 1 },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.reelTextSecondary },
  caption: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.reelText },
  collabText: { fontFamily: fonts.body, fontSize: 13, color: colors.reelTextSecondary },
  hiring: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(234, 90, 12, 0.72)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill }, // see-through orange
  jobLine: { fontFamily: fonts.body, fontSize: 15, color: colors.reelText },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotOn: { width: 18, backgroundColor: '#FFFFFF' },
});
