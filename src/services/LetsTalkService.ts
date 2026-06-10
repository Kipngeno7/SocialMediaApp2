// src/services/LetsTalkService.ts
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

import { db } from "../firebaseConfig";
import { createClient } from '@supabase/supabase-js';
import {
  LetsTalkRoomRecord,
  Member,
  MicPassEvent,
  ProgramStep,
  RoomComment,
  SpeakRequest
} from "../constants/LetsTalkTypes";

// Initialize Supabase Client (Update keys with your project values or env vars)
const supabase = createClient('https://jywoururkjaszyfrfqnd.supabase.co', 'sb_publishable_-ABLfwp1OMA0J2WWf_77_A_09NtlfIy');

/* ───────────────────────
   CONSTANTS───────────────── */
const MEMBERS_PAGE_SIZE = 50;
const ROOMS_COLLECTION = "letsTalkRooms";

/* ──────────────────
   MEMBER QUERIES
─────────────── */

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

export const fetchMemberById = async (
  roomId: string,
  memberId: string
): Promise<Member | null> => {
  const ref = doc(db, ROOMS_COLLECTION, 
roomId, "members", memberId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Member;
};

export const addMemberToRoom = async (
  roomId: string,
  member: Omit<Member, "id">
): Promise<string> => {
  const ref = await addDoc(collection
(db, ROOMS_COLLECTION, roomId, "members"), {
    ...member,
    joinedAt: serverTimestamp(),
    isVIP: false,
    isSpeaking: false,
    hasMic: false,
    requestedToSpeak: false,
  });

  try {
    await supabase
      .from('lets_talk_rooms')
      .upsert([{ id: roomId }], { onConflict: 'id' });

    await supabase.from('lets_talk_members').insert([
      {
        id: ref.id,
        room_id: roomId,
        user_id: (member as any).userId || ref.id,
        username: (member as any).username || null,
        profile_picture: (member as any).profilePicture || null,
        is_vip: false,
        is_speaking: false,
        has_mic: false,
        requested_to_speak: false,
      },
    ]);
  } catch (sbError) {
    console.error('Supabase Error in addMemberToRoom:', sbError);
  }

  return ref.id;
};

/* ────────────────────────────────
   VIP MANAGEMENT
────────────────────────── */

export const addVipMember = async (
  roomId: string,
  memberId: string
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId, "members", memberId);
  await updateDoc(ref, { isVIP: true });

  try {
    await supabase
      .from('lets_talk_members')
      .update({ is_vip: true })
      .eq('room_id', roomId)
      .eq('id', memberId);
  } catch (sbError) {
    console.error('Supabase Error in addVipMember:', sbError);
  }
};

export const removeVipMember = async (
  roomId: string,
  memberId: string
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId, "members", memberId);
  await updateDoc(ref, { isVIP: false });

  try {
    await supabase
      .from('lets_talk_members')
      .update({ is_vip: false })
      .eq('room_id', roomId)
      .eq('id', memberId);
  } catch (sbError) {
    console.error('Supabase Error in removeVipMember:', sbError);
  }
};

/* ───────────────────────────────
   SPEAKING / MIC MANAGEMENT
─────────────────────── */

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

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ current_speaker_id: memberId ?? null })
      .eq('id', roomId);

    if (memberId) {
      await supabase
        .from('lets_talk_members')
        .update({ is_speaking: true, has_mic: true })
        .eq('room_id', roomId)
        .eq('id', memberId);
    }
  } catch (sbError) {
    console.error('Supabase Error in setCurrentSpeaker:', sbError);
  }
};

export const clearCurrentSpeaker = async (roomId: string): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, { currentSpeakerId: null, nextSpeakerId: null });

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ current_speaker_id: null, next_speaker_id: null })
      .eq('id', roomId);
  } catch (sbError) {
    console.error('Supabase Error in clearCurrentSpeaker:', sbError);
  }
};

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

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({
        next_speaker_id: memberId ?? null,
        host_final_remarks: isHostFinalRemarks,
      })
      .eq('id', roomId);
  } catch (sbError) {
    console.error('Supabase Error in setNextSpeaker:', sbError);
  }
};

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

  try {
    await supabase.from('lets_talk_mic_pass_events').insert([
      {
        room_id: roomId,
        from_id: fromId,
        to_id: toId,
        is_host_final_remarks: isHostFinalRemarks,
      },
    ]);

    await supabase
      .from('lets_talk_rooms')
      .update({
        current_speaker_id: toId ?? null,
        next_speaker_id: null,
        host_final_remarks: isHostFinalRemarks,
      })
      .eq('id', roomId);

    if (fromId) {
      await supabase
        .from('lets_talk_members')
        .update({ is_speaking: false, has_mic: false })
        .eq('room_id', roomId)
        .eq('id', fromId);
    }

    if (toId && !isHostFinalRemarks) {
      await supabase
        .from('lets_talk_members')
        .update({ is_speaking: true, has_mic: true })
        .eq('room_id', roomId)
        .eq('id', toId);
    }
  } catch (sbError) {
    console.error('Supabase Error in passMic:', sbError);
  }
};

/* ─────────────────
   TALK QUEUE (raise hand)
─────────────────────── */

