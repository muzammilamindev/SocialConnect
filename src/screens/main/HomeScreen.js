import React, { useEffect, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, Text,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  setPosts, toggleLike, setPostsLoading,
} from '../../store/slices/postsSlice';
import { fetchPosts, toggleLikePost } from '../../services/postService';
import PostCard from '../../components/post/PostCard';
import Loader from '../../components/common/Loader';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { posts, isLoading } = useSelector(state => state.posts);
  const { profile } = useSelector(state => state.auth);

  const loadPosts = useCallback(async () => {
    dispatch(setPostsLoading(true));
    const result = await fetchPosts();
    if (result.success) {
      dispatch(setPosts(result.posts));
    }
  }, [dispatch]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleLike = async (postId) => {
    if (!profile?.uid) return;
    dispatch(toggleLike({ postId, userId: profile.uid }));
    await toggleLikePost(postId, profile.uid);
  };

  const handleComment = (post) => {
    navigation.navigate('Comments', { post });
  };

  const handleUserPress = (userId) => {
    if (userId === profile?.uid) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('UserProfile', { userId });
    }
  };

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onUserPress={handleUserPress}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🌐</Text>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share something!
      </Text>
    </View>
  );

  if (isLoading && posts.length === 0) {
    return <Loader message="Loading feed..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={posts.length === 0 && styles.emptyList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadPosts}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  feedTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.extraBold,
    color: colors.text.primary,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  createButtonText: {
    color: colors.text.white,
    fontWeight: fonts.weights.semiBold,
    fontSize: fonts.sizes.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyList: { flexGrow: 1 },
  emptyIcon: { fontSize: 64, 
    marginBottom: spacing.md
   },
  emptyTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: fonts.sizes.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});

export default HomeScreen;