// src/services/suggestionService.ts
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { supabase } from '../config/supabase'; 
import { checkIfFollowing } from './followService';

/**
 * Get a list of follow suggestions for the current user from Firebase and Supabase.
  * Excludes the current user and users they already follow.
   */
   export const getFollowSuggestions = async (currentUserId: string) => {
     try {
         const rawUsersMap = new Map<string, any>();

             // 1. Fetch all users from Firebase
                 const firebaseSnapshot = await getDocs(collection(db, 'users'));
                     firebaseSnapshot.docs.forEach((docSnap) => {
                           rawUsersMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
                               });

                                   // 2. Fetch all users from Supabase
                                       const { data: supabaseUsers, error } = await supabase
                                             .from('users')
                                                   .select('*');

                                                       if (error) {
                                                             console.log('Supabase suggestions fetch error:', error);
                                                                 } else if (supabaseUsers) {
                                                                       supabaseUsers.forEach((user) => {
                                                                               rawUsersMap.set(user.id, { ...user });
                                                                                     });
                                                                                         }

                                                                                             // Remove the current user early from potential suggestions
                                                                                                 rawUsersMap.delete(currentUserId);

                                                                                                     const suggestions: any[] = [];

                                                                                                         // 3. Filter out users the current user is already following
                                                                                                             for (const [userId, userData] of rawUsersMap.entries()) {
                                                                                                                   const isFollowing = await checkIfFollowing(currentUserId, userId);
                                                                                                                         if (!isFollowing) {
                                                                                                                                 suggestions.push(userData);
                                                                                                                                       }
                                                                                                                                           }

                                                                                                                                               return suggestions;
                                                                                                                                                 } catch (error) {
                                                                                                                                                     console.log('Error getting follow suggestions:', error);
                                                                                                                                                         return [];
                                                                                                                                                           }
                                                                                                                                                           };
