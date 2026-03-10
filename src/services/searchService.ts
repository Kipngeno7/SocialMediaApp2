// src/services/searchService.ts

import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc
} from "firebase/firestore";

/**
 * Search posts by text
 */
export const searchPosts = async (keyword: string) => {
  try {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const snapshot = await getDocs(q);

    const results: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (
        data.title?.toLowerCase().includes(keyword.toLowerCase()) ||
        data.content?.toLowerCase().includes(keyword.toLowerCase())
      ) {
        results.push({ id: doc.id, ...data });
      }
    });

    return results;
  } catch (error) {
    console.log("Search error:", error);
    return [];
  }
};

/**
 * Search users
 */
export const searchUsers = async (keyword: string, currentUserId: string) => {
  try {
    const q = query(
      collection(db, "users"),
      orderBy("username"),
      limit(20)
    );

    const snapshot = await getDocs(q);

    let users: any[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      if (data.username?.toLowerCase().includes(keyword.toLowerCase())) {
        users.push({ id: docSnap.id, ...data });
      }
    });

    // Get current user document
    const currentUserDoc = await getDoc(doc(db, "users", currentUserId));
    const currentUser = currentUserDoc.data();

    // Hide blocked users
    users = users.filter(
      (user) =>
        !currentUser?.blockedUsers?.includes(user.id) &&
        !currentUser?.blockedBy?.includes(user.id)
    );

    return users;

  } catch (error) {
    console.log("User search error:", error);
    return [];
  }
};
