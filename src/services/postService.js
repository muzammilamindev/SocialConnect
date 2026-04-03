import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { COLLECTIONS, STORAGE_PATHS } from '../utils/constants';

export const createPost = async (
  userId,
  userName,
  userAvatar,
  text,
  imageUri,
) => {
  try {
    let imageUrl = '';

    if (imageUri) {
      try {
        const filename = `post_${Date.now()}_${userId}`;
        const ref = storage().ref(`${STORAGE_PATHS.POST_IMAGES}/${filename}`);

        const uploadTask = await ref.putFile(imageUri);

        if (uploadTask.state === 'success') {
          imageUrl = await ref.getDownloadURL();
        }
      } catch (uploadError) {
        console.warn('Image upload failed:', uploadError);
        imageUrl = '';
      }
    }

    const now = Date.now();

    const postRef = await firestore().collection(COLLECTIONS.POSTS).add({
      userId,
      userName,
      userAvatar,
      text,
      imageUrl,
      likes: [],
      commentsCount: 0,

      createdAt: firestore.FieldValue.serverTimestamp(),
      createdAtClient: now,
    });

    const newPost = {
      id: postRef.id,
      userId,
      userName,
      userAvatar,
      text,
      imageUrl,
      likes: [],
      commentsCount: 0,
      createdAt: {
        seconds: Math.floor(now / 1000),
        nanoseconds: 0,
      },
    };

    return { success: true, post: newPost };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchPosts = async () => {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.POSTS)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const posts = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt
          ? {
              seconds: data.createdAt.seconds,
              nanoseconds: data.createdAt.nanoseconds ?? 0,
            }
          : {
              seconds: Math.floor((data.createdAtClient || Date.now()) / 1000),
              nanoseconds: 0,
            },
      };
    });

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
export const deletePost = async postId => {
  try {
    await firestore().collection(COLLECTIONS.POSTS).doc(postId).delete();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Fetch comments for a post
export const fetchComments = async postId => {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.POSTS)
      .doc(postId)
      .collection(COLLECTIONS.COMMENTS)
      .orderBy('createdAt', 'asc')
      .get();

    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, comments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add a comment
export const addComment = async (
  postId,
  userId,
  userName,
  userAvatar,
  text,
) => {
  try {
    const postRef = firestore().collection(COLLECTIONS.POSTS).doc(postId);

    const commentRef = await postRef.collection(COLLECTIONS.COMMENTS).add({
      userId,
      userName,
      userAvatar,
      text,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    await postRef.update({
      commentsCount: firestore.FieldValue.increment(1),
    });

    const comment = await commentRef.get();
    return { success: true, comment: { id: comment.id, ...comment.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteComment = async (postId, commentId) => {
  try {
    await firestore()
      .collection(COLLECTIONS.POSTS)
      .doc(postId)
      .collection(COLLECTIONS.COMMENTS)
      .doc(commentId)
      .delete();

    await firestore()
      .collection(COLLECTIONS.POSTS)
      .doc(postId)
      .update({
        commentsCount: firestore.FieldValue.increment(-1),
      });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
