// src/services/followService.ts
import { db } from '../firebaseConfig';
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Async wrapper for sending Expo push notifications
 */
const sendPushNotification = async (token: string, title: string, body: string) => {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
      }),
    });
  } catch (err) {
    console.error('Error sending push notification:', err);
  }
};
export const checkIfFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
    try {
        const followSnap = await getDoc(
              doc(db, 'following', currentUserId, 'userFollowing', targetUserId)
                  );
                      return followSnap.exists();
                        } catch (error) {
                            console.error('Error checking follow status:', error);
                                return false;
                                  }
                                  };





// FOLLOW USER (UPGRADED)
export const followUser = async (
  currentUserId: string,
  targetUserId: string
) => {
  if (currentUserId === targetUserId) return;

  //  ^=^t^n Get current user data
  const currentUserSnap = await getDoc(doc(db, 'users', currentUserId));
  const currentUserData = currentUserSnap.data();
  if (!currentUserData) return;

  const { username, profilePicture } = currentUserData;

  // Check if already following
  const existingFollow = await getDoc(
    doc(db, 'following', currentUserId, 'userFollowing', targetUserId)
  );
  if (existingFollow.exists()) return;

  // 1  ^o ^c  Add to following
  await setDoc(
    doc(db, 'following', currentUserId, 'userFollowing', targetUserId),
    {
      username,
      profilePicture,
      createdAt: serverTimestamp(),
    }
  );

  // 2  ^o ^c  Add to followers
  await setDoc(
    doc(db, 'followers', targetUserId, 'userFollowers', currentUserId),
    {
      username,
      profilePicture,
      createdAt: serverTimestamp(),
    }
  );

  // 3  ^o ^c  Update counters
  await updateDoc(doc(db, 'users', currentUserId), {
    followingCount: increment(1),
  });
  await updateDoc(doc(db, 'users', targetUserId), {
    followersCount: increment(1),
  });

  // 4  ^o ^c  Create notification (RANKED)
  await setDoc(
    doc(db, 'notifications', targetUserId, 'userNotifications', currentUserId),
    {
      type: 'follow',
      fromUserId: currentUserId,
      username,
      profilePicture,
      rankScore: 10,
      createdAt: serverTimestamp(),
      read: false,
    }
  );

  //  ^=^t^t Send push notification if target user has a token
  const targetUserSnap = await getDoc(doc(db, 'users', targetUserId));
  const targetUserData = targetUserSnap.data();

  if (targetUserData?.expoPushToken) {
    await sendPushNotification(
      targetUserData.expoPushToken,
      'New Follower',
      `${username} started following you`
    );
  }
};

// UNFOLLOW USER (unchanged)
export const unfollowUser = async (
  currentUserId: string,
  targetUserId: string
) => {
  await deleteDoc(
    doc(db, 'following', currentUserId, 'userFollowing', targetUserId)
  );

  await deleteDoc(
    doc(db, 'followers', targetUserId, 'userFollowers', currentUserId)
  );

  await updateDoc(doc(db, 'users', currentUserId), {
    followingCount: increment(-1),
  });

  await updateDoc(doc(db, 'users', targetUserId), {
    followersCount: increment(-1),
  });

  //  ^=^t  Remove follow notification when unfollowing
  await deleteDoc(
    doc(db, 'notifications', targetUserId, 'userNotifications', currentUserId)
  );
};
