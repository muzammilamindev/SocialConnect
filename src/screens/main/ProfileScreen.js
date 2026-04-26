import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import { setProfile, clearAuth } from '../../store/slices/authSlice';
import {
  updateUserProfile,
  logout,
  fetchUserProfile,
} from '../../services/authService';
import { showGlobalToast } from '../../hooks/useToast';
import { formatCount } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const PRIMARY = '#5B50D6';
const BG = '#F5F5F5';
const SURFACE = '#FFFFFF';
const TEXT_PRIMARY = '#1A1A2E';
const TEXT_SECONDARY = '#6B7280';
const BORDER = '#E5E7EB';
const { width: SCREEN_W } = Dimensions.get('window');
const POST_SIZE = Math.floor((SCREEN_W - 4) / 3);

const ProfileScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { profile: loggedInProfile } = useSelector(state => state.auth);

  const targetUserId = route?.params?.userId;
  const isOwnProfile = !targetUserId || targetUserId === loggedInProfile?.uid;

  const [viewedProfile, setViewedProfile] = useState(
    isOwnProfile ? loggedInProfile : null,
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(!isOwnProfile);

  const profile = isOwnProfile ? loggedInProfile : viewedProfile;

  const effectiveUserId = isOwnProfile ? loggedInProfile?.uid : targetUserId;

  const userPosts = useSelector(state =>
    (state.posts.posts || []).filter(p => p.userId === effectiveUserId),
  );

  useEffect(() => {
    if (isOwnProfile) return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingProfile(true);
      const result = await fetchUserProfile(targetUserId);
      if (cancelled) return;
      if (result.success) {
        setViewedProfile(result.profile);
      } else {
        showGlobalToast('Could not load profile', 'error');
      }
      setIsLoadingProfile(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [targetUserId, isOwnProfile]);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(loggedInProfile?.name || '');
  const [bio, setBio] = useState(loggedInProfile?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [pendingPhotoBase64, setPendingPhotoBase64] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');

  const openPhotoSheet = useCallback(() => setPhotoSheetVisible(true), []);
  const closePhotoSheet = useCallback(() => setPhotoSheetVisible(false), []);

  const handleChoosePhoto = useCallback(() => {
    closePhotoSheet();
    setTimeout(() => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.3,
          maxWidth: 300,
          maxHeight: 300,
          includeBase64: true,
        },
        response => {
          if (response.didCancel || response.errorCode) return;
          const asset = response.assets?.[0];
          if (!asset?.base64) {
            showGlobalToast('Could not read image. Try another.', 'error');
            return;
          }
          const dataUri = `data:${asset.type || 'image/jpeg'};base64,${
            asset.base64
          }`;
          if (dataUri.length > 700_000) {
            showGlobalToast(
              'Image too large. Please pick a smaller one.',
              'warning',
            );
            return;
          }
          setPendingPhotoBase64(dataUri);
          if (!isEditing) setIsEditing(true);
        },
      );
    }, 300);
  }, [isEditing, closePhotoSheet]);

  const handleDeletePhoto = useCallback(() => {
    closePhotoSheet();
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPendingPhotoBase64('__DELETED__');
            if (!isEditing) setIsEditing(true);
          },
        },
      ],
    );
  }, [isEditing, closePhotoSheet]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      showGlobalToast('Name cannot be empty', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      const finalPhotoURL =
        pendingPhotoBase64 === '__DELETED__'
          ? null
          : pendingPhotoBase64 || (loggedInProfile.profilePicture ?? null);

      const result = await updateUserProfile(loggedInProfile.uid, {
        name: name.trim(),
        bio: bio.trim(),
        profilePicture: finalPhotoURL,
      });

      if (!result.success) {
        showGlobalToast(result.error || 'Failed to save profile', 'error');
        return;
      }

      try {
        await auth().currentUser?.updateProfile({ displayName: name.trim() });
      } catch (e) {
        console.warn('[ProfileScreen] Auth sync skipped:', e.message);
      }

      dispatch(
        setProfile({
          ...loggedInProfile,
          name: name.trim(),
          bio: bio.trim(),
          profilePicture: finalPhotoURL,
        }),
      );
      setPendingPhotoBase64(null);
      setIsEditing(false);
      showGlobalToast(
        pendingPhotoBase64 === '__DELETED__'
          ? 'Profile picture removed.'
          : 'Profile updated! ✨',
        'success',
      );
    } catch (err) {
      showGlobalToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [name, bio, pendingPhotoBase64, loggedInProfile, dispatch]);

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

  const displayPhotoUri =
    pendingPhotoBase64 === '__DELETED__'
      ? null
      : pendingPhotoBase64 || profile?.profilePicture;

  const hasPhoto =
    pendingPhotoBase64 !== '__DELETED__' &&
    (pendingPhotoBase64 || profile?.profilePicture);

  if (isLoadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }
  return (
    <View style={styles.root}>
      {isOwnProfile && (
        <Modal
          visible={photoSheetVisible}
          transparent
          animationType="slide"
          onRequestClose={closePhotoSheet}
        >
          <Pressable style={styles.sheetBackdrop} onPress={closePhotoSheet}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetAvatarRow}>
                <Avatar uri={displayPhotoUri} name={profile?.name} size={64} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>{profile?.name}</Text>
                  <Text style={styles.sheetSub}>Profile photo</Text>
                </View>
              </View>

              <View style={styles.sheetDivider} />

              <TouchableOpacity
                style={styles.sheetOption}
                onPress={handleChoosePhoto}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.sheetIconWrap,
                    { backgroundColor: PRIMARY + '18' },
                  ]}
                >
                  <Text style={styles.sheetEmoji}>🖼️</Text>
                </View>
                <Text style={styles.sheetOptionLabel}>Choose photo</Text>
              </TouchableOpacity>

              {hasPhoto && (
                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={handleDeletePhoto}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.sheetIconWrap,
                      { backgroundColor: '#FEE2E2' },
                    ]}
                  >
                    <Text style={styles.sheetEmoji}>🗑️</Text>
                  </View>
                  <Text style={[styles.sheetOptionLabel, { color: '#EF4444' }]}>
                    Delete photo
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.sheetOption, { marginTop: 4 }]}
                onPress={closePhotoSheet}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetIconWrap, { backgroundColor: BG }]}>
                  <Text style={styles.sheetEmoji}>✕</Text>
                </View>
                <Text
                  style={[styles.sheetOptionLabel, { color: TEXT_SECONDARY }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Edit Profile modal (own profile only) */}
      {isOwnProfile && (
        <Modal
          visible={isEditing}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setIsEditing(false);
            setPendingPhotoBase64(null);
            setName(loggedInProfile?.name || '');
            setBio(loggedInProfile?.bio || '');
          }}
        >
          <View style={styles.editModalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setPendingPhotoBase64(null);
                    setName(loggedInProfile?.name || '');
                    setBio(loggedInProfile?.bio || '');
                  }}
                >
                  <Text style={styles.editModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.editAvatarRow}>
                <TouchableOpacity
                  onPress={openPhotoSheet}
                  activeOpacity={0.8}
                  style={styles.editAvatarWrap}
                >
                  <Avatar
                    uri={displayPhotoUri}
                    name={loggedInProfile?.name}
                    size={72}
                  />
                  <View style={styles.editAvatarBadge}>
                    <Text style={{ fontSize: 12 }}>✏️</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {pendingPhotoBase64 === '__DELETED__' && (
                <View style={[styles.photoBanner, styles.photoBannerDanger]}>
                  <Text style={[styles.photoBannerText, { color: '#EF4444' }]}>
                    🗑️ Photo will be removed — tap Save to confirm
                  </Text>
                </View>
              )}
              {pendingPhotoBase64 && pendingPhotoBase64 !== '__DELETED__' && (
                <View style={styles.photoBanner}>
                  <Text style={styles.photoBannerText}>
                    📸 New photo selected — tap Save to apply
                  </Text>
                </View>
              )}

              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isSaving}
              />
              <Input
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell people about yourself..."
                multiline
                editable={!isSaving}
              />

              <View style={styles.editActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setIsEditing(false);
                    setPendingPhotoBase64(null);
                    setName(loggedInProfile?.name || '');
                    setBio(loggedInProfile?.bio || '');
                  }}
                  style={styles.editCancelBtn}
                  disabled={isSaving}
                />
                <Button
                  title="Save"
                  onPress={handleSave}
                  isLoading={isSaving}
                  style={styles.editSaveBtn}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          {!isOwnProfile ? (
            <TouchableOpacity
              onPress={() => navigation?.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}

          <Text style={styles.topBarTitle}>
            {isOwnProfile
              ? 'Profile'
              : profile?.username || profile?.name || 'Profile'}
          </Text>

          {isOwnProfile ? (
            <TouchableOpacity
              onPress={handleLogout}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ width: 28, alignItems: 'center' }}
            >
              <Text style={styles.menuDots}>⋮</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>

        {/* Profile header card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              onPress={isOwnProfile ? openPhotoSheet : undefined}
              activeOpacity={isOwnProfile ? 0.85 : 1}
              style={styles.avatarWrap}
            >
              <Avatar uri={displayPhotoUri} name={profile?.name} size={80} />
              {isOwnProfile && pendingPhotoBase64 && (
                <View style={styles.pendingBadge}>
                  <Text style={{ fontSize: 10 }}>
                    {pendingPhotoBase64 === '__DELETED__' ? '🚫' : '✅'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>
                  {formatCount(userPosts.length)}
                </Text>
                <Text style={styles.statLbl}>Posts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>
                  {formatCount(profile?.followers?.length || 0)}
                </Text>
                <Text style={styles.statLbl}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>
                  {formatCount(profile?.following?.length || 0)}
                </Text>
                <Text style={styles.statLbl}>Following</Text>
              </View>
            </View>
          </View>

          <View style={styles.metaBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>
                {profile?.name || 'Unknown User'}
              </Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedCheck}>✓</Text>
              </View>
            </View>
            <Text style={styles.handle}>
              @
              {profile?.username || profile?.email?.split('@')[0] || 'username'}
            </Text>
            {profile?.bio ? (
              <Text style={styles.bioText}>{profile.bio}</Text>
            ) : (
              <Text
                style={[
                  styles.bioText,
                  { color: TEXT_SECONDARY, fontStyle: 'italic' },
                ]}
              >
                {isOwnProfile
                  ? 'No bio yet. Tap Edit Profile to add one.'
                  : 'No bio.'}
              </Text>
            )}
          </View>

          {isOwnProfile ? (
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.followRow}>
              <TouchableOpacity style={styles.followBtn} activeOpacity={0.85}>
                <Text style={styles.followBtnText}>Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.messageBtn} activeOpacity={0.85}>
                <Text style={styles.messageBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'posts' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('posts')}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'posts' && styles.tabIconActive,
              ]}
            >
              ⊞
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'saved' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('saved')}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'saved' && styles.tabIconActive,
              ]}
            >
              🔖
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'tagged' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('tagged')}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'tagged' && styles.tabIconActive,
              ]}
            >
              🏷️
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'posts' &&
          (userPosts.length > 0 ? (
            <View style={styles.postsGrid}>
              {userPosts.map((item, index) => {
                const imageUri =
                  item.imageUrl || item.media || item.image || item.uri || null;
                return (
                  <TouchableOpacity
                    key={item.id || index}
                    activeOpacity={0.85}
                    style={styles.postCell}
                  >
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.textPostCell}>
                        <Text style={styles.textPostPreview} numberOfLines={4}>
                          {item.text || item.caption || ''}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyTitle}>No Posts Yet</Text>
              <Text style={styles.emptySubtitle}>
                {isOwnProfile
                  ? 'Share your first moment!'
                  : 'No posts here yet.'}
              </Text>
            </View>
          ))}

        {activeTab === 'saved' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>No Saved Posts</Text>
            <Text style={styles.emptySubtitle}>
              Posts you save will appear here.
            </Text>
          </View>
        )}

        {activeTab === 'tagged' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyTitle}>No Tagged Posts</Text>
            <Text style={styles.emptySubtitle}>
              Posts you're tagged in will appear here.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  scroll: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    marginTop: 5,
    backgroundColor: SURFACE,
  },
  topBarTitle: {
    paddingTop: 10,
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  menuDots: {
    fontSize: 24,
    color: TEXT_PRIMARY,
    lineHeight: 28,
  },
  backArrow: {
    fontSize: 22,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: SURFACE,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 20,
  },
  pendingBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: SURFACE,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // stats
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: BORDER,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
  },
  statLbl: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
    fontWeight: '500',
  },

  // name / handle / bio
  metaBlock: {
    marginBottom: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '800',
  },
  handle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    lineHeight: 20,
  },

  // Edit Profile button
  editProfileBtn: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: SURFACE,
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    letterSpacing: 0.1,
  },
  followRow: {
    flexDirection: 'row',
    gap: 10,
  },
  followBtn: {
    flex: 1,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
  },
  messageBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: SURFACE,
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    letterSpacing: 0.1,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: PRIMARY,
  },
  tabIcon: {
    fontSize: 20,
    color: TEXT_SECONDARY,
  },
  tabIconActive: {
    color: PRIMARY,
  },

  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    backgroundColor: BG,
  },
  postCell: {
    width: POST_SIZE,
    height: POST_SIZE,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  textPostCell: {
    width: '100%',
    height: '100%',
    backgroundColor: PRIMARY + '12',
    padding: 8,
    justifyContent: 'center',
  },
  textPostPreview: {
    fontSize: 11,
    color: TEXT_PRIMARY,
    lineHeight: 15,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: SURFACE,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sheetName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  sheetSub: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 10,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  sheetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetEmoji: { fontSize: 20 },
  sheetOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },

  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  editModal: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    maxHeight: '90%',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  editModalClose: {
    fontSize: 18,
    color: TEXT_SECONDARY,
    paddingHorizontal: 4,
  },
  editAvatarRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  editAvatarWrap: {
    position: 'relative',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: SURFACE,
  },
  photoBanner: {
    backgroundColor: PRIMARY + '18',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
  },
  photoBannerDanger: {
    backgroundColor: '#FEE2E2',
    borderLeftColor: '#EF4444',
  },
  photoBannerText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '500',
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  editCancelBtn: {
    flex: 1,
  },
  editSaveBtn: {
    flex: 1,
  },
});

export default ProfileScreen;
