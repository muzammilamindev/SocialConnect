import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from '@notifee/react-native';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../utils/constants';

// Channel IDs
const CHANNEL_ID = 'social_connect_main';

// Create Android notification channel
export const createNotificationChannel = async () => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Social Connect',
    importance: AndroidImportance.HIGH,
    vibration: true,
    lights: true,
  });
};

// Request notification permission
export const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    await notifee.requestPermission();
  }
  return enabled;
};

// Get & save FCM token to Firestore
export const saveFCMToken = async (userId) => {
  try {
    const token = await messaging().getToken();
    if (token) {
      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .update({ fcmToken: token });
    }
    return token;
  } catch (error) {
    console.warn('FCM Token error:', error);
    return null;
  }
};

// Display a local notification via Notifee
export const displayNotification = async ({ title, body, data = {} }) => {
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
};

// Save notification to Firestore
export const saveNotificationToFirestore = async (toUserId, notification) => {
  try {
    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(toUserId)
      .collection('notifications')
      .add({
        ...notification,
        isRead: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    console.warn('Save notification error:', error);
  }
};

// Handle foreground FCM messages
export const setupForegroundMessageHandler = () => {
  return messaging().onMessage(async (remoteMessage) => {
    const { notification, data } = remoteMessage;
    if (notification) {
      await displayNotification({
        title: notification.title || 'Social Connect',
        body: notification.body || '',
        data: data || {},
      });
    }
  });
};

// Handle background/quit notification taps 
export const setupBackgroundNotificationHandler = () => {

  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened from background:', remoteMessage);
  });


  messaging().getInitialNotification().then((remoteMessage) => {
    if (remoteMessage) {
      console.log('App opened from notification:', remoteMessage);
    }
  });
};

// Notifee foreground service event handler 
export const setupNotifeeHandlers = () => {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('Notifee notification pressed:', detail.notification);
    }
    if (type === EventType.DISMISSED) {
      console.log('Notifee notification dismissed');
    }
  });
};

// Background FCM handler (must be called at root level) 
export const registerBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    const { notification, data } = remoteMessage;
    if (notification) {
      await displayNotification({
        title: notification.title || 'Social Connect',
        body: notification.body || '',
        data: data || {},
      });
    }
  });
};