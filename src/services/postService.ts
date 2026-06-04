// src/services/postService.ts
import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  getDoc,
  limit,
  where,
} from 'firebase/firestore';
import { uploadPostMedia } from './mediaService';
import RNFS from 'react-native-fs';

import { checkModeration, checkImageModeration } from './moderationService';

/**
 * Create a new post with optional media (image/video)
 */
export const createPost = async (
  userId: string,
  title: string,
  content: string,
  userCountry: string,
  file?: any
) => {

  // =============================
  // AI Text Moderation
  // =============================
  const textResult = await checkModeration(content);
  if (!textResult.allowed) {
    alert(textResult.reason);
    return;
  }

  let mediaUrl = null;
  let mediaType: 'image' | 'video' | null = null;

  // =============================
  // AI Image Moderation
  // =============================
  if (file) {
    try {
      const base64String = await RNFS.readFile(file.uri, 'base64');
      const imageResult = await checkImageModeration(base64String);
      if (!imageResult.allowed) {
        alert(imageResult.reason);
        return;
      }
    } catch (err) {
      console.log('Image read/moderation error:', err);
      alert('Failed to check image content');
      return;
    }

    mediaUrl = await uploadPostMedia(file, userId);
    mediaType = file.type.startsWith('video') ? 'video' : 'image';
  }

  await addDoc(collection(db, 'posts'), {
    userId,
    title,
    content,
    mediaUrl,
    mediaType,
    likesCount: 0,
    commentsCount: 0,
    country: userCountry,
    createdAt: serverTimestamp(),
  });
};

/**
 * Helper: Compute hours since a post was created
 */
const hoursSincePosted = (timestamp: any) => {
  if (!timestamp) return 0;
  const now = new Date().getTime();
  const created = timestamp.toDate
    ? timestamp.toDate().getTime()
    : new Date(timestamp).getTime();
  return (now - created) / (1000 * 60 * 60); // milliseconds -> hours
};

/**
 * Subscribe to country trending posts with weighted score
 */
export const subscribeToCountryTrending = (
  country: string,
  callback: any,
  limitCount = 10
) => {
  const q = query(
    collection(db, 'posts'),
    where('country', '==', country),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const posts: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const likes = data.likesCount || 0;
      const comments = data.commentsCount || 0;
      const hours = hoursSincePosted(data.createdAt);
      const score = (likes * 2) + (comments * 3) - hours;

      posts.push({ id: doc.id, ...data, score });
    });
    callback(posts);
  });
};

/**
 * Subscribe to global trending posts with weighted score
 */
export const subscribeToGlobalTrending = (
  callback: any,
  limitCount = 10
) => {
  const q = query(
    collection(db, 'posts'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const posts: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const likes = data.likesCount || 0;
      const comments = data.commentsCount || 0;
      const hours = hoursSincePosted(data.createdAt);
      const score = (likes * 2) + (comments * 3) - hours;

      posts.push({ id: doc.id, ...data, score });
    });

    // Sort descending by weighted score
    posts.sort((a, b) => (b.score || 0) - (a.score || 0));
    callback(posts);
  });
};
// Add this to the bottom of src/services/postService.ts

/**
 * Subscribe to all posts ordered by creation time
  */
  export const subscribeToPosts = (callback: (posts: any[]) => void) => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      
        return onSnapshot(q, (snapshot) => {
            const posts: any[] = [];
                snapshot.forEach((docSnap) => {
                      posts.push({ id: docSnap.id, ...docSnap.data() });
                          });
                              callback(posts);
                                });
                                };

                                /**
                                 * Subscribe to live changes for a single post (likes/comments)
                                  */
                                  export const subscribeToPostUpdates = (postId: string, callback: (post: any) => void) => {
                                    const docRef = doc(db, 'posts', postId);
                                      
                                        return onSnapshot(docRef, (docSnap) => {
                                            if (docSnap.exists()) {
                                                  callback({ id: docSnap.id, ...docSnap.data() });
                                                      }
                                                        });
                                                        };
                                                  
