import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';

export default function useUserProfile(uid) {
  const [profile, setProfile] = useState({ displayName: '', photoURL: null });
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            setProfile({
              displayName: data.displayName ?? 'Anonymous',
              photoURL: data.photoURL ?? null,
            });
          }
          setLoadingProfile(false);
        },
        (err) => {
          console.error('[useUserProfile] snapshot error:', err);
          setLoadingProfile(false);
        }
      );

    return unsubscribe;
  }, [uid]);

  return { profile, loadingProfile };
}