import React, { useEffect, useCallback } from 'react'; // ← add useCallback
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  setViewingProfile, setProfileLoading,
} from '../../store/slices/profileSlice';
import { fetchUserProfile } from '../../services/authService';
import Avatar from '../../components/common/Avatar';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const dispatch = useDispatch();
  const { viewingProfile, isLoading } = useSelector(state => state.profile);

  // ✅ Wrap in useCallback — dependencies are userId, dispatch, navigation
  const loadProfile = useCallback(async () => {
    dispatch(setProfileLoading(true));
    const result = await fetchUserProfile(userId);
    if (result.success) {
      dispatch(setViewingProfile(result.profile));
      navigation.setOptions({ title: result.profile.name });
    }
  }, [userId, dispatch, navigation]); // ← all values used inside are listed

  useEffect(() => {
    loadProfile();
  }, [loadProfile]); // ✅ No more red underline

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!viewingProfile) return null;

  return (
    <ScrollView style={styles.container}>
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
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {viewingProfile.followers?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={[styles.stat, styles.statBorder]}>
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
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statNumber: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
  },
  statLabel: { fontSize: fonts.sizes.sm, color: colors.text.secondary },
});

export default UserProfileScreen;