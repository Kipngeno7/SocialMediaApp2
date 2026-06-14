// src/services/pushService.ts

import * as Notifications from 'expo-notifications';
import { saveExpoPushToken } from '../firebaseConfig';
import { auth } from '../firebaseConfig';
import { supabase } from '../config/supabase'; 

/**
 * Registers the current user for push notifications.
  * Requests permissions using the modern Expo Notifications API.
   */
   export const registerForPushNotifications = async () => {
     if (!auth.currentUser) return;

       // Check existing permissions
         const { status: existingStatus } = await Notifications.getPermissionsAsync();
           let finalStatus = existingStatus;

             // Request permissions if not already granted
               if (existingStatus !== 'granted') {
                   const { status } = await Notifications.requestPermissionsAsync();
                       finalStatus = status;
                         }

                           if (finalStatus !== 'granted') {
                               console.log('Failed to get push token for push notifications!');
                                   return;
                                     }

                                       // Get Expo push token
                                         const tokenData = await Notifications.getExpoPushTokenAsync();
                                           const token = tokenData.data;

                                             // ==========================================
                                               // 1. Existing Firebase Token Save
                                                 // ==========================================
                                                   await saveExpoPushToken(auth.currentUser.uid, token);
                                                     console.log('Expo Push Token saved to Firebase:', token);

                                                       // ==========================================
                                                         // 2. New Supabase Token Integration
                                                           // ==========================================
                                                             try {
                                                                 const { data: { user } } = await supabase.auth.getUser();
                                                                     
                                                                         if (user) {
                                                                               const { error } = await supabase
                                                                                       .from('profiles')
                                                                                               .update({ expo_push_token: token })
                                                                                                       .eq('id', user.id);

                                                                                                             if (error) throw error;
                                                                                                                   console.log('Expo Push Token saved to Supabase Profiles');
                                                                                                                       }
                                                                                                                         } catch (err) {
                                                                                                                             console.error('Failed to save push token to Supabase:', err);
                                                                                                                               }

                                                                                                                                 return token;
                                                                                                                                 };
