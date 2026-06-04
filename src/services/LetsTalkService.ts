import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../src/firebaseConfig";
import {
  LetsTalkRoomRecord,
  Member,
  MicPassEvent,
  ProgramStep,
  RoomComment,
  SpeakRequest
} from "../../src/constants/LetsTalkTypes";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const MEMBERS_PAGE_SIZE = 50;
const ROOMS_COLLECTION = "letsTalkRooms";

/* ─────────────────────────────────────────────
   MEMBER QUERIES
───────────────────────────────────────────── */

/**
 * Fetch a paginated batch of members for a room, ordered by joinedAt.
 * Pass lastDoc to continue from the previous page.
 */
export const fetchMembers = async (roomId: string, lastDoc?: any) => {
  let q = query(
    collection(db, ROOMS_COLLECTION, roomId, "members"),
    orderBy("joinedAt"),
    limit(MEMBERS_PAGE_SIZE)
  );

  if (lastDoc) {
    q = query(
      collection(db, ROOMS_COLLECTION, roomId, "members"),
      orderBy("joinedAt"),
      startAfter(lastDoc),
      limit(MEMBERS_PAGE_SIZE)
    );
  }

  const snapshot = await getDocs(q);
  return snapshot;
};

/**
 * Fetch only VIP members for a room (up to 130).
 */
export const fetchVipMembers = async (roomId: string): Promise<Member[]> => {
  const q = query(
    collection(db, ROOMS_COLLECTION, roomId, "members"),
    where("isVIP", "==", true),
    orderBy("joinedAt"),
    limit(130)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
};

/**
 * Fetch a single member by ID.
 */
export const fetchMemberById = async (
  roomId: string,
  memberId: string
): Promise<Member | null> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId, "members", memberId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Member;
};

/**
 * Add a member to the room.
 */
export const addMemberToRoom = async (
  roomId: string,
  member: Omit<Member, "id">
): Promise<string> => {
  const ref = await addDoc(collection(db, ROOMS_COLLECTION, roomId, "members"), {
    ...member,
    joinedAt: serverTimestamp(),
    isVIP: false,
    isSpeaking: false,
    hasMic: false,
    requestedToSpeak: false,
  });
  return ref.id;
};

/* ─────────────────────────────────────────────
   VIP MANAGEMENT
───────────────────────────────────────────── */

/**
 * Mark a member as VIP.
 */
export const addVipMember = async (
  roomId: string,
  memberId: string
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId, "members", memberId);
  await updateDoc(ref, { isVIP: true });
};

/**
 * Remove VIP status from a member.
 */
export const removeVipMember = async (
  roomId: string,
  memberId: string
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId, "members", memberId);
  await updateDoc(ref, { isVIP: false });
};

/* ─────────────────────────────────────────────
   SPEAKING / MIC MANAGEMENT
───────────────────────────────────────────── */

/**
 * Set the current speaker for the room (hasMic + isSpeaking = true).
 * Clears mic from all other members via a room-level field (currentSpeakerId).
 */
export const setCurrentSpeaker = async (
  roomId: string,
  memberId: string | null
): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, { currentSpeakerId: memberId ?? null });

  if (memberId) {
    const memberRef = doc(db, ROOMS_COLLECTION, roomId, "members", memberId);
    await updateDoc(memberRef, { isSpeaking: true, hasMic: true });
  }
};

/**
 * Clear the current speaker and mic from all members.
 */
export const clearCurrentSpeaker = async (roomId: string): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, { currentSpeakerId: null, nextSpeakerId: null });
};

/**
 * Set the next speaker (queued, not yet on mic).
 */
export const setNextSpeaker = async (
  roomId: string,
  memberId: string | null,
  isHostFinalRemarks = false
): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, {
    nextSpeakerId: memberId ?? null,
    hostFinalRemarks: isHostFinalRemarks,
  });
};

/**
 * Pass the mic: current speaker finishes → next speaker becomes current.
 * Logs a mic pass event for history/analytics.
 */
export const passMic = async (
  roomId: string,
  fromId: string | null,
  toId: string | null,
  isHostFinalRemarks = false
): Promise<void> => {
  const event: MicPassEvent = {
    fromId,
    toId,
    timestamp: Date.now(),
    isHostFinalRemarks,
  };

  await addDoc(collection(db, ROOMS_COLLECTION, roomId, "micPassEvents"), event);

  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, {
    currentSpeakerId: toId ?? null,
    nextSpeakerId: null,
    hostFinalRemarks: isHostFinalRemarks,
  });

  if (fromId) {
    const fromRef = doc(db, ROOMS_COLLECTION, roomId, "members", fromId);
    await updateDoc(fromRef, { isSpeaking: false, hasMic: false });
  }

  if (toId && !isHostFinalRemarks) {
    const toRef = doc(db, ROOMS_COLLECTION, roomId, "members", toId);
    await updateDoc(toRef, { isSpeaking: true, hasMic: true });
  }
};

