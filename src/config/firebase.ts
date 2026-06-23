import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// 1. Add this import for Realtime Database
import { getDatabase } from "firebase/database"; 

const firebaseConfig = {
  apiKey: "AIzaSyCvuMKo2JqYS_FOw0_JQIZJhjz6ke7jheo",
    authDomain: "socialmediaapp-9ea15.firebaseapp.com",
      projectId: "socialmediaapp-9ea15",
        storageBucket: "socialmediaapp-9ea15.firebasestorage.app",
          messagingSenderId: "1008667339911",
            appId: "1:1008667339911:web:38fb4f3664b85d0e2e1c22",
            };

            const app = initializeApp(firebaseConfig);

            export const auth = getAuth(app);
            export const firestore = getFirestore(app); // Rename this to keep it distinct
            export const storage = getStorage(app);

            // 2. Export 'db' as the Realtime Database instance your screens expect
            export const db = getDatabase(app); 
            
