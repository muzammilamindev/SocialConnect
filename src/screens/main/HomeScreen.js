import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { toggleLike } from '../../store/slices/postsSlice';
import { toggleLikePost } from '../../services/postService';
import { saveNotificationToFirestore } from '../../services/notificationService';
import usePosts from '../../hooks/usePosts';
import PostCard from '../../components/post/PostCard';
import PostSkeleton from '../../components/post/PostSkeleton';
import LottieAnimation from '../../components/common/LottieAnimation';
import NetworkBanner from '../../components/common/NetworkBanner';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const SKELETON_COUNT = 4;

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { profile } = useSelector(state => state.auth);
  const { posts, isLoading } = usePosts();

  const handleLike = useCallback(
    async postId => {
      if (!profile?.uid) return;
      dispatch(toggleLike({ postId, userId: profile.uid }));
      const result = await toggleLikePost(postId, profile.uid);
      if (result.success && result.liked) {
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== profile.uid) {
          await saveNotificationToFirestore(post.userId, {
            type: 'like',
            fromUserId: profile.uid,
            fromUserName: profile.name,
            postId,
            message: `${profile.name} liked your post`,
          });
        }
      }
    },
    [dispatch, posts, profile],
  );

  const handleComment = useCallback(
    post => navigation.navigate('Comments', { post }),
    [navigation],
  );

  const handleUserPress = useCallback(
    userId => {
      if (userId === profile?.uid) {
        navigation.navigate('Profile');
      } else {
        navigation.navigate('UserProfile', { userId });
      }
    },
    [navigation, profile?.uid],
  );

  const renderHeader = () => (
    <View style={[styles.feedHeader, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.feedTitle}>Social Connect</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>+ Post</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeletons = () => (
    <View>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <PostSkeleton key={`skeleton-${i}`} />
      ))}
    </View>
  );

  // Empty feed Lottie
  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <LottieAnimation
          source={require('../../assets/animations/empty-feed.json')}
          width={200}
          height={200}
          loop
          autoPlay
        />
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap "+ Post" to share something with the world!
        </Text>
      </View>
    );
  };

  const renderPost = useCallback(
    ({ item }) => (
      <PostCard
        post={item}
        onLike={handleLike}
        onComment={handleComment}
        onUserPress={handleUserPress}
      />
    ),
    [handleLike, handleComment, handleUserPress],
  );

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <View style={styles.container}>
      <NetworkBanner />
      <FlatList
        data={isLoading && posts.length === 0 ? [] : posts}
        keyExtractor={keyExtractor}
        renderItem={renderPost}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            {isLoading && posts.length === 0 && renderSkeletons()}
          </View>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          !isLoading && posts.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && posts.length > 0}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={10}
        initialNumToRender={6}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
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
    paddingHorizontal: spacing.xl,
    marginTop: -40,
  },
  emptyTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fonts.sizes.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HomeScreen;