/* ─────────────────────────────────────────────
   TALK QUEUE (raise hand)
───────────────────────────────────────────── */

/**
 * Add a user to the speaking request queue.
 */
export const requestToSpeak = async (
  roomId: string,
  userId: string
): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const current: string[] = snap.data().talkQueue ?? [];
  if (current.includes(userId)) return;
  await updateDoc(roomRef, { talkQueue: [...current, userId] });

  const memberRef = doc(db, ROOMS_COLLECTION, roomId, "members", userId);
  await updateDoc(memberRef, { requestedToSpeak: true });
};

/**
 * Remove a user from the speaking request queue.
 */
export const removeFromQueue = async (
  roomId: string,
  userId: string
): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const current: string[] = snap.data().talkQueue ?? [];
  await updateDoc(roomRef, {
    talkQueue: current.filter((id) => id !== userId),
  });

  const memberRef = doc(db, ROOMS_COLLECTION, roomId, "members", userId);
  await updateDoc(memberRef, { requestedToSpeak: false });
};

/* ─────────────────────────────────────────────
   ROOM METADATA
───────────────────────────────────────────── */

/**
 * Fetch the full room record.
 */
export const fetchRoom = async (
  roomId: string
): Promise<LetsTalkRoomRecord | null> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as LetsTalkRoomRecord;
};

/**
 * Create a new Let's Talk room.
 */
export const createRoom = async (
  room: Omit<LetsTalkRoomRecord, "id" | "createdAt" | "status" | "likes" | "comments">
): Promise<string> => {
  const ref = await addDoc(collection(db, ROOMS_COLLECTION), {
    ...room,
    createdAt: Date.now(),
    status: "scheduled",
    likes: 0,
    comments: [],
    talkQueue: [],
    members: [],
    vipMembers: [],
    programSchedule: [],
    podiumVisible: true,
    liveCamera: false,
    hostFinalRemarks: false,
    currentSpeakerId: null,
    nextSpeakerId: null,
  });
  return ref.id;
};

/**
 * Update the room title (host only).
 */
export const updateRoomTitle = async (
  roomId: string,
  title: string
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, { title });
};

/**
 * Toggle the podium visibility.
 */
export const updatePodiumVisible = async (
  roomId: string,
  podiumVisible: boolean
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, { podiumVisible });
};

/**
 * Toggle live camera for the current speaker.
 */
export const updateLiveCamera = async (
  roomId: string,
  liveCamera: boolean
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, { liveCamera });
};

/**
 * Mark the room as ended.
 */
export const endRoom = async (roomId: string): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, {
    status: "ended",
    endedAt: Date.now(),
    currentSpeakerId: null,
    nextSpeakerId: null,
  });
};

/* ─────────────────────────────────────────────
   PROGRAM SCHEDULE
───────────────────────────────────────────── */

/**
 * Update the full program schedule for the room.
 */
export const updateProgramSchedule = async (
  roomId: string,
  schedule: ProgramStep[]
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, { programSchedule: schedule });
};

/* ─────────────────────────────────────────────
   LIKES
───────────────────────────────────────────── */

/**
 * Increment or decrement the like count.
 */
export const toggleLike = async (
  roomId: string,
  delta: 1 | -1
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current: number = snap.data().likes ?? 0;
  await updateDoc(ref, { likes: Math.max(0, current + delta) });
};

/* ─────────────────────────────────────────────
   COMMENTS
───────────────────────────────────────────── */

/**
 * Add a comment to the room's comment list.
 */
export const addComment = async (
  roomId: string,
  comment: Omit<RoomComment, "id" | "createdAt">
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current: RoomComment[] = snap.data().comments ?? [];
  const newComment: RoomComment = {
    ...comment,
    id: Date.now().toString(),
    createdAt: Date.now(),
  };
  await updateDoc(ref, { comments: [...current, newComment] });
};

/* ─────────────────────────────────────────────
   REAL-TIME LISTENERS
───────────────────────────────────────────── */

/**
 * Subscribe to real-time room updates (title, speaker, queue, etc.).
 * Returns an unsubscribe function.
 */
export const subscribeToRoom = (
  roomId: string,
  onUpdate: (room: LetsTalkRoomRecord) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as LetsTalkRoomRecord);
      }
    },
    (err) => {
      if (onError) onError(err);
      else console.error("subscribeToRoom error:", err);
    }
  );
};

/**
 * Subscribe to real-time member updates for a room.
 * Returns an unsubscribe function.
 */
export const subscribeToMembers = (
  roomId: string,
  onUpdate: (members: Member[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const q = query(
    collection(db, ROOMS_COLLECTION, roomId, "members"),
    orderBy("joinedAt")
  );
  return onSnapshot(
    q,
    (snap) => {
      const members = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
      onUpdate(members);
    },
    (err) => {
      if (onError) onError(err);
      else console.error("subscribeToMembers error:", err);
    }
  );
};
