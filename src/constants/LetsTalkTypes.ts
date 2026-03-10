// LetsTalkTypes.ts

export type Member = {
  id: string;
  name: string;
  avatar: string;
  isVIP: boolean;
  isSpeaking: boolean;
  hasMic: boolean;
};

export type ProgramStep = {
  topic: string;
  speakerId: string;
  estimatedTime: number; // optional
};

export type LetsTalkRoom = {
  id: string;
  hostId: string;
  topic: string;
  scheduledTime: number;      // timestamp
  countdownActive: boolean;   // for 2h countdown
  members: Member[];          // all members
  vipMembers: Member[];       // max 130
  talkQueue: string[];        // ids requesting mic
  programSchedule: ProgramStep[];
  recordingUri?: string;      // saved after meeting ends
};
  
    
