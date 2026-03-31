import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

// Sign Up
export const signUp = async (email, password, name) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Update Firebase Auth display name
    await user.updateProfile({ displayName: name });

    // Create Firestore user document
    await firestore().collection(COLLECTIONS.USERS).doc(user.uid).set({
      uid: user.uid,
      name,
      email,
      bio: '',
      profilePicture: '',
      followers: [],
      following: [],
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Login
export const login = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Logout
export const logout = async () => {
  try {
    await auth().signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Forgot Password
export const forgotPassword = async (email) => {
  try {
    await auth().sendPasswordResetEmail(email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Fetch user profile from Firestore
export const fetchUserProfile = async (uid) => {
  try {
    const doc = await firestore().collection(COLLECTIONS.USERS).doc(uid).get();
    if (doc.exists) {
      return { success: true, profile: { id: doc.id, ...doc.data() } };
    }
    return { success: false, error: 'Profile not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (uid, data) => {
  try {
    await firestore().collection(COLLECTIONS.USERS).doc(uid).update(data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};