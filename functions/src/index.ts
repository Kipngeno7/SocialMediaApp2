// functions/src/index.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();
const db = admin.firestore();

// ------------------------------
// Push notification for new posts
// ------------------------------
export const notifyNewPost = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    if (!post) return;

    const userId = post.userId;
    const title = post.title || 'New Post 📢';

    // Notify all users except the post creator
    const usersSnap = await db.collection('users').get();
    usersSnap.forEach(async (userDoc) => {
      if (userDoc.id === userId) return; // skip self
      const userData = userDoc.data();
      if (!userData?.expoPushToken) return;

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userData.expoPushToken,
          title: 'New Post 📢',
          body: title,
        }),
      });
    });
  });

// ------------------------------
// Push notification for likes
// ------------------------------
export const notifyLike = functions.firestore
  .document('posts/{postId}/likes/{userId}')
  .onCreate(async (snap, context) => {
    const { postId, userId } = context.params;

    const postDoc = await db.collection('posts').doc(postId).get();
    const postData = postDoc.data();
    if (!postData) return;

    const postOwnerId = postData.userId;
    if (postOwnerId === userId) return; // don't notify yourself

    const userDoc = await db.collection('users').doc(postOwnerId).get();
    const userData = userDoc.data();
    if (!userData?.expoPushToken) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userData.expoPushToken,
        title: 'New Like ❤️',
        body: 'Someone liked your post!',
      }),
    });
  });

// ------------------------------
// Push notification for comments
// ------------------------------
export const notifyComment = functions.firestore
  .document('posts/{postId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const commentData = snap.data();
    if (!commentData) return;

    const postId = context.params.postId;
    const commenterId = commentData.userId;

    const postDoc = await db.collection('posts').doc(postId).get();
    const postData = postDoc.data();
    if (!postData) return;

    const postOwnerId = postData.userId;
    if (postOwnerId === commenterId) return; // don't notify yourself

    const userDoc = await db.collection('users').doc(postOwnerId).get();
    const userData = userDoc.data();
    if (!userData?.expoPushToken) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userData.expoPushToken,
        title: 'New Comment 💬',
        body: commentData.text || 'Someone commented on your post!',
      }),
    });
  });
