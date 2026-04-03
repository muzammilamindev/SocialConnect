import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

export const signUp = async (email, password, name) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(
      email,
      password,
    );
    const user = userCredential.user;
    await user.updateProfile({ displayName: name });

    const profileData = {
      uid: user.uid,
      name,
      email,
      bio: '',
      profilePicture: '',
      followers: [],
      following: [],
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(user.uid)
      .set(profileData);

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const login = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(
      email,
      password,
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  try {
    await auth().signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const forgotPassword = async (email) => {
  try {
    await auth().sendPasswordResetEmail(email.trim().toLowerCase());
    return { success: true };
  } catch (error) {
    console.warn('Password reset error:', error.code, error.message);
    return { success: false, error: error.message };
  }
};

export const fetchUserProfile = async (uid, retries = 3) => {
  try {
    const doc = await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .get();

    if (doc.exists) {
      const data = doc.data();
      return {
        success: true,
        profile: {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.seconds ?? null,
        },
      };
    }

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchUserProfile(uid, retries - 1);
    }

    return { success: false, error: 'Profile not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (uid, data) => {
  try {
    await firestore().collection(COLLECTIONS.USERS).doc(uid).update(data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};