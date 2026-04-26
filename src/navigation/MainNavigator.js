import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import CommentsScreen from '../screens/main/CommentsScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import ChatScreen from '../screens/main/ChatScreen';
import SearchScreen from '../screens/main/SearchScreen';
import PostDetailScreen from '../screens/main/PostDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const TABS = [
  { name: 'Home', emoji: '🏠', label: 'Feed' },
  { name: 'Search', emoji: '🔍', label: 'Search' },
  { name: 'Profile', emoji: '👤', label: 'Profile' },
  { name: 'Settings', emoji: '⚙️', label: 'Settings' },
];

const TabIcon = ({ emoji, label, focused }) => (
  <View style={styles.tabIcon}>
    <Text
      style={[
        styles.tabEmoji,
        { fontFamily: 'System', includeFontPadding: false },
      ]}
    >
      {emoji}
    </Text>
    <Text
      style={[
        styles.tabLabel,
        { color: focused ? colors.primary : colors.text.dark },
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
    {focused && <View style={styles.activeIndicator} />}
  </View>
);

const TAB_COMPONENTS = {
  Home: HomeScreen,
  Search: SearchScreen,
  Profile: ProfileScreen,
  Settings: SettingsScreen,
};

const BottomTabs = () => {
  const uid = useSelector(state => state.auth.user?.uid);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={TAB_COMPONENTS[tab.name]}
          initialParams={tab.name === 'Profile' ? { uid } : undefined}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji={tab.emoji} label={tab.label} focused={focused} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.lg,
    color: colors.text.primary,
  },
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.8, 1],
      }),
    },
  }),
};

const MainNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen
      name="Tabs"
      component={BottomTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="CreatePost"
      component={CreatePostScreen}
      options={{
        headerShown: false,
        presentation: 'modal',
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateY: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.height, 0],
                }),
              },
            ],
          },
        }),
      }}
    />
    <Stack.Screen
      name="Comments"
      component={CommentsScreen}
      options={{ title: 'Comments' }}
    />
    <Stack.Screen
      name="UserProfile"
      component={UserProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ title: 'Chat' }}
    />
    <Stack.Screen
      name="PostDetail"
      component={PostDetailScreen}
      options={{ title: 'Post', headerBackTitleVisible: false }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 65,
    paddingBottom: 4,
    paddingTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    width: 80,
    minWidth: 80,
  },
  tabEmoji: {
    fontSize: 22,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 26,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: fonts.weights.medium,
    textAlign: 'center',
    width: '100%',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

export default MainNavigator;
