import { auth } from '../firebaseConfig'; 
import { 
  getDatabase, 
    ref, 
      set, 
        remove, 
          push, 
            runTransaction,
              get,
                query,
                  orderByKey,
                    orderByChild,
                      startAt,
                        endAt
                        } from 'firebase/database';

                        /* ===================== FOLLOW / UNFOLLOW ===================== */ 

                        /* Follow user */ 
                        export const followUser = async (targetUid: string) => { 
                          const currentUid = auth.currentUser?.uid; 
                            if (!currentUid) return; 

                              const db = getDatabase();

                                await set(ref(db, `following/${currentUid}/${targetUid}`), true); 
                                  await set(ref(db, `followers/${targetUid}/${currentUid}`), true); 

                                    const followerCountRef = ref(db, `users/${targetUid}/followersCount`); 
                                      const followingCountRef = ref(db, `users/${currentUid}/followingCount`); 

                                        await runTransaction(followerCountRef, (current) => (current || 0) + 1);
                                          await runTransaction(followingCountRef, (current) => (current || 0) + 1);

                                            const notifListRef = ref(db, `notifications/${targetUid}`);
                                              const newNotifRef = push(notifListRef); 

                                                await set(newNotifRef, { 
                                                    type: 'follow', 
                                                        from: currentUid, 
                                                            timestamp: Date.now(), 
                                                                read: false, 
                                                                  }); 
                                                                  }; 

                                                                  /* Unfollow user */ 
                                                                  export const unfollowUser = async (targetUid: string) => { 
                                                                    const currentUid = auth.currentUser?.uid; 
                                                                      if (!currentUid) return; 

                                                                        const db = getDatabase();

                                                                          await remove(ref(db, `following/${currentUid}/${targetUid}`)); 
                                                                            await remove(ref(db, `followers/${targetUid}/${currentUid}`)); 

                                                                              const followerCountRef = ref(db, `users/${targetUid}/followersCount`); 
                                                                                const followingCountRef = ref(db, `users/${currentUid}/followingCount`); 

                                                                                  await runTransaction(followerCountRef, (current) => Math.max(0, (current || 0) - 1));
                                                                                    await runTransaction(followingCountRef, (current) => Math.max(0, (current || 0) - 1));
                                                                                    };

                                                                                    /* ===================== GET FOLLOWERS / FOLLOWING ===================== */

                                                                                    /* Get followers */
                                                                                    export const getFollowers = async (uid: string) => {
                                                                                      const db = getDatabase();
                                                                                        const snapshot = await get(ref(db, `followers/${uid}`));
                                                                                          return snapshot.val() || {};
                                                                                          };

                                                                                          /* Get following */
                                                                                          export const getFollowing = async (uid: string) => {
                                                                                            const db = getDatabase();
                                                                                              const snapshot = await get(ref(db, `following/${uid}`));
                                                                                                return snapshot.val() || {};
                                                                                                };

                                                                                                /* ===================== SEARCH USERS ===================== */

                                                                                                /* Search users by username */
                                                                                                export const searchUsers = async (textQuery: string) => {
                                                                                                  const db = getDatabase();
                                                                                                    const usernamesRef = ref(db, 'usernames');
                                                                                                      
                                                                                                        // Create a clean Firebase query builder sequence
                                                                                                          const searchRules = query(
                                                                                                              usernamesRef, 
                                                                                                                  orderByKey(), 
                                                                                                                      startAt(textQuery), 
                                                                                                                          endAt(textQuery + "\uf8ff")
                                                                                                                            );
                                                                                                                              
                                                                                                                                const snapshot = await get(searchRules);
                                                                                                                                  const data = snapshot.val() || {};

                                                                                                                                    return Object.keys(data).map((username) => ({
                                                                                                                                        username,
                                                                                                                                            uid: data[username]
                                                                                                                                              }));
                                                                                                                                              };

                                                                                                                                              /* ===================== NOTIFICATIONS ===================== */

                                                                                                                                              /* Get notifications */
                                                                                                                                              export const getNotifications = async (uid: string) => {
                                                                                                                                                const db = getDatabase();
                                                                                                                                                  const notifRef = ref(db, `notifications/${uid}`);
                                                                                                                                                    
                                                                                                                                                      const searchRules = query(notifRef, orderByChild('timestamp'));
                                                                                                                                                        const snapshot = await get(searchRules);
                                                                                                                                                          const data = snapshot.val() || {};

                                                                                                                                                            return Object.entries(data).map(([id, notif]: [string, any]) => ({
                                                                                                                                                                id,
                                                                                                                                                                    ...notif
                                                                                                                                                                      }));
                                                                                                                                                                      };

                                                                                                                                                                      /* Mark notification as read */
                                                                                                                                                                      export const markAsRead = async (uid: string, notifId: string) => {
                                                                                                                                                                        const db = getDatabase();
                                                                                                                                                                          await set(ref(db, `notifications/${uid}/${notifId}/read`), true);
                                                                                                                                                                          };
                                                                                                                                                                          