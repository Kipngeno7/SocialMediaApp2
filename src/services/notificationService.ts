// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // Make sure these are added to your existing firestore imports at the top


/**
 * Async wrapper for sending Expo push notifications
 */
const sendPushNotification = async (token: string, title: string, body: string) => {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
      }),
    });
  } catch (err) {
    console.error('Error sending push notification:', err);
  }
};

/**
 * Request permission and get Expo push token for a user
 */
export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for notifications!');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;

    // Save token in Firestore under the user
    await setDoc(
      doc(db, 'users', userId),
      { expoPushToken: token },
      { merge: true }
    );
  } else {
    alert('Must use a physical device for push notifications!');
  }

  return token;
}

/**
 * Send push notification for new follow
 */
export const sendFollowNotification = async (
  userId: string,
  followerName: string
) => {
  const userSnap = await getDoc(doc(db, 'users', userId));
  const userData = userSnap.data();

  if (!userData?.expoPushToken) return;

  // Use the new async helper
  await sendPushNotification(
    userData.expoPushToken,
    'New Follower',
    `${followerName} started following you`
  );
};
export const subscribeToNotifications = (
    userId: string,
      callback: (notifications: any[]) => void
      ) => {
        const q = query(
            collection(db, 'notifications'),
                where('userId', '==', userId)
                  );

                    return onSnapshot(q, (snapshot) => {
                        const notifications: any[] = [];
                            snapshot.forEach((docSnap) => {
                                  notifications.push({ id: docSnap.id, ...docSnap.data() });
                                      });
                                          callback(notifications);
                                            });
                                            };


/**
 * Send push notification for new post
 */
export const sendNewPostNotification = async (
  userId: string,
  title: string
) => {
  const userSnap = await getDoc(doc(db, 'users', userId));
  const userData = userSnap.data();

  if (!userData?.expoPushToken) return;

  // Use the new async helper
  await sendPushNotification(
    userData.expoPushToken,
    'New Post',
    title
  );
};
