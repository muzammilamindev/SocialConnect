import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

// Subscribe to real-time post feed
export const subscribeToPostFeed = (onPostsUpdate, onError) => {
  const unsubscribe = firestore()
    .collection(COLLECTIONS.POSTS)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(
      snapshot => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        onPostsUpdate(posts);
      },
      error => {
        console.warn('Real-time posts error:', error);
        onError && onError(error);
      },
    );

  return unsubscribe;
};

// Subscribe to real-time comments for a post
export const subscribeToComments = (postId, onCommentsUpdate, onError) => {
  const unsubscribe = firestore()
    .collection(COLLECTIONS.POSTS)
    .doc(postId)
    .collection(COLLECTIONS.COMMENTS)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snapshot => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        onCommentsUpdate(comments);
      },
      error => {
        console.warn('Real-time comments error:', error);
        onError && onError(error);
      },
    );

  return unsubscribe;
};

// Subscribe to like count changes on a single post
export const subscribeToPostLikes = (postId, onUpdate) => {
  const unsubscribe = firestore()
    .collection(COLLECTIONS.POSTS)
    .doc(postId)
    .onSnapshot(doc => {
      if (doc.exists) {
        onUpdate({ id: doc.id, ...doc.data() });
      }
    });

  return unsubscribe;
};

// Subscribe to user notifications
export const subscribeToNotifications = (userId, onUpdate) => {
  const unsubscribe = firestore()
    .collection(COLLECTIONS.USERS)
    .doc(userId)
    .collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .onSnapshot(snapshot => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      onUpdate(notifications);
    });

  return unsubscribe;
};
