import React, { useRef } from 'react';
import {
  View, Text, Image, StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue, withSpring, useAnimatedStyle,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import Avatar from '../common/Avatar';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PostCard = ({ post, onLike, onComment, onUserPress }) => {
  const { profile } = useSelector(state => state.auth);
  const isLiked = post.likes?.includes(profile?.uid);

  // Heart animation scale
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLike = () => {
    // Animate heart
    heartScale.value = withSpring(1.4, {}, () => {
      heartScale.value = withSpring(1);
    });
    onLike(post.id);
  };

  const timeAgo = post.createdAt?.toDate
    ? dayjs(post.createdAt.toDate()).fromNow()
    : 'Just now';

  return (
    <View style={styles.card}>
      {/* Post Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => onUserPress && onUserPress(post.userId)}
      >
        <Avatar uri={post.userAvatar} name={post.userName} size={44} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{post.userName}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>

      {/* Post Body */}
      {post.text ? <Text style={styles.text}>{post.text}</Text> : null}

      {/* Post Image */}
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.image} />
      ) : null}

      {/* Post Actions */}
      <View style={styles.actions}>
        <AnimatedTouchable
          style={[styles.actionButton, heartStyle]}
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionIcon, isLiked && styles.liked]}>
            {isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={[styles.actionCount, isLiked && styles.likedText]}>
            {post.likes?.length || 0}
          </Text>
        </AnimatedTouchable>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment && onComment(post)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.commentsCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userInfo: { marginLeft: spacing.sm, flex: 1 },
  userName: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  time: { fontSize: fonts.sizes.xs, color: colors.text.light, marginTop: 2 },
  text: {
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: { fontSize: 20 },
  actionCount: {
    fontSize: fonts.sizes.sm,
    color: colors.text.secondary,
    fontWeight: fonts.weights.medium,
  },
  liked: {},
  likedText: { color: colors.like },
});

export default PostCard;