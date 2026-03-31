import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import { setProfile, clearAuth } from '../../store/slices/authSlice';
import { updateUserProfile, logout } from '../../services/authService';
import { STORAGE_PATHS } from '../../utils/constants';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { profile } = useSelector(state => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
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
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handlePickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response) => {
      if (!response.didCancel && response.assets?.[0]) {
        const asset = response.assets[0];
        setIsUploadingPhoto(true);
        try {
          const ref = storage().ref(
            `${STORAGE_PATHS.PROFILE_PICTURES}/${profile.uid}`,
          );
          await ref.putFile(asset.uri);
          const url = await ref.getDownloadURL();
          await updateUserProfile(profile.uid, { profilePicture: url });
          dispatch(setProfile({ ...profile, profilePicture: url }));
        } catch (e) {
          Alert.alert('Upload failed', e.message);
        }
        setIsUploadingPhoto(false);
      }
    });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
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
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={handlePickPhoto} disabled={isUploadingPhoto}>
          <Avatar
            uri={profile?.profilePicture}
            name={profile?.name}
            size={90}
          />
          <View style={styles.editPhotoOverlay}>
            <Text style={styles.editPhotoText}>
              {isUploadingPhoto ? '⏳' : '📷'}
            </Text>
          </View>
        </TouchableOpacity>

        {!isEditing ? (
          <>
            <Text style={styles.profileName}>{profile?.name}</Text>
            <Text style={styles.profileBio}>
              {profile?.bio || 'No bio yet. Tap Edit to add one.'}
            </Text>
          </>
        ) : null}
      </View>

      {/* Edit Form */}
      {isEditing ? (
        <View style={styles.editForm}>
          <Input
            label="Name"
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
          <View style={styles.editButtons}>
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
      ) : (
        <View style={styles.actions}>
          <Button
            title="Edit Profile"
            variant="outline"
            onPress={() => setIsEditing(true)}
          />
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {profile?.followers?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={[styles.stat, styles.statBorder]}>
          <Text style={styles.statNumber}>
            {profile?.following?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <Button
          title="Logout"
          variant="secondary"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoText: { fontSize: 14 },
  profileName: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  profileBio: {
    fontSize: fonts.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  editForm: { padding: spacing.md },
  editButtons: { flexDirection: 'row', marginTop: spacing.sm },
  actions: { padding: spacing.md },
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
  statLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutContainer: { padding: spacing.md },
});

export default ProfileScreen;