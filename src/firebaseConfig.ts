// src/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCvuMKo2JqYS_FOw0_JQIZJhjz6ke7jheo",
  authDomain: "socialmediaapp-9ea15.firebaseapp.com",
  projectId: "socialmediaapp-9ea15",
  storageBucket: "socialmediaapp-9ea15.firebasestorage.app",
  messagingSenderId: "1008667339911",
  appId: "1:1008667339911:web:38fb4f3664b85d0e2e1c22",
  measurementId: "G-FCN9P8PZ0S"
};

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Firestore and Auth exports
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Save Expo Push Token for the current user
 * @param userId string - the Firebase UID of the user
 * @param token string - Expo push token
 */
export const saveExpoPushToken = async (userId: string, token: string) => {
  await setDoc(
    doc(db, 'users', userId),
    { expoPushToken: token }, // save token in Firestore
    { merge: true }           // keep existing fields
  );
};
