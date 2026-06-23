// src/services/mediaService.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as FileSystem from 'expo-file-system';
import { checkImageModeration } from "./moderationService";
import { supabase } from '../config/supabase'; // Imported your existing Supabase client

const storage = getStorage();

/**
 * Uploads an image or video for a post with AI moderation to both Firebase and Supabase
  * @param file - The file object (from React Native Image Picker)
   * @param userId - UID of the current user
    * @returns download URL of uploaded Firebase media, or null if moderation fails
     */
     export const uploadPostMedia = async (file: any, userId: string) => {
       // 1️⃣ AI moderation before upload (Original Safety Checkpoint)
         try {
             const base64String = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
                 const moderationResult = await checkImageModeration(base64String);

                     if (!moderationResult.allowed) {
                           alert(moderationResult.reason || "Media blocked by moderation");
                                 return null; // stop upload if content is unsafe
                                     }
                                       } catch (err) {
                                           console.log("Image moderation failed:", err);
                                               alert("Media moderation failed. Upload blocked.");
                                                   return null;
                                                     }

                                                       const filePath = `posts/${userId}/${Date.now()}_${file.name}`;
                                                         let firebaseDownloadUrl: string | null = null;

                                                           // Prepare binary blob for upload handling
                                                             let fileBlob: Blob;
                                                               try {
                                                                   const response = await fetch(file.uri);
                                                                       fileBlob = await response.blob();
                                                                         } catch (err) {
                                                                             console.log("Failed to process file binary:", err);
                                                                                 alert("Failed to read media file data");
                                                                                     return null;
                                                                                       }

                                                                                         // 2️⃣ Upload to Firebase Storage (Original Logic)
                                                                                           try {
                                                                                               const storageRef = ref(storage, filePath);
                                                                                                   await uploadBytes(storageRef, fileBlob);
                                                                                                       firebaseDownloadUrl = await getDownloadURL(storageRef);
                                                                                                         } catch (err) {
                                                                                                             console.log("Firebase Media upload error:", err);
                                                                                                               }

                                                                                                                 // 3️⃣ Parallel Upload to Supabase Storage (Parallel Setup)
                                                                                                                   try {
                                                                                                                       // Note: Ensure you have created a public bucket named 'posts' in your Supabase dashboard
                                                                                                                           const { error: uploadError } = await supabase.storage
                                                                                                                                 .from('posts')
                                                                                                                                       .upload(filePath, fileBlob, {
                                                                                                                                               contentType: file.type || 'image/jpeg',
                                                                                                                                                       upsert: true
                                                                                                                                                             });

                                                                                                                                                                 if (uploadError) {
                                                                                                                                                                       console.log("Supabase storage error:", uploadError.message);
                                                                                                                                                                           } else {
                                                                                                                                                                                 // Opt-in link tracking setup if you need to access Supabase URLs globally later
                                                                                                                                                                                       const { data } = supabase.storage.from('posts').getPublicUrl(filePath);
                                                                                                                                                                                             console.log("Supabase public media tracking path generated:", data.publicUrl);
                                                                                                                                                                                                 }
                                                                                                                                                                                                   } catch (err) {
                                                                                                                                                                                                       console.log("Supabase Media upload error:", err);
                                                                                                                                                                                                         }

                                                                                                                                                                                                           // Handle ultimate UI return fallback checking
                                                                                                                                                                                                             if (!firebaseDownloadUrl) {
                                                                                                                                                                                                                 alert("Failed to upload media completely");
                                                                                                                                                                                                                     return null;
                                                                                                                                                                                                                       }

                                                                                                                                                                                                                         return firebaseDownloadUrl;
                                                                                                                                                                                                                         };
                                                                                                                                                                                                                         