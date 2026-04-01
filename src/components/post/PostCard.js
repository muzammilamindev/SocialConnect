import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { deletePost as deletePostFromStore } from '../../store/slices/postsSlice';
import { deletePost } from '../../services/postService';
import Avatar from '../common/Avatar';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';
import useTimeAgo from '../../hooks/useTimeAgo';

function PostCard({ post, onLike, onComment, onUserPress }) {
  const { profile } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timeAgo = useTimeAgo(post.createdAt);

  const isOwner = post.userId === profile?.uid;

  useEffect(() => {
    if (!isTapping) {
      setIsLiked(post.likes?.includes(profile?.uid) ?? false);
      setLikeCount(post.likes?.length ?? 0);
    }
  }, [post.likes, profile?.uid, isTapping]);

  const handleLike = () => {
    setIsTapping(true);
    const nowLiked = !isLiked;
    setIsLiked(nowLiked);
    setLikeCount(prev => (nowLiked ? prev + 1 : Math.max(0, prev - 1)));
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.4,
        useNativeDriver: true,
        speed: 50,
        bounciness: 10,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
    ]).start();
    onLike(post.id);
    setTimeout(() => setIsTapping(false), 1000);
  };

  const handleDeletePress = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const result = await deletePost(post.id);
            if (result.success) {
              // Remove from Redux store immediately
              dispatch(deletePostFromStore(post.id));
            } else {
              setIsDeleting(false);
              Alert.alert('Error', result.error || 'Failed to delete post');
            }
          },
        },
      ],
    );
  };

  // Don't render if being deleted
  if (isDeleting) return null;

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => onUserPress?.(post.userId)}
          activeOpacity={0.8}
        >
          <Avatar uri={post.userAvatar} name={post.userName} size={44} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>

        {/* 3-dot menu — only shown to post owner */}
        {isOwner && (
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.menuDots}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>

      {post.text ? <Text style={styles.text}>{post.text}</Text> : null}

      {/* Post Image */}
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Text style={styles.heartIcon}>{isLiked ? '❤️' : '🤍'}</Text>
            {likeCount > 0 && (
              <Text style={[styles.actionCount, isLiked && styles.likedCount]}>
                {likeCount}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment?.(post)}
          activeOpacity={0.7}
        >
          <Text style={styles.commentIcon}>💬</Text>
          {post.commentsCount > 0 && (
            <Text style={styles.actionCount}>{post.commentsCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Delete Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        {/* Backdrop — tap outside to close */}
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          {/* Menu Card */}
          <View style={styles.menuCard}>
            {/* Delete Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeletePress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>🗑️</Text>
              <Text style={styles.menuItemText}>Delete Post</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.menuDivider} />

            {/* Cancel */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setMenuVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>✕</Text>
              <Text style={styles.menuItemTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  userName: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  time: {
    fontSize: fonts.sizes.xs,
    color: colors.text.light,
    marginTop: 2,
  },
  menuBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDots: {
    fontSize: 22,
    color: colors.text.secondary,
    fontWeight: fonts.weights.bold,
    lineHeight: 24,
  },

  // Post Content
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
    gap: spacing.lg,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  heartIcon: { fontSize: 24 },
  commentIcon: { fontSize: 24 },
  actionCount: {
    fontSize: fonts.sizes.sm,
    color: colors.text.secondary,
    fontWeight: fonts.weights.semiBold,
  },
  likedCount: { color: colors.like },

  // Delete Menu Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end', // slides up from bottom
    paddingHorizontal: spacing.md,
    paddingBottom: 32,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  menuItemIcon: {
    fontSize: 20,
  },
  menuItemText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
    color: colors.error, // red for destructive action
  },
  menuItemTextCancel: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.medium,
    color: colors.text.secondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});

export default React.memo(PostCard);
