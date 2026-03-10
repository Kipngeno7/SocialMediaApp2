// postNotificationService.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, DocumentData } from 'firebase/firestore';
import fetch from 'node-fetch';

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
    data: { someData: 'new post' },
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

// Function to notify all users
async function notifyAllUsers(newPostTitle: string) {
  const usersSnapshot = await db.collection('users').get();
  usersSnapshot.forEach(async (userDoc: any) => {
    const token = userDoc.data().expoPushToken;
    if (token) {
      await sendPushNotification(token, 'New Post!', newPostTitle);
    }
  });
}

// Listen to the 'posts' collection for new posts
const postsCollection = collection(db, 'posts');
onSnapshot(postsCollection, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      const newPost = change.doc.data() as DocumentData;
      console.log('New post detected:', newPost.title);
      notifyAllUsers(newPost.title);
    }
  });
});

console.log('Post notification listener is running...');
