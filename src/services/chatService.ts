import { db, storage } from '../firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { encryptMessage } from './encryption';

import { checkIfBlocked } from './blockService';

export const getOrCreateChat = async (user1: string, user2: string): Promise<string> => {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef);
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const participants = docSnap.data().participants;
    if (participants.includes(user1) && participants.includes(user2)) return docSnap.id;
  }

  const newChat = await addDoc(chatsRef, { participants: [user1, user2] });
  return newChat.id;
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  receiverId: string,
  text: string | null,
  mediaFile: any | null,
  mediaType: 'image' | 'video' | 'audio' | null
) => {

  // BLOCK CHECK
  const blockStatus = await checkIfBlocked(senderId, receiverId);
  if (blockStatus.blocked || blockStatus.blockedBy) {
    throw new Error('User is blocked');
  }

  let mediaUrl = null;

  if (mediaFile) {
    const storageRef = ref(storage, `chatMedia/${chatId}/${Date.now()}`);
    await uploadBytes(storageRef, mediaFile);
    mediaUrl = await getDownloadURL(storageRef);
  }

  const encryptedText = text ? encryptMessage(text, chatId) : null;

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text: encryptedText,
    mediaUrl,
    mediaType,
    timestamp: serverTimestamp(),
    edited: false,
    deleted: false,
  });
};

export const subscribeToChat = (
  chatId: string,
  callback: (messages: any[]) => void
) => {
  return onSnapshot(
    query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc')),
    (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(msgs);
    }
  );
};

export const editMessage = async (chatId: string, messageId: string, newText: string) => {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(msgRef, {
    text: encryptMessage(newText, chatId),
    edited: true,
  });
};

export const deleteMessage = async (chatId: string, messageId: string) => {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(msgRef, { deleted: true });
};
