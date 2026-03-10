// src/services/mediaService.ts
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import RNFS from "react-native-fs";
import { checkImageModeration } from "./moderationService";

const storage = getStorage();

/**
 * Uploads an image or video for a post with AI moderation
 * @param file - The file object (from React Native Image Picker)
 * @param userId - UID of the current user
 * @returns download URL of uploaded media, or null if moderation fails
 */
export const uploadPostMedia = async (file: any, userId: string) => {
  // 1️⃣ AI moderation before upload
  try {
    const base64String = await RNFS.readFile(file.uri, "base64");
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

  // 2️⃣ Upload to Firebase Storage
  try {
    const storageRef = ref(storage, `posts/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (err) {
    console.log("Media upload error:", err);
    alert("Failed to upload media");
    return null;
  }
};
