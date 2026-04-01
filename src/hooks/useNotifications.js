import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  requestNotificationPermission,
  saveFCMToken,
  setupForegroundMessageHandler,
  setupBackgroundNotificationHandler,
  setupNotifeeHandlers,
  createNotificationChannel,
} from '../services/notificationService';

const useNotifications = () => {
  const { profile } = useSelector(state => state.auth);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!profile?.uid) return;

    let foregroundUnsubscribe;
    let notifeeUnsubscribe;

    const init = async () => {
      // 1. Create Android notification channel
      await createNotificationChannel();

      // 2. Request user permission
      const granted = await requestNotificationPermission();
      if (!granted) {
        console.log('Notification permission denied');
        return;
      }

      // 3. Save FCM token to Firestore for server-side push
      await saveFCMToken(profile.uid);

      // 4. Handle foreground FCM messages
      foregroundUnsubscribe = setupForegroundMessageHandler();

      // 5. Handle background/quit notification taps
      setupBackgroundNotificationHandler();

      // 6. Handle Notifee events
      notifeeUnsubscribe = setupNotifeeHandlers();
    };

    init();

    // Refresh FCM token when app comes to foreground
    const subscription = AppState.addEventListener(
      'change',
      async nextState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          await saveFCMToken(profile.uid);
        }
        appState.current = nextState;
      },
    );

    return () => {
      foregroundUnsubscribe?.();
      notifeeUnsubscribe?.();
      subscription.remove();
    };
  }, [profile?.uid]);
};

export default useNotifications;
