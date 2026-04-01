import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { useSelector } from 'react-redux';
import { addComment } from '../../services/postService';
import { subscribeToComments } from '../../services/realtimeService';
import { saveNotificationToFirestore } from '../../services/notificationService';
import Avatar from '../../components/common/Avatar';
import LottieAnimation from '../../components/common/LottieAnimation';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const CommentsScreen = ({ route, navigation }) => {
  const { post } = route.params;
  const { profile } = useSelector(state => state.auth);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: `Comments (${comments.length})` });
  }, [comments.length, navigation]);

  useEffect(() => {
    // Real-time listener for comments
    const unsubscribe = subscribeToComments(
      post.id,
      updatedComments => {
        setComments(updatedComments);
        setIsLoading(false);
      },
      err => {
        console.warn('Comments listener error:', err);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [post.id]);

  const handleSendComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setCommentText(''); // Clear immediately for better UX

    const result = await addComment(
      post.id,
      profile.uid,
      profile.name,
      profile.profilePicture || '',
      trimmed,
    );

    setIsSending(false);

    if (result.success) {
      // Send notification to post author
      if (post.userId !== profile.uid) {
        await saveNotificationToFirestore(post.userId, {
          type: 'comment',
          fromUserId: profile.uid,
          fromUserName: profile.name,
          postId: post.id,
          message: `${profile.name} commented on your post`,
        });
      }
    } else {
      Alert.alert('Error', result.error);
      setCommentText(trimmed); // Restore on error
    }
  }, [commentText, isSending, post, profile]);

  const renderComment = useCallback(
    ({ item }) => {
      const timeAgo = item.createdAt?.toDate
        ? dayjs(item.createdAt.toDate()).fromNow()
        : 'Just now';

      const isOwn = item.userId === profile?.uid;

      return (
        <View style={[styles.commentRow, isOwn && styles.ownCommentRow]}>
          {!isOwn && (
            <Avatar uri={item.userAvatar} name={item.userName} size={36} />
          )}
          <View style={[styles.commentBubble, isOwn && styles.ownBubble]}>
            {!isOwn && <Text style={styles.commentName}>{item.userName}</Text>}
            <Text style={[styles.commentText, isOwn && styles.ownText]}>
              {item.text}
            </Text>
            <Text style={[styles.commentTime, isOwn && styles.ownTime]}>
              {timeAgo}
            </Text>
          </View>
          {isOwn && (
            <Avatar uri={item.userAvatar} name={item.userName} size={36} />
          )}
        </View>
      );
    },
    [profile?.uid],
  );

  const keyExtractor = useCallback(item => item.id, []);

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <LottieAnimation
          source={require('../../assets/animations/empty-feed.json')}
          width={160}
          height={160}
          loop
          autoPlay
        />
        <Text style={styles.emptyText}>
          No comments yet. Start the conversation! 💬
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={comments}
        keyExtractor={keyExtractor}
        renderItem={renderComment}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.list,
          comments.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        // Auto-scroll to new comments
        ref={ref => {
          if (ref && comments.length > 0) {
            ref.scrollToEnd?.({ animated: true });
          }
        }}
      />

      {/*Comment Input*/}
      <View style={styles.inputRow}>
        <Avatar uri={profile?.profilePicture} name={profile?.name} size={36} />
        <TextInput
          style={styles.textInput}
          placeholder="Write a comment..."
          placeholderTextColor={colors.text.light}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={300}
          returnKeyType="send"
          onSubmitEditing={handleSendComment}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || isSending}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: fonts.sizes.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  ownCommentRow: {
    flexDirection: 'row-reverse',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  commentName: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semiBold,
    color: colors.primary,
    marginBottom: 2,
  },
  commentText: {
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
    lineHeight: 20,
  },
  ownText: {
    color: colors.text.white,
  },
  commentTime: {
    fontSize: fonts.sizes.xs,
    color: colors.text.light,
    marginTop: 4,
    textAlign: 'right',
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: spacing.sm,
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendIcon: {
    color: colors.text.white,
    fontSize: 18,
  },
});

export default CommentsScreen;
