// notifyService.ts
import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config (same as your app)
const firebaseConfig = {
  apiKey: "AIzaSyCvuMKo2JqYS_FOw0_JQIZJhjz6ke7jheo",
  authDomain: "socialmediaapp-9ea15.firebaseapp.com",
  projectId: "socialmediaapp-9ea15",
  storageBucket: "socialmediaapp-9ea15.firebasestorage.app",
  messagingSenderId: "1008667339911",
  appId: "1:1008667339911:web:38fb4f3664b85d0e2e1c22",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to send notification to one device
async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { someData: 'goes here' },
  };

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    console.log(await res.json());
  } catch (err) {
    console.error('Error sending notification:', err);
  }
}

// Send notification to all users when a new post is created
export async function notifyAllUsers(newPostTitle: string) {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  usersSnapshot.forEach(async (userDoc) => {
    const token = userDoc.data().expoPushToken;
    if (token) {
      await sendPushNotification(token, 'New Post!', newPostTitle);
    }
  });
}
