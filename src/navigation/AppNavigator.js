import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth';
import {
  setUser,
  setProfile,
  clearAuth,
  setLoading,
} from '../store/slices/authSlice';
import { fetchUserProfile } from '../services/authService';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/SplashScreen';
import Loader from '../components/common/Loader';
import Toast from '../components/common/Toast';
import NetworkBanner from '../components/common/NetworkBanner';
import useNotifications from '../hooks/useNotifications';
import useToast from '../hooks/useToast';

const AppContent = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector(state => state.auth);
  const { toast, hideToast } = useToast();
  const [showSplash, setShowSplash] = useState(true);

  useNotifications();

  useEffect(() => {
    dispatch(setLoading(true));

    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        // ✅ Set user first so app doesn't hang
        dispatch(
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          }),
        );

        const profileResult = await fetchUserProfile(firebaseUser.uid);

        if (profileResult.success) {
          dispatch(setProfile(profileResult.profile));
        } else {
          dispatch(
            setProfile({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              bio: '',
              profilePicture: firebaseUser.photoURL || '',
              followers: [],
              following: [],
              createdAt: null,
            }),
          );
        }
      } else {
        dispatch(clearAuth());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return <Loader message="Loading..." />;
  }

  return (
    <View style={{ flex: 1 }}>
      {user ? <MainNavigator /> : <AuthNavigator />}
      <NetworkBanner />
      <Toast toast={toast} onHide={hideToast} />
    </View>
  );
};

const AppNavigator = () => (
  <NavigationContainer>
    <AppContent />
  </NavigationContainer>
);

export default AppNavigator;
