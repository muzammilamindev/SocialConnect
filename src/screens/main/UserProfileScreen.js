import React, { useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  setViewingProfile,
  setProfileLoading,
} from '../../store/slices/profileSlice';
import { fetchUserProfile } from '../../services/authService';
import useFollow from '../../hooks/useFollow';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.auth.profile);
  const { viewingProfile, isLoading } = useSelector(state => state.profile);

  const {
    isFollowing,
    followersCount,
    toggleFollowUser,
    isLoading: isFollowLoading,
  } = useFollow(userId);

  const isOwnProfile = currentUser?.uid === userId;

  const loadProfile = useCallback(async () => {
    dispatch(setProfileLoading(true));
    const result = await fetchUserProfile(userId);
    if (result.success) {
      dispatch(setViewingProfile(result.profile));
   navigation.setOptions({
  title: result.profile.name,
  headerLeft: () => (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{ paddingHorizontal: spacing.md }}
    >
      <Text style={{ fontSize: 28, color: 'black', lineHeight: 32 }}>
        {'‹ '}
      </Text>
    </TouchableOpacity>
  ),
});
    }
  }, [userId, dispatch, navigation]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleMessagePress = () => {
    navigation.navigate('Chat', {
      otherUser: {
        uid: viewingProfile.uid,
        displayName: viewingProfile.name,
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!viewingProfile) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Avatar
          uri={viewingProfile.profilePicture}
          name={viewingProfile.name}
          size={90}
        />
        <Text style={styles.name}>{viewingProfile.name}</Text>
        <Text style={styles.bio}>
          {viewingProfile.bio || 'No bio available'}
        </Text>
        
        {!isOwnProfile && (
          <View style={styles.actionRow}>
            <Button
              title={isFollowing ? 'Unfollow' : 'Follow'}
              variant={isFollowing ? 'outline' : 'primary'}
              onPress={toggleFollowUser}
              isLoading={isFollowLoading}
              style={styles.actionButton}
            />
            <Button
              title="Message"
              variant="outline"
              onPress={handleMessagePress}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {viewingProfile.following?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.lg,
  },
  name: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  bio: {
    fontSize: fonts.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm, 
    marginTop: spacing.sm,
  },
  actionButton: {
    width: 130,
    height: 42,
    borderRadius: 22,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  statNumber: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default UserProfileScreen;
