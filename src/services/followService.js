import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

/**
 * @param {string} currentUserId - The logged-in user performing the action
 * @param {string} targetUserId  - The user being followed/unfollowed
 * @param {boolean} isCurrentlyFollowing - Pass current follow state so we know which op to run
 * @returns {{ success: boolean, isNowFollowing: boolean, error?: string }}
 */
export const toggleFollow = async (
  currentUserId,
  targetUserId,
  isCurrentlyFollowing,
) => {
  try {
    const currentUserRef = firestore()
      .collection(COLLECTIONS.USERS)
      .doc(currentUserId);

    const targetUserRef = firestore()
      .collection(COLLECTIONS.USERS)
      .doc(targetUserId);

    const batch = firestore().batch();

    if (isCurrentlyFollowing) {
      batch.update(targetUserRef, {
        followers: firestore.FieldValue.arrayRemove(currentUserId),
      });
      batch.update(currentUserRef, {
        following: firestore.FieldValue.arrayRemove(targetUserId),
      });
    } else {
      batch.update(targetUserRef, {
        followers: firestore.FieldValue.arrayUnion(currentUserId),
      });
      batch.update(currentUserRef, {
        following: firestore.FieldValue.arrayUnion(targetUserId),
      });
    }

    await batch.commit();

    return { success: true, isNowFollowing: !isCurrentlyFollowing };
  } catch (error) {
    console.warn('[followService] toggleFollow error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {{ success: boolean, isFollowing: boolean }}
 */
export const checkIsFollowing = async (currentUserId, targetUserId) => {
  try {
    const doc = await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(targetUserId)
      .get();

    if (!doc.exists) {
      return { success: false, isFollowing: false };
    }

    const followers = doc.data().followers || [];
    return { success: true, isFollowing: followers.includes(currentUserId) };
  } catch (error) {
    console.warn('[followService] checkIsFollowing error:', error.message);
    return { success: false, isFollowing: false };
  }
};
