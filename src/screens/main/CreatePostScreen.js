import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Image, Alert, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import { addPost, setCreating } from '../../store/slices/postsSlice';
import { createPost } from '../../services/postService';
import Button from '../../components/common/Button';
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
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
      (response) => {
        if (!response.didCancel && response.assets?.[0]) {
          setSelectedImage(response.assets[0]);
        }
      },
    );
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

    if (result.success) {
      dispatch(addPost(result.post));
      navigation.goBack();
    } else {
      dispatch(setCreating(false));
      Alert.alert('Error', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <Button
            title="Post"
            onPress={handleSubmit}
            isLoading={isCreating}
            style={styles.postButton}
          />
        </View>

        {/* User Info */}
        <View style={styles.userRow}>
          <Avatar
            uri={profile?.profilePicture}
            name={profile?.name}
            size={48}
          />
          <Text style={styles.userName}>{profile?.name}</Text>
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
        <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
          <Text style={styles.addImageIcon}>🖼️</Text>
          <Text style={styles.addImageText}>
            {selectedImage ? 'Change Image' : 'Add Image'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    color: colors.text.secondary,
    fontSize: fonts.sizes.md,
  },
  headerTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.text.primary,
  },
  postButton: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  userName: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semiBold,
    color: colors.text.primary,
  },
  textInput: {
    fontSize: fonts.sizes.lg,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
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
  removeImageText: { color: colors.text.white, fontWeight: fonts.weights.bold },
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
  addImageText: { color: colors.text.secondary, fontSize: fonts.sizes.md },
});

export default CreatePostScreen;