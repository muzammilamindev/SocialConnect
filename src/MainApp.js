import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { colors } from './theme/colors';
import ErrorBoundary from './components/common/ErrorBoundary';
import messaging from '@react-native-firebase/messaging';
import { registerBackgroundHandler } from './services/notificationService';
import {
  createNotificationChannel,
  setupForegroundMessageHandler,
  setupBackgroundNotificationHandler,
  setupNotifeeHandlers,
} from './services/notificationService';

registerBackgroundHandler();

const MainApp = () => {
  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }

  const getToken = async () => {
    const token = await messaging().getToken();
    console.log('Token = ', token);
  };

  useEffect(() => {
    const init = async () => {
      await requestUserPermission();
      await getToken();
      await createNotificationChannel();
    };

    init();
    const unsubscribeForeground = setupForegroundMessageHandler();
    const unsubscribeNotifee = setupNotifeeHandlers();
    setupBackgroundNotificationHandler();

    return () => {
      unsubscribeForeground();
      unsubscribeNotifee();
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.background}
            translucent={false}
          />
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <AppNavigator />
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default MainApp;
