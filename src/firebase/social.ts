import database from '@react-native-firebase/database';
import { auth } from '../firebaseConfig';

/* ===================== FOLLOW / UNFOLLOW ===================== */

/* Follow user */
export const followUser = async (targetUid: string) => {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return;

  // Update followers / following nodes
  await database().ref(`following/${currentUid}/${targetUid}`).set(true);
  await database().ref(`followers/${targetUid}/${currentUid}`).set(true);

  // Update counters
  const followerCountRef = database().ref(`users/${targetUid}/followersCount`);
  const followingCountRef = database().ref(`users/${currentUid}/followingCount`);
  followerCountRef.transaction((current) => (current || 0) + 1);
  followingCountRef.transaction((current) => (current || 0) + 1);

  // Add notification
  const notifRef = database().ref(`notifications/${targetUid}`).push();
  await notifRef.set({
    type: 'follow',
    from: currentUid,
    timestamp: Date.now(),
    read: false,
  });
};

/* Unfollow user */
export const unfollowUser = async (targetUid: string) => {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return;

  // Remove followers / following
  await database().ref(`following/${currentUid}/${targetUid}`).remove();
  await database().ref(`followers/${targetUid}/${currentUid}`).remove();

  // Update counters
  const followerCountRef = database().ref(`users/${targetUid}/followersCount`);
  const followingCountRef = database().ref(`users/${currentUid}/followingCount`);
  followerCountRef.transaction((current) => Math.max((current || 1) - 1, 0));
  followingCountRef.transaction((current) => Math.max((current || 1) - 1, 0));
};

/* ===================== GET FOLLOWERS / FOLLOWING ===================== */

/* Get followers */
export const getFollowers = async (uid: string) => {
  const snapshot = await database().ref(`followers/${uid}`).once('value');
  return snapshot.val() || {};
};

/* Get following */
export const getFollowing = async (uid: string) => {
  const snapshot = await database().ref(`following/${uid}`).once('value');
  return snapshot.val() || {};
};

/* ===================== SEARCH USERS ===================== */

/* Search users by username */
export const searchUsers = async (query: string) => {
  const snapshot = await database()
    .ref('usernames')
    .orderByKey()
    .startAt(query)
    .endAt(query + "\uf8ff")
    .once('value');

  const data = snapshot.val() || {};

  // Map usernames to {username, uid}
  return Object.keys(data).map((username) => ({ username, uid: data[username] }));
};

/* ===================== NOTIFICATIONS ===================== */

/* Get notifications */
export const getNotifications = async (uid: string) => {
  const snapshot = await database()
    .ref(`notifications/${uid}`)
    .orderByChild('timestamp')
    .once('value');

  const data = snapshot.val() || {};
  return Object.entries(data).map(([id, notif]: any) => ({ id, ...notif }));
};

/* Mark notification as read */
export const markAsRead = async (uid: string, notifId: string) => {
  await database().ref(`notifications/${uid}/${notifId}/read`).set(true);
};
