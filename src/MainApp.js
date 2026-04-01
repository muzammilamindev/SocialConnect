import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store'; 
import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { colors } from './theme/colors';

const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
      />
      <Provider store={store}>
        <AppNavigator />
      </Provider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

export default App;