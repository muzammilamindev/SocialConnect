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
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { deletePost as deletePostFromStore } from '../../store/slices/postsSlice';
import { updatePost as updatePostInStore } from '../../store/slices/postsSlice';
import { deletePost } from '../../services/postService';
import { updatePost } from '../../services/postService';
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

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [isSaving, setIsSaving] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timeAgo = useTimeAgo(post.createdAt);

  const isOwner = post.userId === profile?.uid;

  useEffect(() => {
    if (!isTapping) {
      setIsLiked(post.likes?.includes(profile?.uid) ?? false);
      setLikeCount(post.likes?.length ?? 0);
    }
  }, [post.likes, profile?.uid, isTapping]);

  useEffect(() => {
    if (!isEditing) {
      setEditText(post.text);
    }
  }, [post.text, isEditing]);

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

  const handleEditPress = () => {
    setMenuVisible(false);
    setEditText(post.text);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();

    if (!trimmed) {
      Alert.alert('Empty Post', 'Post content cannot be empty.');
      return;
    }

    if (trimmed === post.text) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const result = await updatePost(post.id, trimmed);

    if (result.success) {
      dispatch(updatePostInStore({ postId: post.id, text: trimmed }));
      setIsEditing(false);
    } else {
      Alert.alert('Error', result.error || 'Failed to update post');
    }

    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setEditText(post.text); // restore original text
    setIsEditing(false);
  };

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
          <Avatar
            uri={isOwner ? profile?.profilePicture : post.userAvatar}
            name={post.userName}
            size={44}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>

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

      {isEditing ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus // keyboard pops up automatically
            editable={!isSaving}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.text.light}
          />

          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.editBtn, styles.cancelBtn]}
              onPress={handleCancelEdit}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.editBtn, styles.saveBtn]}
              onPress={handleSaveEdit}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : post.text ? (
        <Text style={styles.text}>{post.text}</Text>
      ) : null}

      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}

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

      {/* ── Bottom-sheet menu modal ── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEditPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>✏️</Text>
              <Text style={styles.menuItemTextEdit}>Edit Post</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeletePress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>🗑️</Text>
              <Text style={styles.menuItemText}>Delete Post</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

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

  // Header — UNCHANGED
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
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
  menuItemIcon: { fontSize: 20 },
  menuItemText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
    color: colors.error,
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

  menuItemTextEdit: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  editInput: {
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: colors.background,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  editBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  cancelBtnText: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.secondary,
  },
  saveBtnText: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semiBold,
    color: colors.surface,
  },
});

export default React.memo(PostCard);
