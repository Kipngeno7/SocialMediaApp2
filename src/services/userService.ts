// src/services/userService.ts
import { db } from '../firebaseConfig'; // your Firestore config
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { supabase } from '../config/supabase'; 

export const getUserById = async (userId: string) => {
  // Existing Firebase Logic
    const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
        const firebaseData = userSnap.exists() ? userSnap.data() : null;

          // Integrated Supabase Logic
            let supabaseData = null;
              try {
                  const { data, error } = await supabase
                        .from('profiles') // Adjust table name to match your schema if different
                              .select('*')
                                    .eq('id', userId)
                                          .single();
                                              
                                                  if (!error) {
                                                        supabaseData = data;
                                                            }
                                                              } catch (err) {
                                                                  console.error('Supabase getUserById error:', err);
                                                                    }

                                                                      // Returns data from both systems simultaneously
                                                                        return {
                                                                            firebase: firebaseData,
                                                                                supabase: supabaseData
                                                                                  };
                                                                                  };

                                                                                  export const getUserPosts = async (userId: string) => {
                                                                                    // Existing Firebase Logic
                                                                                      const postsRef = collection(db, 'posts');
                                                                                        const q = query(postsRef, where('userId', '==', userId));
                                                                                          const querySnap = await getDocs(q);
                                                                                            const firebasePosts = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                                                                                              // Integrated Supabase Logic
                                                                                                let supabasePosts: any[] = [];
                                                                                                  try {
                                                                                                      const { data, error } = await supabase
                                                                                                            .from('posts') // Adjust table name to match your schema if different
                                                                                                                  .select('*')
                                                                                                                        .eq('user_id', userId); // Assumes snake_case naming convention in Postgres

                                                                                                                            if (!error && data) {
                                                                                                                                  supabasePosts = data;
                                                                                                                                      }
                                                                                                                                        } catch (err) {
                                                                                                                                            console.error('Supabase getUserPosts error:', err);
                                                                                                                                              }

                                                                                                                                                // Returns data from both systems simultaneously
                                                                                                                                                  return {
                                                                                                                                                      firebase: firebasePosts,
                                                                                                                                                          supabase: supabasePosts
                                                                                                                                                            };
                                                                                                                                                            };
                                                                                                                                                            