import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { useSelector } from 'react-redux';
import { addComment, deleteComment } from '../../services/postService';
import { subscribeToComments } from '../../services/realtimeService';
import { saveNotificationToFirestore } from '../../services/notificationService';
import Avatar from '../../components/common/Avatar';
import LottieAnimation from '../../components/common/LottieAnimation';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';
import useTimeAgo from '../../hooks/useTimeAgo';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

function CommentItem({ item, currentUserId, onLongPress }) {
  const isOwn = item.userId === currentUserId;
  const timeAgo = useTimeAgo(item.createdAt);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => onLongPress(item)}
      delayLongPress={400}
    >
      <View style={[styles.commentRow, isOwn && styles.ownCommentRow]}>
        {!isOwn && (
          <Avatar uri={item.userAvatar} name={item.userName} size={36} />
        )}

        <View style={styles.commentContent}>
          {!isOwn && <Text style={styles.commentAuthor}>{item.userName}</Text>}
          <View style={[styles.bubble, isOwn && styles.ownBubble]}>
            <Text style={[styles.bubbleText, isOwn && styles.ownBubbleText]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.commentTime, isOwn && styles.ownCommentTime]}>
            {timeAgo}
            {isOwn && <Text style={styles.holdHint}> · Hold to delete</Text>}
          </Text>
        </View>

        {isOwn && (
          <Avatar uri={item.userAvatar} name={item.userName} size={36} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function PostPreview({ post }) {
  const timeAgo = useTimeAgo(post.createdAt);
  return (
    <View style={styles.postPreview}>
      <View style={styles.postPreviewHeader}>
        <Avatar uri={post.userAvatar} name={post.userName} size={40} />
        <View style={styles.postPreviewInfo}>
          <Text style={styles.postPreviewName}>{post.userName}</Text>
          <Text style={styles.postPreviewTime}>{timeAgo}</Text>
        </View>
      </View>
      {post.text ? (
        <Text style={styles.postPreviewText}>{post.text}</Text>
      ) : null}
      <View style={styles.postPreviewStats}>
        <Text style={styles.postPreviewStat}>
          ❤️ {post.likes?.length || 0} likes
        </Text>
      </View>
    </View>
  );
}

// Delete Menu Modal
function DeleteMenu({ visible, onDelete, onCancel }) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <Animated.View
          style={[
            styles.deleteMenu,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.menuHandle} />

          <Text style={styles.menuTitle}>Comment Options</Text>

          <TouchableOpacity
            style={styles.deleteOption}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <View style={styles.deleteIconCircle}>
              <Text style={styles.deleteEmoji}>🗑️</Text>
            </View>
            <View>
              <Text style={styles.deleteOptionTitle}>Delete Comment</Text>
              <Text style={styles.deleteOptionSubtitle}>
                This cannot be undone
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelOption}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelOptionText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const CommentsScreen = ({ route, navigation }) => {
  const { post } = route.params;
  const { profile } = useSelector(state => state.auth);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: comments.length > 0 ? `Comments (${comments.length})` : 'Comments',
    });
  }, [comments.length, navigation]);

  // Real-time listener
  useEffect(() => {
    const unsubscribe = subscribeToComments(
      post.id,
      updatedComments => {
        setComments(updatedComments);
        setIsLoading(false);
      },
      err => {
        console.warn('Comments error:', err);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, [post.id]);

  // Send comment
  const handleSend = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setCommentText('');

    const result = await addComment(
      post.id,
      profile.uid,
      profile.name,
      profile.profilePicture || '',
      trimmed,
    );

    setIsSending(false);

    if (result.success) {
      if (post.userId !== profile.uid) {
        await saveNotificationToFirestore(post.userId, {
          type: 'comment',
          fromUserId: profile.uid,
          fromUserName: profile.name,
          postId: post.id,
          message: `${profile.name} commented on your post`,
        });
      }
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } else {
      Alert.alert('Error', result.error);
      setCommentText(trimmed);
    }
  }, [commentText, isSending, post, profile]);

  // Long press → show delete menu
  const handleLongPress = useCallback(
    comment => {
      if (comment.userId !== profile?.uid) return;
      setSelectedComment(comment);
      setMenuVisible(true);
    },
    [profile?.uid],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedComment) return;
    setMenuVisible(false);

    const result = await deleteComment(post.id, selectedComment.id);
    if (result.success) {
      setComments(prev => prev.filter(c => c.id !== selectedComment.id));
    } else {
      Alert.alert('Error', result.error || 'Failed to delete comment');
    }
    setSelectedComment(null);
  }, [selectedComment, post.id]);

  const handleMenuCancel = useCallback(() => {
    setMenuVisible(false);
    setSelectedComment(null);
  }, []);

  const keyExtractor = useCallback(item => item.id, []);

  const renderComment = useCallback(
    ({ item }) => (
      <CommentItem
        item={item}
        currentUserId={profile?.uid}
        onLongPress={handleLongPress}
      />
    ),
    [profile?.uid, handleLongPress],
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <LottieAnimation
          source={require('../../assets/animations/empty-feed.json')}
          width={120}
          height={120}
          loop
          autoPlay
        />
        <Text style={styles.emptyTitle}>No comments yet</Text>
        <Text style={styles.emptySubtitle}>Be first to comment 💬</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
    >
      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={keyExtractor}
        renderItem={renderComment}
        ListHeaderComponent={<PostPreview post={post} />}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.list,
          comments.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Comment Input Bar ── */}
      <View style={styles.inputBar}>
        <Avatar uri={profile?.profilePicture} name={profile?.name} size={36} />
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          placeholderTextColor={colors.text.light}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!commentText.trim() || isSending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!commentText.trim() || isSending}
          activeOpacity={0.8}
        >
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* ── Delete Modal ── */}
      <DeleteMenu
        visible={menuVisible}
        onDelete={handleDeleteConfirm}
        onCancel={handleMenuCancel}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },

  postPreview: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 8,
    borderBottomColor: colors.background,
  },
  postPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  postPreviewInfo: { flex: 1 },
  postPreviewName: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
  },
  postPreviewTime: {
    fontSize: fonts.sizes.xs,
    color: colors.text.light,
    marginTop: 2,
  },
  postPreviewText: {
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  postPreviewStats: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  postPreviewStat: {
    fontSize: fonts.sizes.sm,
    color: colors.text.secondary,
  },

  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  ownCommentRow: {
    flexDirection: 'row-reverse',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.secondary,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleText: {
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
    lineHeight: 20,
  },
  ownBubbleText: {
    color: colors.text.white,
  },
  commentTime: {
    fontSize: fonts.sizes.xs,
    color: colors.text.light,
    marginTop: 4,
    marginLeft: 4,
  },
  ownCommentTime: {
    textAlign: 'right',
    marginRight: 4,
  },
  holdHint: {
    color: colors.text.placeholder,
    fontSize: fonts.sizes.xs,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.text.secondary,
    marginTop: 4,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 8,
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
  },
  sendBtnText: {
    color: colors.text.white,
    fontSize: 16,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  deleteMenu: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 36,
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  menuTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  deleteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteEmoji: { fontSize: 22 },
  deleteOptionTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold,
    color: colors.error,
  },
  deleteOptionSubtitle: {
    fontSize: fonts.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  cancelOption: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelOptionText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.secondary,
  },
});

export default CommentsScreen;
