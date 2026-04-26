import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

export const updatePost = async (postId, newText) => {
  try {
    await firestore().collection('posts').doc(postId).update({
      text: newText,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Creates a new post in Firestore.
 *
 * @param {string}      userId     - Author's UID
 * @param {string}      userName   - Author's display name
 * @param {string}      userAvatar - Author's avatar URL (base64 or remote)
 * @param {string}      text       - Post body text
 * @param {string|null} imageUrl   - Cloudinary URL from CreatePostScreen,
 *                                   or null for text-only posts.
 */
export const createPost = async (
  userId,
  userName,
  userAvatar,
  text,
  imageUrl,
) => {
  try {
    const now = Date.now();

    const postRef = await firestore()
      .collection(COLLECTIONS.POSTS)
      .add({
        userId,
        userName,
        userAvatar,
        text,
        imageUrl: imageUrl || '',
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
      imageUrl: imageUrl || '',
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

        likes: data.likes || [],
        commentsCount: data.commentsCount ?? 0,
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

    try {
      await postRef.update({
        commentsCount: firestore.FieldValue.increment(1),
      });
    } catch (countError) {
      console.warn('[addComment] commentsCount update failed:', countError.message);
    }

    const comment = await commentRef.get();
    return { success: true, comment: { id: comment.id, ...comment.data() } };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete a comment
export const deleteComment = async (postId, commentId) => {
  try {
    await firestore()
      .collection(COLLECTIONS.POSTS)
      .doc(postId)
      .collection(COLLECTIONS.COMMENTS)
      .doc(commentId)
      .delete();
    try {
      await firestore()
        .collection(COLLECTIONS.POSTS)
        .doc(postId)
        .update({
          commentsCount: firestore.FieldValue.increment(-1),
        });
    } catch (countError) {
      console.warn('[deleteComment] commentsCount update failed:', countError.message);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const migrateCommentsCount = async () => {
  try {
    const snapshot = await firestore().collection(COLLECTIONS.POSTS).get();

    // Firestore batch limit is 500 writes
    const BATCH_SIZE = 400;
    let batch = firestore().batch();
    let opCount = 0;
    let totalMigrated = 0;

    for (const doc of snapshot.docs) {
      if (doc.data().commentsCount === undefined) {
        batch.update(doc.ref, { commentsCount: 0 });
        opCount++;
        totalMigrated++;

        if (opCount === BATCH_SIZE) {
          await batch.commit();
          batch = firestore().batch();
          opCount = 0;
        }
      }
    }

    if (opCount > 0) await batch.commit();

    console.log(`[migrateCommentsCount] Patched ${totalMigrated} posts.`);
    return { success: true, migrated: totalMigrated };
  } catch (error) {
    console.error('[migrateCommentsCount] Failed:', error.message);
    return { success: false, error: error.message };
  }
};