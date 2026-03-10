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
import fetch from 'node-fetch';

// FOLLOW USER (UPGRADED)
export const followUser = async (
  currentUserId: string,
  targetUserId: string
) => {
  if (currentUserId === targetUserId) return;

  // 🔎 Get current user data
  const currentUserSnap = await getDoc(doc(db, 'users', currentUserId));
  const currentUserData = currentUserSnap.data();

  if (!currentUserData) return;

  const { username, profilePicture } = currentUserData;

  // Check if already following
  const existingFollow = await getDoc(
    doc(db, 'following', currentUserId, 'userFollowing', targetUserId)
  );

  if (existingFollow.exists()) return;

  // 1️⃣ Add to following
  await setDoc(
    doc(db, 'following', currentUserId, 'userFollowing', targetUserId),
    {
      username,
      profilePicture,
      createdAt: serverTimestamp(),
    }
  );

  // 2️⃣ Add to followers
  await setDoc(
    doc(db, 'followers', targetUserId, 'userFollowers', currentUserId),
    {
      username,
      profilePicture,
      createdAt: serverTimestamp(),
    }
  );

  // 3️⃣ Update counters
  await updateDoc(doc(db, 'users', currentUserId), {
    followingCount: increment(1),
  });

  await updateDoc(doc(db, 'users', targetUserId), {
    followersCount: increment(1),
  });

  // 4️⃣ Create notification (RANKED)
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
};


// 🔔 Send push notification if target user has a token
const targetUserSnap = await getDoc(doc(db, 'users', targetUserId));
const targetUserData = targetUserSnap.data();

if (targetUserData?.expoPushToken) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: targetUserData.expoPushToken,
      title: 'New Follower',
      body: `${username} started following you`,
    }),
  });
}

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

  // 🔥 Remove follow notification when unfollowing
  await deleteDoc(
    doc(db, 'notifications', targetUserId, 'userNotifications', currentUserId)
  );
};
