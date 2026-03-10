import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: any[]) => void
) => {
  return onSnapshot(
    collection(db, 'notifications', userId, 'userNotifications'),
    (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      callback(notifications);
    }
  );
};
