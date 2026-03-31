import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth';
import { setUser, setProfile, clearAuth } from '../store/slices/authSlice';
import { fetchUserProfile } from '../services/authService';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import Loader from '../components/common/Loader';

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector(state => state.auth);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch Firestore profile
        const profileResult = await fetchUserProfile(firebaseUser.uid);
        if (profileResult.success) {
          dispatch(setProfile(profileResult.profile));
        }
        dispatch(setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        }));
      } else {
        dispatch(clearAuth());
      }
    });
    return () => unsubscribe();  // Cleanup on unmount
  }, [dispatch]);

  if (isLoading) return <Loader />;

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;