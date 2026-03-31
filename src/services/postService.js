import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { COLLECTIONS, STORAGE_PATHS } from '../utils/constants';

// Create a new post
export const createPost = async (userId, userName, userAvatar, text, imageUri) => {
  try {
    let imageUrl = '';

    if (imageUri) {
      const filename = `${Date.now()}_${userId}`;
      const ref = storage().ref(`${STORAGE_PATHS.POST_IMAGES}/${filename}`);
      await ref.putFile(imageUri);
      imageUrl = await ref.getDownloadURL();
    }

    const postRef = await firestore().collection(COLLECTIONS.POSTS).add({
      userId,
      userName,
      userAvatar,
      text,
      imageUrl,
      likes: [],
      commentsCount: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    const newPost = await postRef.get();
    return { success: true, post: { id: newPost.id, ...newPost.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Fetch all posts (latest first)
export const fetchPosts = async () => {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.POSTS)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, posts };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Toggle like on a post
export const toggleLikePost = async (postId, userId) => {
  try {
    const postRef = firestore().collection(COLLECTIONS.POSTS).doc(postId);
    const post = await postRef.get();

    if (!post.exists) return { success: false, error: 'Post not found' };

    const likes = post.data().likes || [];
    const isLiked = likes.includes(userId);

    await postRef.update({
      likes: isLiked
        ? firestore.FieldValue.arrayRemove(userId)
        : firestore.FieldValue.arrayUnion(userId),
    });

    return { success: true, liked: !isLiked };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete post
export const deletePost = async (postId) => {
  try {
    await firestore().collection(COLLECTIONS.POSTS).doc(postId).delete();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Fetch comments for a post
export const fetchComments = async (postId) => {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.POSTS)
      .doc(postId)
      .collection(COLLECTIONS.COMMENTS)
      .orderBy('createdAt', 'asc')
      .get();

    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, comments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add a comment
export const addComment = async (postId, userId, userName, userAvatar, text) => {
  try {
    const postRef = firestore().collection(COLLECTIONS.POSTS).doc(postId);

    // Add comment to subcollection
    const commentRef = await postRef.collection(COLLECTIONS.COMMENTS).add({
      userId,
      userName,
      userAvatar,
      text,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Increment commentsCount
    await postRef.update({
      commentsCount: firestore.FieldValue.increment(1),
    });

    const comment = await commentRef.get();
    return { success: true, comment: { id: comment.id, ...comment.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};