import React, { useEffect, useState, useCallback } from 'react';  // ← add useCallback
import {
  View, Text, FlatList, StyleSheet,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { fetchComments, addComment } from '../../services/postService';
import Avatar from '../../components/common/Avatar';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ✅ Wrap in useCallback so it can be safely listed as a dependency
  const loadComments = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchComments(post.id);
    if (result.success) setComments(result.comments);
    setIsLoading(false);
  }, [post.id]); // ← post.id is the only external value used

  useEffect(() => {
    navigation.setOptions({ title: 'Comments' });
    loadComments();
  }, [loadComments, navigation]); // ✅ No more red underline

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setIsSending(true);
    const result = await addComment(
      post.id,
      profile.uid,
      profile.name,
      profile.profilePicture || '',
      commentText.trim(),
    );
    setIsSending(false);
    if (result.success) {
      setComments(prev => [...prev, result.comment]);
      setCommentText('');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const renderComment = ({ item }) => {
    const timeAgo = item.createdAt?.toDate
      ? dayjs(item.createdAt.toDate()).fromNow()
      : 'Just now';
    return (
      <View style={styles.commentRow}>
        <Avatar uri={item.userAvatar} name={item.userName} size={36} />
        <View style={styles.commentBubble}>
          <Text style={styles.commentName}>{item.userName}</Text>
          <Text style={styles.commentText}>{item.text}</Text>
          <Text style={styles.commentTime}>{timeAgo}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>No comments yet. Be first! 💬</Text>
          ) : null
        }
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <Avatar uri={profile?.profilePicture} name={profile?.name} size={36} />
        <TextInput
          style={styles.textInput}
          placeholder="Write a comment..."
          placeholderTextColor={colors.text.light}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !commentText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || isSending}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  commentRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
  },
  commentName: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  commentText: {
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: fonts.sizes.xs,
    color: colors.text.light,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: fonts.sizes.md,
    marginTop: 40,
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
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: colors.border },
  sendText: { color: colors.text.white, fontSize: 18 },
});

export default CommentsScreen;