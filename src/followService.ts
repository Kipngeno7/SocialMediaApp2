// src/services/notificationService.ts
import fetch from 'node-fetch';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Send a push notification when a user gets a new follower
 * @param targetUserId - The user who will receive the notification
 * @param username - The name of the follower
 */
export const sendFollowPushNotification = async (
  targetUserId: string,
  username: string
) => {
  try {
    // Get target user's data from Firestore
    const userSnap = await getDoc(doc(db, 'users', targetUserId));
    const userData = userSnap.data();

    if (!userData?.expoPushToken) return;

    // Send push notification via Expo
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userData.expoPushToken,
        title: 'New Follower',
        body: `${username} started following you`,
      }),
    });

    console.log(`Follow notification sent to ${targetUserId}`);
  } catch (error) {
    console.error('Error sending follow push notification:', error);
  }
};

/**
 * Send a push notification when a user creates a new post
 * @param targetUserId - The user who will receive the notification
 * @param postTitle - Title of the new post
 */
export const sendNewPostNotification = async (
  targetUserId: string,
  postTitle: string
) => {
  try {
    const userSnap = await getDoc(doc(db, 'users', targetUserId));
    const userData = userSnap.data();

    if (!userData?.expoPushToken) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userData.expoPushToken,
        title: 'New Post',
        body: postTitle,
      }),
    });

    console.log(`New post notification sent to ${targetUserId}`);
  } catch (error) {
    console.error('Error sending new post push notification:', error);
  }
};
