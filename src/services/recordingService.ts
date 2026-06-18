// src/services/recordingService.ts
import { Audio } from "expo-av";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { supabase } from '../config/supabase'; 

const storage = getStorage();

export const startRecording = async () => {
  await Audio.requestPermissionsAsync();

    const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
              await recording.startAsync();
                return recording;
                };

                export const stopRecording = async (recording: any) => {
                  await recording.stopAndUnloadAsync();
                    return recording.getURI();
                    };

                    /**
                     * Uploads a recorded audio voice note file to both Firebase and Supabase in parallel
                      * @param fileUri - The local URI returned by stopRecording()
                       * @param userId - UID of the current user
                        * @returns download URL of uploaded Firebase audio, or null if upload fails
                         */
                         export const uploadAudioRecording = async (fileUri: string, userId: string) => {
                           const filePath = `recordings/${userId}/audio_${Date.now()}.m4a`;
                             let firebaseDownloadUrl: string | null = null;

                               // Process the local recording URI into a uploadable binary blob
                                 let fileBlob: Blob;
                                   try {
                                       const response = await fetch(fileUri);
                                           fileBlob = await response.blob();
                                             } catch (err) {
                                                 console.log("Failed to process audio binary blob:", err);
                                                     alert("Failed to read audio file data");
                                                         return null;
                                                           }

                                                             // 1️⃣ Parallel Upload to Firebase Storage (Keeping original ecosystem target)
                                                               try {
                                                                   const storageRef = ref(storage, filePath);
                                                                       await uploadBytes(storageRef, fileBlob);
                                                                           firebaseDownloadUrl = await getDownloadURL(storageRef);
                                                                             } catch (err) {
                                                                                 console.log("Firebase Audio upload error:", err);
                                                                                   }

                                                                                     // 2️⃣ Parallel Upload to Supabase Storage (Parallel Setup)
                                                                                       try {
                                                                                           // Note: Make sure to follow the dashboard step below to create an 'audio' bucket
                                                                                               const { error: uploadError } = await supabase.storage
                                                                                                     .from('audio')
                                                                                                           .upload(filePath, fileBlob, {
                                                                                                                   contentType: 'audio/m4a',
                                                                                                                           upsert: true
                                                                                                                                 });

                                                                                                                                     if (uploadError) {
                                                                                                                                           console.log("Supabase audio storage error:", uploadError.message);
                                                                                                                                               } else {
                                                                                                                                                     const { data } = supabase.storage.from('audio').getPublicUrl(filePath);
                                                                                                                                                           console.log("Supabase public audio path generated:", data.publicUrl);
                                                                                                                                                               }
                                                                                                                                                                 } catch (err) {
                                                                                                                                                                     console.log("Supabase Audio upload error:", err);
                                                                                                                                                                       }

                                                                                                                                                                         // Return the main state tracking link back to your UI views
                                                                                                                                                                           if (!firebaseDownloadUrl) {
                                                                                                                                                                               alert("Failed to upload audio recording completely");
                                                                                                                                                                                   return null;
                                                                                                                                                                                     }

                                                                                                                                                                                       return firebaseDownloadUrl;
                                                                                                                                                                                       };
                                                                                                                                                                                       