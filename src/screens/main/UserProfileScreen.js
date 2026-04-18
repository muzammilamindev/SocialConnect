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

  // Logged-in user — used to hide action buttons on your own profile
  const currentUser = useSelector(state => state.auth.profile);

  // The profile we're viewing, stored in Redux by loadProfile below
  const { viewingProfile, isLoading } = useSelector(state => state.profile);

  // All follow state + toggle action from our custom hook
  const {
    isFollowing,
    followersCount,
    toggleFollowUser,
    isLoading: isFollowLoading,
  } = useFollow(userId);

  // True when the user is viewing their OWN profile — hide action buttons
  const isOwnProfile = currentUser?.uid === userId;

  const loadProfile = useCallback(async () => {
    dispatch(setProfileLoading(true));
    const result = await fetchUserProfile(userId);
    if (result.success) {
      dispatch(setViewingProfile(result.profile));
      navigation.setOptions({ title: result.profile.name });
    }
  }, [userId, dispatch, navigation]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Handler: navigate to the ChatScreen with the minimum data it needs ────
  const handleMessagePress = () => {
    navigation.navigate('Chat', {
      otherUser: {
        uid: viewingProfile.uid,
        // Your Firestore/Redux profile uses 'name' — map it to displayName
        // so ChatScreen has a consistent field to set the header title with
        displayName: viewingProfile.name,
      },
    });
  };

  // ── Loading state ──────────────────────────────────────────────────────────
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
      {/* ── Profile Header ─────────────────────────────────────────────────── */}
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

        {/* ── Action Buttons Row ─────────────────────────────────────────────
            Only shown when viewing someone else's profile.
            Both Follow and Message sit side-by-side in actionRow.
        ──────────────────────────────────────────────────────────────────── */}
        {!isOwnProfile && (
          <View style={styles.actionRow}>
            {/* Follow / Unfollow — unchanged from before */}
            <Button
              title={isFollowing ? 'Unfollow' : 'Follow'}
              variant={isFollowing ? 'outline' : 'primary'}
              onPress={toggleFollowUser}
              isLoading={isFollowLoading}
              style={styles.actionButton}
            />

            {/* Message — navigates to ChatScreen with this user's info */}
            <Button
              title="Message"
              variant="outline" // outline keeps it visually secondary
              onPress={handleMessagePress}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        {/* followersCount comes from useFollow — updates optimistically */}
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

  // ── New: wraps Follow + Message side by side ──────────────────────────────
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm, // RN 0.71+; replace with marginRight on first button if on older RN
    marginTop: spacing.sm,
  },

  // ── Replaces the old followButton style ───────────────────────────────────
  // Both buttons share the same size so the row looks balanced
  actionButton: {
    width: 130,
    height: 42,
    borderRadius: 22, // Pill shape — matches the previous followButton
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
