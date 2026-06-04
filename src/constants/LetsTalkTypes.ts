export type Member = {
    id: string;
      name: string;
        avatar: string;
          isVIP: boolean;
            isSpeaking: boolean;
              hasMic: boolean;
                joinedAt?: number;
                  role?: "host" | "vip" | "member";
                    requestedToSpeak?: boolean;
                    };

                    export type ProgramStep = {
                      topic: string;
                        speakerId: string;
                          speakerName?: string;
                            estimatedTime: number;
                              completed?: boolean;
                                order?: number;
                                };

                                export type LetsTalkRoomRecord = {
                                  id: string;
                                    hostId: string;
                                      title: string;
                                        topic: string;
                                          scheduledTime: number;
                                            countdownActive: boolean;
                                              members: Member[];
                                                vipMembers: Member[];
                                                  talkQueue: string[];
                                                    programSchedule: ProgramStep[];
                                                      currentSpeakerId?: string;
                                                        nextSpeakerId?: string;
                                                          hostFinalRemarks?: boolean;
                                                            podiumVisible?: boolean;
                                                              liveCamera?: boolean;
                                                                likes: number;
                                                                  comments: RoomComment[];
                                                                    recordingUri?: string;
                                                                      createdAt: number;
                                                                        endedAt?: number;
                                                                          status: "scheduled" | "live" | "ended";
                                                                          };

                                                                          export type RoomComment = {
                                                                            id: string;
                                                                              text: string;
                                                                                author: string;
                                                                                  authorId: string;
                                                                                    createdAt: number;
                                                                                    };

                                                                                    export type SpeakRequest = {
                                                                                      userId: string;
                                                                                        userName: string;
                                                                                          requestedAt: number;
                                                                                          };

                                                                                          export type MicPassEvent = {
                                                                                            fromId: string | null;
                                                                                              toId: string | null;
                                                                                                timestamp: number;
                                                                                                  isHostFinalRemarks?: boolean;
                                                                                                  };

    
