import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

const convertDoc = doc => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt
      ? {
          seconds: data.createdAt.seconds,
          nanoseconds: data.createdAt.nanoseconds ?? 0,
        }
      : { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
  };
};

// Subscribe to real-time post feed
export const subscribeToPostFeed = (onPostsUpdate, onError) => {
  const unsubscribe = firestore()
    .collection(COLLECTIONS.POSTS)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(
      snapshot => {
        const posts = snapshot.docs.map(convertDoc);
        onPostsUpdate(posts);
      },
      error => {
        console.warn('Real-time posts error:', error);
        onError?.(error);
      },
    );
  return unsubscribe;
};

// Subscribe to real-time comments
export const subscribeToComments = (postId, onCommentsUpdate, onError) => {
  const unsubscribe = firestore()
    .collection(COLLECTIONS.POSTS)
    .doc(postId)
    .collection(COLLECTIONS.COMMENTS)
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snapshot => {
        const comments = snapshot.docs.map(convertDoc);
        onCommentsUpdate(comments);
      },
      error => {
        console.warn('Real-time comments error:', error);
        onError?.(error);
      },
    );
  return unsubscribe;
};

export const subscribeToPostLikes = (postId, onUpdate) => {
  const unsubscribe = firestore()
    .collection(COLLECTIONS.POSTS)
    .doc(postId)
    .onSnapshot(doc => {
      if (doc.exists) {
        onUpdate(convertDoc(doc));
      }
    });
  return unsubscribe;
};

export const subscribeToNotifications = (userId, onUpdate) => {
  const unsubscribe = firestore()
    .collection(COLLECTIONS.USERS)
    .doc(userId)
    .collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .onSnapshot(snapshot => {
      const notifications = snapshot.docs.map(convertDoc);
      onUpdate(notifications);
    });
  return unsubscribe;
};
