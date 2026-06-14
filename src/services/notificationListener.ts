import { db } from '../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { supabase } from '../config/supabase'; 

export const subscribeToNotifications = (
  userId: string,
    callback: (notifications: any[]) => void
    ) => {
      let firebaseNotifications: any[] = [];
        let supabaseNotifications: any[] = [];

          // Helper function to safely merge arrays and push unique objects to the UI callback
            const emitCombinedNotifications = () => {
                const combined = [...firebaseNotifications];
                    
                        // Merge Supabase entries if they don't overwrite a matching ID element
                            supabaseNotifications.forEach((sNotif) => {
                                  if (!combined.some((fNotif) => fNotif.id === sNotif.id)) {
                                          combined.push(sNotif);
                                                }
                                                    });

                                                        // Sort by timestamp if available to keep notification order consistent
                                                            combined.sort((a, b) => {
                                                                  const timeA = a.created_at || a.timestamp || 0;
                                                                        const timeB = b.created_at || b.timestamp || 0;
                                                                              return new Date(timeB).getTime() - new Date(timeA).getTime();
                                                                                  });

                                                                                      callback(combined);
                                                                                        };

                                                                                          // ==========================================
                                                                                            // 1. Existing Firebase Listener
                                                                                              // ==========================================
                                                                                                const unsubscribeFirebase = onSnapshot(
                                                                                                    collection(db, 'notifications', userId, 'userNotifications'),
                                                                                                        (snapshot) => {
                                                                                                              firebaseNotifications = snapshot.docs.map(doc => ({
                                                                                                                      id: doc.id,
                                                                                                                              ...doc.data(),
                                                                                                                                    }));
                                                                                                                                          emitCombinedNotifications();
                                                                                                                                              }
                                                                                                                                                );

                                                                                                                                                  // ==========================================
                                                                                                                                                    // 2. New Supabase Realtime Listener Setup
                                                                                                                                                      // ==========================================
                                                                                                                                                        
                                                                                                                                                          // A. Initial fetch to grab existing notifications from Supabase
                                                                                                                                                            supabase
                                                                                                                                                                .from('notifications')
                                                                                                                                                                    .select('*')
                                                                                                                                                                        .eq('user_id', userId)
                                                                                                                                                                            .then(({ data, error }) => {
                                                                                                                                                                                  if (!error && data) {
                                                                                                                                                                                          supabaseNotifications = data;
                                                                                                                                                                                                  emitCombinedNotifications();
                                                                                                                                                                                                        }
                                                                                                                                                                                                            });

                                                                                                                                                                                                              // B. Subscribe to updates for this user
                                                                                                                                                                                                                const supabaseChannel = supabase
                                                                                                                                                                                                                    .channel(`public:notifications:user_id=eq.${userId}`)
                                                                                                                                                                                                                        .on(
                                                                                                                                                                                                                              'postgres_changes',
                                                                                                                                                                                                                                    {
                                                                                                                                                                                                                                            event: '*', // Listen to INSERT, UPDATE, and DELETE actions
                                                                                                                                                                                                                                                    schema: 'public',
                                                                                                                                                                                                                                                            table: 'notifications',
                                                                                                                                                                                                                                                                    filter: `user_id=eq.${userId}`,
                                                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                                                                (payload) => {
                                                                                                                                                                                                                                                                                        if (payload.eventType === 'INSERT') {
                                                                                                                                                                                                                                                                                                  supabaseNotifications = [payload.new, ...supabaseNotifications];
                                                                                                                                                                                                                                                                                                          } else if (payload.eventType === 'UPDATE') {
                                                                                                                                                                                                                                                                                                                    supabaseNotifications = supabaseNotifications.map((notif) =>
                                                                                                                                                                                                                                                                                                                                notif.id === payload.new.id ? payload.new : notif
                                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                                                  } else if (payload.eventType === 'DELETE') {
                                                                                                                                                                                                                                                                                                                                                            supabaseNotifications = supabaseNotifications.filter(
                                                                                                                                                                                                                                                                                                                                                                        (notif) => notif.id !== payload.old.id
                                                                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                                  emitCombinedNotifications();
                                                                                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                                                                            )
                                                                                                                                                                                                                                                                                                                                                                                                                .subscribe();

                                                                                                                                                                                                                                                                                                                                                                                                                  // ==========================================
                                                                                                                                                                                                                                                                                                                                                                                                                    // 3. Combined Cleanup Unsubscribe Method
                                                                                                                                                                                                                                                                                                                                                                                                                      // ==========================================
                                                                                                                                                                                                                                                                                                                                                                                                                        return () => {
                                                                                                                                                                                                                                                                                                                                                                                                                            unsubscribeFirebase();
                                                                                                                                                                                                                                                                                                                                                                                                                                supabase.removeChannel(supabaseChannel);
                                                                                                                                                                                                                                                                                                                                                                                                                                  };
                                                                                                                                                                                                                                                                                                                                                                                                                                  };

