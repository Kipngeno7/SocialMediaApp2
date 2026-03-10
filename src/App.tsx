// src/App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { auth } from './src/firebaseConfig';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/services/pushService';

export default function App() {
  useEffect(() => {
    const registerPush = async () => {
      // Wait until the user is logged in
      if (auth.currentUser) {
        await registerForPushNotifications();
      } else {
        // Optional: listen for login
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            await registerForPushNotifications();
            unsubscribe(); // stop listening
          }
        });
      }
    };

    registerPush();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
