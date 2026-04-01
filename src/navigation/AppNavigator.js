import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth';
import { setUser, setProfile, clearAuth, setLoading } from '../store/slices/authSlice';
import { fetchUserProfile } from '../services/authService';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import Loader from '../components/common/Loader';
import useNotifications from '../hooks/useNotifications';

// Inner component so it has access to Redux (store is provided by App.jsx)
const AppContent = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  // Initializes notifications when user is logged in
  useNotifications();

  useEffect(() => {
    dispatch(setLoading(true));

    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
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

    return () => unsubscribe();
  }, [dispatch]);

  if (isLoading) {
    return <Loader message="Starting up..." />;
  }

  return user ? <MainNavigator /> : <AuthNavigator />;
};

const AppNavigator = () => (
  <NavigationContainer>
    <AppContent />
  </NavigationContainer>
);

export default AppNavigator;