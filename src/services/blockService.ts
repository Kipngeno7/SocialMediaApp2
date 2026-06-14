import { db } from '../firebaseConfig';
import { supabase } from '../config/supabase'; 
import {
  doc,
    updateDoc,
      arrayUnion,
        arrayRemove,
          getDoc,
          } from 'firebase/firestore';

          /**
           * Block a user
            */
            export const blockUser = async (currentUserId: string, targetUserId: string) => {
              // --- Existing Firebase Logic ---
                const currentRef = doc(db, 'users', currentUserId);
                  const targetRef = doc(db, 'users', targetUserId);

                    await updateDoc(currentRef, {
                        blockedUsers: arrayUnion(targetUserId),
                          });

                            await updateDoc(targetRef, {
                                blockedBy: arrayUnion(currentUserId),
                                  });

                                    // --- New Supabase Logic ---
                                      const { error } = await supabase
                                          .from('blocks')
                                              .insert([
                                                    { blocker_id: currentUserId, blocked_id: targetUserId }
                                                        ]);

                                                          if (error) {
                                                              console.error('Error blocking user in Supabase:', error.message);
                                                                  throw error;
                                                                    }
                                                                    };

                                                                    /**
                                                                     * Unblock user
                                                                      */
                                                                      export const unblockUser = async (currentUserId: string, targetUserId: string) => {
                                                                        // --- Existing Firebase Logic ---
                                                                          const currentRef = doc(db, 'users', currentUserId);
                                                                            const targetRef = doc(db, 'users', targetUserId);

                                                                              await updateDoc(currentRef, {
                                                                                  blockedUsers: arrayRemove(targetUserId),
                                                                                    });

                                                                                      await updateDoc(targetRef, {
                                                                                          blockedBy: arrayRemove(currentUserId),
                                                                                            });

                                                                                              // --- New Supabase Logic ---
                                                                                                const { error } = await supabase
                                                                                                    .from('blocks')
                                                                                                        .delete()
                                                                                                            .eq('blocker_id', currentUserId)
                                                                                                                .eq('blocked_id', targetUserId);

                                                                                                                  if (error) {
                                                                                                                      console.error('Error unblocking user in Supabase:', error.message);
                                                                                                                          throw error;
                                                                                                                            }
                                                                                                                            };

                                                                                                                            /**
                                                                                                                             * Check if users are blocked
                                                                                                                              */
                                                                                                                              export const checkIfBlocked = async (currentUserId: string, targetUserId: string) => {
                                                                                                                                // --- Existing Firebase Logic ---
                                                                                                                                  const currentRef = doc(db, 'users', currentUserId);
                                                                                                                                    const currentSnap = await getDoc(currentRef);

                                                                                                                                      const blockedUsers = currentSnap.data()?.blockedUsers || [];
                                                                                                                                        const blockedBy = currentSnap.data()?.blockedBy || [];

                                                                                                                                          const firebaseResult = {
                                                                                                                                              blocked: blockedUsers.includes(targetUserId),
                                                                                                                                                  blockedBy: blockedBy.includes(targetUserId),
                                                                                                                                                    };

                                                                                                                                                      // --- Optional Supabase Verification ---
                                                                                                                                                        // You can fall back to Firebase data for your UI, or cross-verify with Supabase like this:
                                                                                                                                                          try {
                                                                                                                                                              // Check if current user blocked the target user
                                                                                                                                                                  const { data: outboundBlock } = await supabase
                                                                                                                                                                        .from('blocks')
                                                                                                                                                                              .select('id')
                                                                                                                                                                                    .eq('blocker_id', currentUserId)
                                                                                                                                                                                          .eq('blocked_id', targetUserId)
                                                                                                                                                                                                .maybeSingle();

                                                                                                                                                                                                    // Check if target user blocked the current user
                                                                                                                                                                                                        const { data: inboundBlock } = await supabase
                                                                                                                                                                                                              .from('blocks')
                                                                                                                                                                                                                    .select('id')
                                                                                                                                                                                                                          .eq('blocker_id', targetUserId)
                                                                                                                                                                                                                                .eq('blocked_id', currentUserId)
                                                                                                                                                                                                                                      .maybeSingle();

                                                                                                                                                                                                                                          return {
                                                                                                                                                                                                                                                blocked: !!outboundBlock,
                                                                                                                                                                                                                                                      blockedBy: !!inboundBlock,
                                                                                                                                                                                                                                                          };
                                                                                                                                                                                                                                                            } catch (error) {
                                                                                                                                                                                                                                                                console.error('Supabase block check failed, falling back to Firebase:', error);
                                                                                                                                                                                                                                                                    return firebaseResult;
                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                                                      