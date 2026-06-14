import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { supabase } from '../config/supabase'; 

export const checkMutualFollow = async (
  userA: string,
    userB: string
    ): Promise<boolean> => {
      // ==========================
        // Existing Firebase Logic
          // ==========================
            const aFollowsB = await getDoc(
                doc(db, 'following', userA, 'userFollowing', userB)
                  );

                    const bFollowsA = await getDoc(
                        doc(db, 'following', userB, 'userFollowing', userA)
                          );

                            const firebaseMutual = aFollowsB.exists() && bFollowsA.exists();

                              // ==========================
                                // New Supabase Integration
                                  // ==========================
                                    try {
                                        // Check if userA follows userB and userB follows userA in a single query
                                            const { data, error } = await supabase
                                                  .from('followers')
                                                        .select('follower_id, following_id')
                                                              .or(
                                                                      `and(follower_id.eq.${userA},following_id.eq.${userB}),and(follower_id.eq.${userB},following_id.eq.${userA})`
                                                                            );

                                                                                if (error) throw error;

                                                                                    // If both rows exist, it's a mutual match
                                                                                        const supabaseMutual = data && data.length === 2;
                                                                                            
                                                                                                // Return true if either database registers the mutual connection
                                                                                                    return firebaseMutual || supabaseMutual;
                                                                                                      } catch (err) {
                                                                                                          console.error('Supabase mutual follow check failed:', err);
                                                                                                              return firebaseMutual; // Graceful fallback to Firebase logic
                                                                                                                }
                                                                                                                };

