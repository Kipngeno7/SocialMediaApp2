import { db } from '../firebaseConfig';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';

/**
 * Block a user
 */
export const blockUser = async (currentUserId: string, targetUserId: string) => {
  const currentRef = doc(db, 'users', currentUserId);
  const targetRef = doc(db, 'users', targetUserId);

  await updateDoc(currentRef, {
    blockedUsers: arrayUnion(targetUserId),
  });

  await updateDoc(targetRef, {
    blockedBy: arrayUnion(currentUserId),
  });
};

/**
 * Unblock user
 */
export const unblockUser = async (currentUserId: string, targetUserId: string) => {
  const currentRef = doc(db, 'users', currentUserId);
  const targetRef = doc(db, 'users', targetUserId);

  await updateDoc(currentRef, {
    blockedUsers: arrayRemove(targetUserId),
  });

  await updateDoc(targetRef, {
    blockedBy: arrayRemove(currentUserId),
  });
};

/**
 * Check if users are blocked
 */
export const checkIfBlocked = async (currentUserId: string, targetUserId: string) => {
  const currentRef = doc(db, 'users', currentUserId);
  const currentSnap = await getDoc(currentRef);

  const blockedUsers = currentSnap.data()?.blockedUsers || [];
  const blockedBy = currentSnap.data()?.blockedBy || [];

  return {
    blocked: blockedUsers.includes(targetUserId),
    blockedBy: blockedBy.includes(targetUserId),
  };
};
