import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const fetchMembers = async (
  roomId: string,
  lastDoc?: any
) => {
  let q = query(
    collection(db, "letsTalkRooms", roomId, "members"),
    orderBy("joinedAt"),
    limit(50) // load 50 at a time
  );

  if (lastDoc) {
    q = query(
      collection(db, "letsTalkRooms", roomId, "members"),
      orderBy("joinedAt"),
      startAfter(lastDoc),
      limit(50)
    );
  }

  const snapshot = await getDocs(q);
  return snapshot;
};