export const requestToSpeak = async (
  roomId: string,
  userId: string
): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const current: string[] = snap.data().talkQueue ?? [];
  if (current.includes(userId)) return;
  const updatedQueue = [...current, userId];
  
  await updateDoc(roomRef, { talkQueue: updatedQueue });

  const memberRef = doc(db, ROOMS_COLLECTION, roomId, "members", userId);
  await updateDoc(memberRef, { requestedToSpeak: true });

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ talk_queue: updatedQueue })
      .eq('id', roomId);

    await supabase
      .from('lets_talk_members')
      .update({ requested_to_speak: true })
      .eq('room_id', roomId)
      .eq('id', userId);
  } catch (sbError) {
    console.error('Supabase Error in requestToSpeak:', sbError);
  }
};

export const removeFromQueue = async (
  roomId: string,
  userId: string
): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const current: string[] = snap.data().talkQueue ?? [];
  const updatedQueue = current.filter((id) => id !== userId);
  
  await updateDoc(roomRef, { talkQueue: updatedQueue });

  const memberRef = doc(db, ROOMS_COLLECTION, roomId, "members", userId);
  await updateDoc(memberRef, { requestedToSpeak: false });

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ talk_queue: updatedQueue })
      .eq('id', roomId);

    await supabase
      .from('lets_talk_members')
      .update({ requested_to_speak: false })
      .eq('room_id', roomId)
      .eq('id', userId);
  } catch (sbError) {
    console.error('Supabase Error in removeFromQueue:', sbError);
  }
};

/* ─────────────────────────
   ROOM METADATA
─────────────────── */

export const fetchRoom = async (
  roomId: string
): Promise<LetsTalkRoomRecord | null> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as LetsTalkRoomRecord;
};

export const createRoom = async (
  room: Omit<
    LetsTalkRoomRecord,
    "id" | "createdAt" | "status" | "likes" | "comments"
  >
): Promise<string> => {
  const nowMs = Date.now();
  const ref = await addDoc(collection(db, ROOMS_COLLECTION), {
    ...room,
    createdAt: nowMs,
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

  try {
    await supabase.from('lets_talk_rooms').insert([
      {
        id: ref.id,
        title: (room as any).title || 'Untitled Room',
        status: 'scheduled',
        likes: 0,
        podium_visible: true,
        live_camera: false,
        host_final_remarks: false,
        current_speaker_id: null,
        next_speaker_id: null,
        talk_queue: [],
        program_schedule: [],
        comments: [],
        created_at_ms: nowMs,
      },
    ]);
  } catch (sbError) {
    console.error('Supabase Error in createRoom:', sbError);
  }

  return ref.id;
};

export const updateRoomTitle = async (
  roomId: string,
  title: string
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, { title });

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ title })
      .eq('id', roomId);
  } catch (sbError) {
    console.error('Supabase Error in updateRoomTitle:', sbError);
  }
};

export const updatePodiumVisible = async (
  roomId: string,
  podiumVisible: boolean
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, { podiumVisible });

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ podium_visible: podiumVisible })
      .eq('id', roomId);
  } catch (sbError) {
    console.error('Supabase Error in updatePodiumVisible:', sbError);
  }
};

export const updateLiveCamera = async (
  roomId: string,
  liveCamera: boolean
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, { liveCamera });

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ live_camera: liveCamera })
      .eq('id', roomId);
  } catch (sbError) {
    console.error('Supabase Error in updateLiveCamera:', sbError);
  }
};

export const endRoom = async (roomId: string): Promise<void> => {
  const nowMs = Date.now();
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, {
    status: 'ended',
    endedAt: nowMs,
    currentSpeakerId: null,
    nextSpeakerId: null,
  });

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({
        status: 'ended',
        ended_at_ms: nowMs,
        current_speaker_id: null,
        next_speaker_id: null,
      })
      .eq('id', roomId);
  } catch (sbError) {
    console.error('Supabase Error in endRoom:', sbError);
  }
};

/* ─────────────────
─────PROGRAM SCHEDULE─────────────────
─────── */
export const updateProgramSchedule = async (
  roomId: string,
  schedule: ProgramStep[]
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(ref, { programSchedule: schedule });

  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ program_schedule: schedule as any })
      .eq('id', roomId);
  } catch (sbError) {
    console.error('Supabase Error in updateProgramSchedule:', sbError);
  }
};
/* ───────────────LIKES────────────────
────── */
export const toggleLike = async (
  roomId: string,
  delta: 1 | -1
): Promise<void> => {
  const ref = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current: number = snap.data().likes ?? 0;
  const nextLikes = Math.max(0, current + delta);
  await updateDoc(ref, { likes: nextLikes });
  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ likes: nextLikes })
      .eq('id', roomId);
  } catch (sbError) {
    console.error('Supabase Error in toggleLike:', sbError);
  }
};

/* ────────────────────
───────COMMENTS─────
────── */
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
  const updatedComments = [...current, newComment];
  await updateDoc(ref, { comments: updatedComments });
  try {
    await supabase
      .from('lets_talk_rooms')
      .update({ comments: updatedComments as any })
      .eq('id', roomId);
  } catch (sbError) {
    console.error('Supabase Error in addComment:', sbError);
  }
};

/* ────────REAL-TIME LISTENERS─────── */
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
