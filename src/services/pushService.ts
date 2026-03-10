import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import { saveExpoPushToken } from '../firebaseConfig';
import { auth } from '../firebaseConfig';

export const registerForPushNotifications = async () => {
  if (!auth.currentUser) return;

  // Check existing permissions
  const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
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
