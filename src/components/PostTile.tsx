// One post in the Explore grid: a creator's video, or a business's job post
// shown over a photo of the business.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FeedPost } from '../data/types';
import { colors, fonts, radius, spacing, type } from '../theme';
import { Avatar } from './Avatar';
import { Photo } from './Photo';
import { Verified } from './Verified';
import { deliverablesLabel, payLabel } from '../data/jobs';
import { VideoPreview } from './VideoPreview';

// Uneven heights make the two-column grid feel organic
export function tileHeight(post: FeedPost): number {
  if (post.kind === 'job') return 210;
  let h = 0;
  for (const ch of post.id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return 170 + (h % 80);
}

export function PostTile({ post, onPress }: { post: FeedPost; onPress: () => void }) {
  const height = tileHeight(post);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ gap: 6, opacity: pressed ? 0.8 : 1 })}>
      {post.kind === 'job' ? <JobCover post={post} height={height} /> : <VideoCover post={post} height={height} />}
      {post.kind === 'video' ? (
        <>
          <Text style={[type.bodyStrong, { fontSize: 14, lineHeight: 19 }]} numberOfLines={2}>
            {post.caption}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Avatar uri={post.author.avatar} initials={post.author.initials} size={18} />
            <Text style={[type.small, { fontSize: 12, flexShrink: 1 }]} numberOfLines={1}>
              {post.author.name}
            </Text>
            <Verified profile={post.author} size={13} />
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

function VideoCover({ post, height }: { post: FeedPost; height: number }) {
  const partner = post.collabBusiness ?? post.collabCreator;
  return (
    <View style={{ height, borderRadius: radius.md, overflow: 'hidden' }}>
      {post.image ? (
        <Photo uri={post.image} style={{ width: '100%', height: '100%' }} />
      ) : post.videoUrl ? (
        <VideoPreview uri={post.videoUrl} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Photo style={{ width: '100%', height: '100%' }} />
      )}
      {partner ? (
        <View style={[pill, styles.partner, { top: spacing.sm }]}>
          <Ionicons name="location" size={11} color="#FFFFFF" />
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: '#FFFFFF', flexShrink: 1 }} numberOfLines={1}>
            {partner.name}
          </Text>
        </View>
      ) : null}
      {post.duration ? (
        <View style={[pill, { bottom: spacing.sm, backgroundColor: colors.overlay }]}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: '#FFFFFF' }}>▶ {post.duration}</Text>
        </View>
      ) : null}
    </View>
  );
}

function JobCover({ post, height }: { post: FeedPost; height: number }) {
  const job = post.job!;
  return (
    <View style={{ height, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.text }}>
      <Photo uri={post.image} style={{ position: 'absolute', width: '100%', height: '100%' }} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.reelScrim }]} />
      <View style={[pill, styles.hiring, { top: spacing.sm }]}>
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: '#FFFFFF' }}>Hiring</Text>
      </View>
      <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, gap: 2 }}>
        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.reelText }} numberOfLines={2}>
          {post.caption}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.reelTextSecondary }} numberOfLines={1}>
          {deliverablesLabel(job.serviceId, job.quantity ?? 1)}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.reelText }} numberOfLines={1}>
          {payLabel(job)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.reelText }} numberOfLines={1}>
            {post.author.name}
          </Text>
          <Verified profile={post.author} size={13} onDark />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Dark see-through pill with white text: readable on any photo
  partner: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(17, 17, 17, 0.55)' },
  // See-through orange so job posts stand out
  hiring: { backgroundColor: 'rgba(234, 90, 12, 0.72)' },
});

const pill: ViewStyle = {
  position: 'absolute',
  left: spacing.sm,
  maxWidth: '85%',
  paddingHorizontal: spacing.sm,
  paddingVertical: 3,
  borderRadius: radius.pill,
};
