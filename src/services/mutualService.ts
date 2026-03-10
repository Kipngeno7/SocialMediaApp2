import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const checkMutualFollow = async (
  userA: string,
  userB: string
) => {
  const aFollowsB = await getDoc(
    doc(db, 'following', userA, 'userFollowing', userB)
  );

  const bFollowsA = await getDoc(
    doc(db, 'following', userB, 'userFollowing', userA)
  );

  return aFollowsB.exists() && bFollowsA.exists();
};
