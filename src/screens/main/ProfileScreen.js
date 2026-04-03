import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { PermissionsAndroid } from 'react-native';
import { Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import { setProfile, clearAuth } from '../../store/slices/authSlice';
import { updateUserProfile, logout } from '../../services/authService';
import { STORAGE_PATHS } from '../../utils/constants';
import { showGlobalToast } from '../../hooks/useToast';
import { formatCount } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';
import { scaleH } from '../../theme/responsive';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { profile } = useSelector(state => state.auth);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Animated header collapse
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [scaleH(220), scaleH(100)],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.65],
    extrapolate: 'clamp',
  });

  const nameOpacity = scrollY.interpolate({
    inputRange: [80, 120],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      showGlobalToast('Name cannot be empty', 'warning');
      return;
    }
    setIsSaving(true);
    const result = await updateUserProfile(profile.uid, {
      name: name.trim(),
      bio: bio.trim(),
    });
    setIsSaving(false);
    if (result.success) {
      dispatch(setProfile({ ...profile, name: name.trim(), bio: bio.trim() }));
      setIsEditing(false);
      showGlobalToast('Profile updated! ✨', 'success');
    } else {
      showGlobalToast(result.error, 'error');
    }
  }, [name, bio, profile, dispatch]);

  const handlePickPhoto = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        const permission =
          androidVersion >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission, {
          title: 'Photo Access',
          message: 'Social Connect needs access to your photos.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        });

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'Please allow photo access in Settings.',
          );
          return;
        }
      } catch (err) {
        console.warn('Permission error:', err);
      }
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      },
      async response => {
        if (response.didCancel || response.errorCode) return;

        const asset = response.assets?.[0];
        if (!asset?.uri) return;

        setIsUploadingPhoto(true);

        try {
          const uri =
            Platform.OS === 'android'
              ? asset.uri
              : asset.uri.replace('file://', '');

          const filename = `profile_${profile.uid}_${Date.now()}`;
          const storageRef = storage().ref(
            `${STORAGE_PATHS.PROFILE_PICTURES}/${filename}`,
          );

          await storageRef.putFile(uri);

          const url = await storageRef.getDownloadURL();

          await updateUserProfile(profile.uid, { profilePicture: url });

          dispatch(setProfile({ ...profile, profilePicture: url }));

          Alert.alert('Success ✅', 'Profile photo updated!');
        } catch (uploadErr) {
          console.warn('Photo upload error:', uploadErr);
          Alert.alert(
            'Upload Failed',
            `Could not upload photo: ${uploadErr.message}`,
          );
        } finally {
          setIsUploadingPhoto(false);
        }
      },
    );
  }, [profile, dispatch]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          dispatch(clearAuth());
        },
      },
    ]);
  }, [dispatch]);

  return (
    <View style={styles.container}>
      {/* Animated Gradient Header */}
      <Animated.View style={[styles.headerWrapper, { height: headerHeight }]}>
        <LinearGradient
          colors={colors.gradients.primary}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              styles.avatarWrapper,
              { transform: [{ scale: avatarScale }] },
            ]}
          >
            <TouchableOpacity
              onPress={handlePickPhoto}
              disabled={isUploadingPhoto}
            >
              <Avatar
                uri={profile?.profilePicture}
                name={profile?.name}
                size={80}
              />
              <View style={styles.cameraOverlay}>
                <Text style={styles.cameraEmoji}>
                  {isUploadingPhoto ? '⏳' : '📷'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: nameOpacity, alignItems: 'center' }}>
            <Text style={styles.headerName}>{profile?.name}</Text>
            <Text style={styles.headerEmail}>{profile?.email}</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {formatCount(profile?.followers?.length || 0)}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {formatCount(profile?.following?.length || 0)}
            </Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Bio Section */}
        {!isEditing ? (
          <View style={styles.bioCard}>
            <View style={styles.bioHeader}>
              <Text style={styles.bioTitle}>About</Text>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>Edit ✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.bioText}>
              {profile?.bio || 'No bio yet. Tap Edit to add one.'}
            </Text>
          </View>
        ) : (
          <View style={styles.editCard}>
            <Text style={styles.editCardTitle}>Edit Profile</Text>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Input
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself..."
              multiline
            />
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setIsEditing(false);
                  setName(profile?.name || '');
                  setBio(profile?.bio || '');
                }}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Save"
                onPress={handleSave}
                isLoading={isSaving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {/* Account Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile?.email}</Text>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerWrapper: { overflow: 'hidden' },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  avatarWrapper: { position: 'relative' },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.surface,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraEmoji: { fontSize: 14 },
  headerName: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.text.white,
  },
  headerEmail: {
    fontSize: fonts.sizes.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  scroll: { flex: 1 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  statNumber: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  bioCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bioTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  editBtn: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editBtnText: {
    color: colors.primary,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semiBold,
  },
  bioText: {
    fontSize: fonts.sizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  editCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 20,
    padding: spacing.md,
    elevation: 2,
  },
  editCardTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 20,
    padding: spacing.md,
    elevation: 2,
  },
  infoLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.text.light,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontWeight: fonts.weights.semiBold,
  },
  infoValue: {
    fontSize: fonts.sizes.md,
    color: colors.text.primary,
  },
  logoutBtn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.error,
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
  },
});

export default ProfileScreen;
