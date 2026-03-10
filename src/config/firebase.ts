import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
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

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
