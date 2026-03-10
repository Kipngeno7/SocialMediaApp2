// src/services/suggestionService.ts
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { checkIfFollowing } from './followService';

/**
 * Get a list of follow suggestions for the current user.
 * Excludes users the current user already follows.
 */
export const getFollowSuggestions = async (currentUserId: string) => {
  const snapshot = await getDocs(collection(db, 'users')); // Get all users
  const suggestions: any[] = [];

  // Loop through each user
  for (const userDoc of snapshot.docs) {
    if (userDoc.id !== currentUserId) { // Exclude current user
      const isFollowing = await checkIfFollowing(currentUserId, userDoc.id);
      if (!isFollowing) { // Only suggest users not already followed
        suggestions.push({ id: userDoc.id, ...userDoc.data() });
      }
    }
  }

  return suggestions;
};
