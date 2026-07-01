// src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from 'react';


import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig'; 
import { ActivityIndicator, View } from 'react-native';


import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';




import { TouchableOpacity } from 'react-native';

import AuthScreen from '../screens/AuthScreen';
import ChatScreen from '../screens/ChatScreen';
import FeedScreen from '../screens/FeedScreen';
import HelpCentreScreen from '../screens/HelpCentreScreen';
import HomeScreen from '../screens/HomeScreen';
import LiveStreamScreen from '../screens/LiveStreamScreen';
import LiveStreamsFeed from '../screens/LiveStreamsFeed';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StreamerDashboard from '../screens/StreamerDashboard';
import TermsScreen from '../screens/TermsScreen';
import TrendingScreen from '../screens/TrendingScreen';
import { PostProvider } from '../context/PostContext';


/* ----------- CREATE SCREEN IMPORT ----------- */

import CreateScreen from '../screens/create';

/* ----------- NEW IMPORTS (MISSING SCREENS) ----------- */

import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen';
import LetsTalkRoom from '../screens/LetsTalkRoom';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import WatchLiveScreen from '../screens/WatchLiveScreen';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();




/* ---------------- Bottom Tabs ---------------- */

function MainTabs({ navigation }: any) {
  const headerLeftHamburger = () => (
    <TouchableOpacity onPress={() => navigation.toggleDrawer?.()} style={{ marginLeft: 15 }}>
      <Ionicons name="menu" size={28} color="black" />
    </TouchableOpacity>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: 'center',
        headerLeft: headerLeftHamburger,
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName = '';

          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Create') iconName = 'add-circle-outline';
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

      {/* CREATE TAB ADDED */}
      <Tab.Screen name="Create" component={CreateScreen} />

      <Tab.Screen name="Trending" component={TrendingScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}

/* ---------------- Drawer ---------------- */

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

function AppDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Feed"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        drawerType: "slide",
        drawerStyle: { width: 280 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
        ),
        headerTitleAlign: 'center',
      })}
    >
      {/* FINAL MERGED FEED */}
      <Drawer.Screen name="Feed" component={FeedScreen} />

      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Help Centre" component={HelpCentreScreen} />
      <Drawer.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    </Drawer.Navigator>
  );
}

/* ---------------- Root Stack ---------------- */
export default function AppNavigator() {
    const [user, setUser] = useState<any>(null);
      const [initializing, setInitializing] = useState(true);

        // Monitor account authentication login state changes dynamically
          React.useEffect(() => {
              const subscriber = onAuthStateChanged(auth, (currentUser) => {
                    setUser(currentUser);
                          if (initializing) setInitializing(false);
                              });
                                  return subscriber; // Unsubscribe listener component hook on unmount
                                    }, [initializing]);

                                      // Prevent UI flashing or routing premature updates while Firebase validates session tokens
                                        if (initializing) {
                                            return (
                                                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                                                          <ActivityIndicator size="large" color="#007AFF" />
                                                                </View>
                                                                    );
                                                                      }

                                                                        return (
                                                                              <PostProvider>
                                                                                      <Stack.Navigator screenOptions={{ headerShown: false }}>

                                                                        
                                                                                  {user === null ? (
                                                                                          /* --- AUTH UNREGISTERED STACK FLOW --- */
                                                                                                  <Stack.Screen name="Auth" component={AuthScreen} />
                                                                                                        ) : (
                                                                                                                /* --- APPS AUTHORIZED STACK FLOW --- */
                                                                                                                        <>
                                                                                                                                  <Stack.Screen name="Drawer" component={AppDrawer} />
                                                                                                                                            <Stack.Screen name="Profile" component={ProfileScreen} />
                                                                                                                                                      <Stack.Screen name="Chat" component={ChatScreen as any} />
                                                                                                                                                                <Stack.Screen name="LiveStreamsFeed" component={LiveStreamsFeed} />
                                                                                                                                                                          <Stack.Screen name="LiveViewer" component={LiveStreamScreen} />
                                                                                                                                                                                    <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
                                                                                                                                                                                              <Stack.Screen name="Terms" component={TermsScreen} />
                                                                                                                                                                                                        <Stack.Screen
                                                                                                                                                                                                                    name="Dashboard"
                                                                                                                                                                                                                                component={StreamerDashboard}
                                                                                                                                                                                                                                            options={{ title: "Streamer Dashboard" }}
                                                                                                                                                                                                                                                      />
                                                                                                                                                                                                                                                                <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
                                                                                                                                                                                                                                                                          <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
                                                                                                                                                                                                                                                                                    <Stack.Screen name="LetsTalkRoom" component={LetsTalkRoom} />
                                                                                                                                                                                                                                                                                              <Stack.Screen
                                                                                                                                                                                                                                                                                                          name="PrivacySettings"
                                                                                                                                                                                                                                                                                                                      component={PrivacySettingsScreen}
                                                                                                                                                                                                                                                                                                                                  options={{ title: 'Privacy Settings' }}
                                                                                                                                                                                                                                                                                                                                            />
                                                                                                                                                                                                                                                                                                                                                    </>
                                                                                                                                                                                                                                                                                                                                                          )}
                                                                                                                                                                                                                                                                                                                                                              </Stack.Navigator>
                                                                                                                                                                                                                                                                                                                                                              </PostProvider>
                                                                                                                                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                                                                                                                                }


