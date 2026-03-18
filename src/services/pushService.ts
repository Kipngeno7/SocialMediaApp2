// src/services/pushService.ts

import * as Notifications from 'expo-notifications';
import { saveExpoPushToken } from '../firebaseConfig';
import { auth } from '../firebaseConfig';

/**
 * Registers the current user for push notifications.
 * Requests permissions using the modern Expo Notifications API.
 */
export const registerForPushNotifications = async () => {
  if (!auth.currentUser) return;

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notifications!');
    return;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Save token to Firebase
  await saveExpoPushToken(auth.currentUser.uid, token);
  console.log('Expo Push Token saved:', token);

  return token;
};
