import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import CommentsScreen from '../screens/main/CommentsScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab icon component
const TabIcon = ({ emoji, label, focused }) => (
  <View style={styles.tabIcon}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    <Text
      style={[
        styles.tabLabel,
        { color: focused ? colors.primary : colors.text.light },
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
    {focused && <View style={styles.activeIndicator} />}
  </View>
);

// Bottom Tab Navigator
const BottomTabs = ({ navigation }) => (
  <Tab.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTitleStyle: {
        fontSize: fonts.sizes.xl,
        fontWeight: fonts.weights.bold,
        color: colors.text.primary,
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreatePost')}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>+ Post</Text>
        </TouchableOpacity>
      ),
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        headerTitle: 'Social Connect',
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreatePost')}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>+ Post</Text>
          </TouchableOpacity>
        ),
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="🏠" label="Home" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        headerTitle: 'My Profile',
        headerRight: () => null,
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="👤" label="Profile" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        headerTitle: 'Settings',
        headerRight: () => null,
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="⚙️" label="Settings" focused={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Main Stack Navigator (wraps tabs + modals)
const MainNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: {
        fontWeight: fonts.weights.semiBold,
        fontSize: fonts.sizes.lg,
      },
    }}
  >
    <Stack.Screen
      name="Tabs"
      component={BottomTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="CreatePost"
      component={CreatePostScreen}
      options={{
        presentation: 'modal',
        headerShown: true,
        title: 'Create Post',
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    />
   <Stack.Screen
  name="Comments"
  component={CommentsScreen}
  options={{
    title: 'Comments',
    headerStyle: {
      backgroundColor: colors.surface,
      elevation: 2,
      shadowOpacity: 0.1,
    },
    headerTintColor: colors.primary,        // ✅ makes back arrow visible (indigo)
    headerTitleStyle: {
      fontWeight: fonts.weights.bold,
      fontSize: fonts.sizes.lg,
      color: colors.text.primary,           // ✅ dark title text
    },
    headerBackTitleVisible: false,           // ✅ hides "Back" text on iOS
  }}
/>
    <Stack.Screen
      name="UserProfile"
      component={UserProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 60,
    paddingBottom: 0,
    paddingTop: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    width: 70,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: fonts.sizes.xs,
    marginTop: 3,
    fontWeight: fonts.weights.medium,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  headerButton: {
    marginRight: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  headerButtonText: {
    color: colors.text.white,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semiBold,
  },
});

export default MainNavigator;