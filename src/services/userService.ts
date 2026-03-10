// src/services/userService.ts
import { db } from '../firebaseConfig'; // your Firestore config
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';

export const getUserById = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

export const getUserPosts = async (userId: string) => {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, where('userId', '==', userId));
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
