import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import { addPost, setCreating } from '../../store/slices/postsSlice';
import { createPost } from '../../services/postService';
import Avatar from '../../components/common/Avatar';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { spacing } from '../../theme/spacing';

const CreatePostScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { profile } = useSelector(state => state.auth);
  const { isCreating } = useSelector(state => state.posts);

  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (!response.didCancel && response.assets?.[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const handleSubmit = async () => {
    if (!text.trim() && !selectedImage) {
      Alert.alert('Empty Post', 'Write something or select an image.');
      return;
    }

    dispatch(setCreating(true));

    const result = await createPost(
      profile.uid,
      profile.name,
      profile.profilePicture || '',
      text.trim(),
      selectedImage?.uri || null,
    );

    // ✅ Always reset creating state first
    dispatch(setCreating(false));

    if (result.success) {
      // ✅ Add to Redux immediately so feed updates right away
      dispatch(addPost(result.post));
      // ✅ Navigate back AFTER dispatch
      navigation.goBack();
    } else {
      Alert.alert('Error', result.error || 'Failed to create post');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* User Info Row */}
        <View style={styles.userRow}>
          <Avatar
            uri={profile?.profilePicture}
            name={profile?.name}
            size={46}
          />
          <View style={styles.userText}>
            <Text style={styles.userName}>{profile?.name}</Text>
            <Text style={styles.userSubtext}>Posting publicly</Text>
          </View>
        </View>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.text.light}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          autoFocus
        />

        {/* Character Count */}
        <Text style={styles.charCount}>{text.length}/500</Text>

        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.imagePreview}
            />
            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Image Button */}
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={handlePickImage}
          disabled={isCreating}
        >
          <Text style={styles.addImageIcon}>🖼️</Text>
          <Text style={styles.addImageText}>
            {selectedImage ? 'Change Image' : 'Add Image'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ Bottom Post Button — always visible */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={isCreating}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.postBtn,
            !text.trim() && !selectedImage && styles.postBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isCreating || (!text.trim() && !selectedImage)}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator color={colors.text.white} size="small" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  userSubtext: {
    fontSize: fonts.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  textInput: {
    fontSize: fonts.sizes.lg,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    textAlign: 'right',
    paddingHorizontal: spacing.md,
    color: colors.text.light,
    fontSize: fonts.sizes.xs,
    marginBottom: spacing.md,
  },
  imagePreviewContainer: {
    margin: spacing.md,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.text.white,
    fontWeight: fonts.weights.bold,
    fontSize: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  addImageIcon: { fontSize: 22 },
  addImageText: {
    color: colors.text.secondary,
    fontSize: fonts.sizes.md,
  },

  // ── Bottom action bar ────────────────────────────────────────
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    color: colors.text.secondary,
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.medium,
  },
  postBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  postBtnText: {
    color: colors.text.white,
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold,
  },
});

export default CreatePostScreen;
