// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import TrendingScreen from '../screens/TrendingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import FeedScreen from '../screens/FeedScreen';


import TermsScreen from '../screens/TermsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpCentreScreen from '../screens/HelpCentreScreen';

// Upgrades: LiveStreamsFeed + LiveStreamScreen
import LiveStreamsFeed from '../screens/LiveStreamsFeed';
import LiveStreamScreen from '../screens/LiveStreamScreen';


import StreamerDashboard from './screens/StreamerDashboard';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

/**
 * Bottom Tab Navigation (Main App)
 * Adds hamburger menu in top-left of each tab
 */
function MainTabs({ navigation }: any) {
  const headerLeftHamburger = () => (
    <TouchableOpacity
      onPress={() => navigation.toggleDrawer?.()}
      style={{ marginLeft: 15 }}
    >
      <Ionicons name="menu" size={28} color="black" />
    </TouchableOpacity>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: 'center',
        headerLeft: headerLeftHamburger,
        tabBarIcon: ({ color, size }) => {
          let iconName: string = '';
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Trending') iconName = 'trending-up-outline';
          else if (route.name === 'Search') iconName = 'search-outline';
          else if (route.name === 'Notifications') iconName = 'notifications-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Trending" component={TrendingScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}

/**
 * Custom drawer content with icons and slide animation
 */
function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label="Feed"
        icon={({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate('Feed')}
      />
      <DrawerItem
        label="Profile"
        icon={({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate('Profile')}
      />
      <DrawerItem
        label="Settings"
        icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate('Settings')}
      />
      <DrawerItem
        label="Help Centre"
        icon={({ color, size }) => <Ionicons name="help-circle-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate('Help Centre')}
      />
      <DrawerItem
        label="Main Tabs"
        icon={({ color, size }) => <Ionicons name="apps-outline" size={size} color={color} />}
        onPress={() => props.navigation.navigate('MainTabs')}
      />
    </DrawerContentScrollView>
  );
}

/**
 * Drawer Navigation with slide-from-left animation & icons
 */
function AppDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Feed"
      drawerType="slide"
      overlayColor="rgba(0,0,0,0.5)"
      drawerStyle={{ width: 280 }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
        ),
        headerTitleAlign: 'center',
        gestureEnabled: true,
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: 'gray',
      })}
    >
      <Drawer.Screen name="Feed" component={FeedScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Help Centre" component={HelpCentreScreen} />
      <Drawer.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    </Drawer.Navigator>
  );
}

/**
 * Root Stack Navigator
 * Handles Auth flow, Drawer, MainTabs, UserProfileScreen, ChatScreen
 * Added TikTok-style LiveStreamsFeed + LiveViewer screens
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth */}
        <Stack.Screen name="Auth" component={AuthScreen} />

        {/* Drawer (Main App after login) */}
        <Stack.Screen name="Drawer" component={AppDrawer} />

        {/* User profile and chat */}
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />

        {/* TikTok-style live streams feed */}
        <Stack.Screen name="LiveStreamsFeed" component={LiveStreamsFeed} />

        {/* Individual live stream viewer */}
        <Stack.Screen name="LiveViewer" component={LiveStreamScreen} />

        {/* Legacy single live stream route (optional) */}
        <Stack.Screen name="LiveStream" component={LiveStreamScreen} />

{/* Terms & Services */}
<Stack.Screen name="Terms" component={TermsScreen} />


{/* Streamer dashboard */}
<Stack.Screen
  name="Dashboard"
  component={StreamerDashboard}
  options={{ title: "Streamer Dashboard" }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
