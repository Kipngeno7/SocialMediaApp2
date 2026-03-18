


import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Easing } from "react-native";
import { CATEGORIES } from "../../constants/categories";
import { usePosts } from "./context/PostContext";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as ImageManipulator from 'expo-image-manipulator';
import { Video } from 'react-native-compressor';
import { Ionicons } from "@expo/vector-icons";
import { Member, ProgramStep, LetsTalkRoom } from './LetsTalkTypes';

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "../firebaseConfig"; // adjust path


const storage = getStorage(app);

export const uploadFile = async (uri: string, folder: string): Promise<string | null> => {
  try {
    // Fetch the file from the local uri
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate a unique filename
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `${folder}/${Date.now()}_${filename}`);

    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        snapshot => {
          // Optional: track progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        error => {
          console.error("Upload failed:", error);
          reject(error);
        },
        async () => {
          // Get the download URL when upload completes
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    return null;
  }
};


const generateThumbnail = async (uri: string) => {
  try {
    const { uri: thumbnail } = await VideoThumbnails.getThumbnailAsync(uri, {
      time: 1500,
    });

    setVideoThumbnails(prev => ({
      ...prev,
      [uri]: thumbnail,
    }));
  } catch (e) {
    console.log("Thumbnail error:", e);
  }
};

const CATEGORY_EMOJI: Record<string, string> = {
  Political: "🔴",
  Sports: "🟠",
  Health: "🟢",
  "Educational/Philosophical": "🔵",
  Entertainment: "🌸",
  Technology: "🟣",
  Religious: "✝️",
  "Development/Socioeconomic": "🟤",
  "Personal/Warm Touch": "💛",
  "Public Information": "🟦",
  Other: "⚪",
};

// Placeholder user profile
const USER = {
  name: "John Doe",
  avatar: "https://i.pravatar.cc/150?img=3",
};

export default function CreatePostScreen() {
  const { addPost } = usePosts();
const [mediaMenuOpen, setMediaMenuOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [postText, setPostText] = useState("");
  const [hashtags, setHashtags] = useState("");
    const [audioUris, setAudioUris] = useState<string[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
const [uploading, setUploading] = useState(false);
const rotation = useState(new Animated.Value(0))[0];
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [draft, setDraft] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const CHARACTER_LIMIT = 5000;
const [imageUris, setImageUris] = useState<string[]>([]);
const [videoUris, setVideoUris] = useState<string[]>([]);
const [videoThumbnails, setVideoThumbnails] = useState<{ [key: string]: string }>({});
const [uploadProgress, setUploadProgress] = useState(0);
const removeImage = (uri: string) => {
  setImageUris(prev => prev.filter(item => item !== uri));
};


const removeVideo = (uri: string) => {
  setVideoUris(prev => prev.filter(item => item !== uri));
  setVideoThumbnails(prev => {
    const copy = { ...prev };
    delete copy[uri];
    return copy;
  });
};
useEffect(() => {
  if (selectedCategory) {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000, // 4 seconds for a full rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  } else {
    rotation.stopAnimation();
    rotation.setValue(0); // reset when unselected
  }
}, [selectedCategory]);

  / Restore draf/
  useEffect(() => {
    if (draft) {
      setPostText(draft.postText);
      setSelectedCategory(draft.selectedCategory);
      setCustomCategory(draft.customCategory);
      setMediaUris(draft.mediaUris);
      setAudioUris(draft.audioUris || []);
      setHashtags(draft.hashtags);
      setLocation(draft.location);
      setVisibility(draft.visibility);
    }
  }, [draft]);

  // Pick IMAGE
 const pickImage = async () => {
  if (imageUris.length >= 10) {
    Alert.alert("You can upload a maximum of 10 images.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: 10 - imageUris.length,
    quality: 1,
  });

  if (!result.canceled) {
    const selectedImages = result.assets.map(asset => asset.uri);

    const updatedImages = [...imageUris, ...selectedImages].slice(0, 10);
    setImageUris(updatedImages);
  }
}; 



  // Pick VIDEO
  const pickVideo = async () => {
  if (videoUris.length >= 5) {
    Alert.alert("You can upload a maximum of 5 videos.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsMultipleSelection: true,
    selectionLimit: 5 - videoUris.length,
  });

  if (!result.canceled) {
    const selectedVideos = result.assets.map(asset => asset.uri);

    selectedVideos.forEach(uri => generateThumbnail(uri));

    setVideoUris([...videoUris, ...selectedVideos].slice(0, 5));
  }
};
 
   
// Pick AUDIO file from phone storage
const pickAudio = async () => {
  if (audioUris.length >= 10) {
    Alert.alert("You can upload a maximum of 10 audio files.");
    return;
  }

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
    });

    if (result.type === "success") {
      setAudioUris([...audioUris, result.uri]);
      Alert.alert("Audio selected!", result.name);
    }
  } catch (error) {
    console.log("Error picking audio:", error);
  }
};
 
   // GO LIVE
 const handleGoLive = () => {
  const livePlaceholder = "https://via.placeholder.com/300x200.png?text=LIVE+STREAM";

  addPost({
    user: USER,
    text: postText || "🔴 LIVE NOW", // ensures text exists
    category: selectedCategory || "Other",
    otherCategoryText: selectedCategory === "others" ? customCategory : "",
    mediaUris: [livePlaceholder],
    audioUri: null,
    hashtags,
    location,
    visibility,
    liveStartTime: Date.now(),
  });

  Alert.alert("LIVE started!");
};
    // AUDIO RECORD
  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
    await rec.startAsync();
    setRecording(rec);
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    if (audioUris.length >= 10) {
  Alert.alert("Maximum 10 audio files allowed.");
  return;
}

setAudioUris([...audioUris, recording.getURI()!]);
    setRecording(null);
  };

  // Save draft
  const saveDraft = () => {
    setDraft({
      postText,
      selectedCategory,
      customCategory,
      mediaUris,
      audioUri,
      hashtags,
      location,
      visibility,
    });
    Alert.alert("Draft saved!");
  };
const compressImage = async (uri) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }], // resize large images
      {
        compress: 0.7, // 70% quality
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.log("Image compression error:", error);
    return uri; // fallback if compression fails
  }
};
const compressVideo = async (uri) => {
  try {
    const compressedUri = await Video.compress(
      uri,
      {
        compressionMethod: 'auto',
      },
      (progress) => {
        console.log("Video compression progress:", progress);
      }
    );

    return compressedUri;
  } catch (error) {
    console.log("Video compression error:", error);
    return uri; // fallback
  }
};

  // Submit post
 const submitPost = async () => {
if (!selectedCategory) {
  Alert.alert("Please select category");
  return;
}
  if (
    !postText.trim() &&
    imageUris.length === 0 &&
    videoUris.length === 0 &&
    audioUris.length === 0
  ) {
    Alert.alert("Post cannot be empty!");
    return;
  }

  try {
    setUploading(true);

    // Upload images
    const uploadedImages: string[] = [];
   for (let uri of imageUris) {
  const compressedUri = await compressImage(uri);
  const url = await uploadFile(compressedUri, "images");
  uploadedImages.push(url);
} 
          // Upload videos
    const uploadedVideos: string[] = [];
    for (let uri of videoUris) {
  const compressedUri = await compressVideo(uri);
  const url = await uploadFile(compressedUri, "videos");
  uploadedVideos.push(url);
}
          // Upload audios
    const uploadedAudios: string[] = [];
    for (let uri of audioUris) {
      const url = await uploadFile(uri, "audios");
      uploadedAudios.push(url);
    }

    // 🔥 KEEP YOUR ORIGINAL LOGIC INTACT
    const newPost = {
      id: Date.now().toString(), // ✅ unique ID
      user: {
        id: "1",
        name: "Dennis",
        isVerified: false,
        avatar: USER.avatar,
      },
      text: postText.trim(),
      category: selectedCategory || "Other",
      otherCategoryText:
        selectedCategory === "others" ? customCategory : "",

      // 🔥 Replace local URIs with uploaded URLs
      mediaUris: [...uploadedImages, ...uploadedVideos],
      audioUris: uploadedAudios,

      hashtags,
      location,
      visibility,
      comments: [],   // ✅ untouched
      likes: 0,       // ✅ untouched
      createdAt: Date.now(),
    };

    addPost(newPost);

    // Reset fields
    setPostText("");
    setSelectedCategory(null);
    setCustomCategory("");
    setImageUris([]);
    setVideoUris([]);
    setAudioUris([]);
    setHashtags("");
    setLocation("");
    setVisibility("public");
    setUploadProgress(0);

    Alert.alert("Post submitted!");
  } catch (error) {
    console.log(error);
    Alert.alert("Upload failed");
  } finally {
    setUploading(false);
  }
};

     return (
    <ScrollView style={styles.container}>
      {/* USER */}
      <View style={styles.userRow}>
        <Image source={{ uri: USER.avatar }} style={styles.avatar} />
        <Text style={styles.userName}>{USER.name}</Text>
      </View>
{/* CATEGORIES + Let's Talk */}
<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {/* Categories */}
    {Object.keys(CATEGORIES).map((key) => (
      <CategoryButton key={key} {...CATEGORIES[key]} selected={selectedCategory === key} />
    ))}
  </ScrollView>

  {/* Let's Talk Icon */}
  <TouchableOpacity
    style={{
      width: 40,
      height: 40,
      borderRadius: 6,
      backgroundColor: "#4a90e2",
      justifyContent: "center",
      alignItems: "center",
    }}
    onPress={() => navigation.navigate("LetsTalkCreate")}
  >
    <Text style={{ fontSize: 20 }}>🔊</Text>
  </TouchableOpacity>
</View>

      {/* CATEGORY */}
<Text style={styles.sectionTitle}>Select Category:</Text>
<View style={styles.categoriesRow}>
  {Object.keys(CATEGORIES).map((key) => {
    const isSelected = selectedCategory === key;

    return (
      <TouchableOpacity
        key={key}
        onPress={() => setSelectedCategory(key)}
        style={{ padding: 2, borderRadius: 20, marginBottom: 8 }}
      >
        {/* Rainbow border if selected */}
        {isSelected && (
  <Animated.View
    style={{
      ...StyleSheet.absoluteFillObject,
      borderRadius: 20,
      padding: 2,
      transform: [
        {
          rotate: rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          }),
        },
      ],
    }}
  >
    <LinearGradient
      colors={[
        "#FF0000",
        "#FF7F00",
        "#FFFF00",
        "#00FF00",
        "#0000FF",
        "#4B0082",
        "#8F00FF",
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, borderRadius: 20 }}
    />
  </Animated.View>
)}
     {/* Inner button content */}
        <View
          style={{
            backgroundColor: CATEGORIES[key].color,
            borderRadius: 18, // slightly smaller to show rainbow
            paddingHorizontal: 12,
            paddingVertical: 6,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12 }}>
            {CATEGORIES[key].label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  })}
</View>

{/* Show custom category input if "Others" selected */}
{selectedCategory === "others" && (
  <TextInput
    placeholder="Specify category"
    value={customCategory}
    onChangeText={setCustomCategory}
    style={styles.input}
  />
)}
            {/* POST TEXT */}
      <TextInput
  style={styles.textInput}             // new style
  placeholder="What's happening?"     // updated placeholder
  multiline
  value={postText}
  onChangeText={setPostText}
  maxLength={CHARACTER_LIMIT}         // keep limit
  textAlignVertical="top"             // ensures text starts at the top
/>

<Text style={styles.characterCount}>
  {postText.length}/{CHARACTER_LIMIT}
</Text>
      
  {/* IMAGE GRID */}
<FlatList
  data={imageUris}
  keyExtractor={(item) => item}
  numColumns={3}
  renderItem={({ item }) => (
    <View style={styles.mediaContainer}>
      <Image source={{ uri: item }} style={styles.imagePreview} />

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeImage(item)}
      >
        <Ionicons name="close-circle" size={22} color="red" />
      </TouchableOpacity>
    </View>
  )}
/>
{/* VIDEO GRID */}
<FlatList
  data={videoUris}
  keyExtractor={(item) => item}
  numColumns={3}
  renderItem={({ item }) => (
    <View style={styles.mediaContainer}>
      <Image
        source={{ uri: videoThumbnails[item] }}
        style={styles.imagePreview}
      />

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeVideo(item)}
      >
        <Ionicons name="close-circle" size={22} color="red" />
      </TouchableOpacity>
    </View>
  )}
/>
{/* AUDIO LIST */}
{audioUris.map((uri, index) => (
  <Text key={index}>🎵 Audio {index + 1}</Text>
))}

      {/* HASHTAGS */}
      <TextInput
        placeholder="Hashtags"
        value={hashtags}
        onChangeText={setHashtags}
        style={styles.input}
      />

      {/* LOCATION */}
      <TextInput
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

      {/* MEDIA PREVIEW */}
      {mediaUris.map((uri) => (
        <Image key={uri} source={{ uri }} style={styles.mediaPreview} />
      ))}

           {/* MEDIA + ACTION BUTTON ROW */}
      <View style={styles.buttonsRow}>
        {/* MEDIA BUTTONS */}
        <View style={styles.mediaColumn}>
  {/* GO LIVE remains at the top */}
  <TouchableOpacity onPress={handleGoLive} style={styles.liveButton}>
    <Text style={styles.buttonText}>🔴 Go Live</Text>
  </TouchableOpacity>

  {/* + Add Post Button */}
  <TouchableOpacity
    onPress={() => setMediaMenuOpen(!mediaMenuOpen)}
    style={styles.addPostButton}
  >
    <Text style={{ color: "#fff", fontSize: 30 }}>+</Text>
  </TouchableOpacity>

  <Text style={{ textAlign: "center", color: "#333", marginBottom: 8 }}>Add Post</Text>

  {/* Expanded menu */}
  {mediaMenuOpen && (
    <View>
      <TouchableOpacity
        onPress={pickImage}
        style={styles.expandedButton}
      >
        <Text style={styles.buttonText}>🖼 Pick Image</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={pickAudio}
        style={styles.expandedButton}
      >
        <Text style={styles.buttonText}>🎵 Pick Audio</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={pickVideo}
        style={styles.expandedButton}
      >
        <Text style={styles.buttonText}>🎥 Pick Video</Text>
      </TouchableOpacity>

      {!recording ? (
        <TouchableOpacity onPress={startRecording} style={styles.expandedButton}>
          <Text style={styles.buttonText}>🎤 Record Audio</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={stopRecording} style={styles.expandedButton}>
          <Text style={styles.buttonText}>⏹ Stop Recording</Text>
        </TouchableOpacity>
      )}
    </View>
  )}
{/* REAL UPLOAD PROGRESS BAR */}
{uploading && (
  <View style={{ marginTop: 10 }}>
    <View style={styles.progressBarContainer}>
      <View
        style={[
          styles.progressBar,
          { width: `${uploadProgress}%` },
        ]}
      />
    </View>
    <Text style={{ textAlign: "right", fontSize: 12 }}>
      {Math.round(uploadProgress)}%
    </Text>
  </View>
)}
</View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionColumn}>
          <TouchableOpacity onPress={saveDraft} style={styles.submitButton}>
            <Text style={styles.submitText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPreviewVisible(true)}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={submitPost} style={styles.submitButtonBlue}>
            <Text style={styles.submitTextBlue}>Submit Post</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* VISIBILITY */}
      <Text style={styles.sectionTitle}>Visibility</Text>
      <View style={styles.visibilityRow}>
        {["public", "followers", "private"].map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setVisibility(v as any)}
            style={[
              styles.visibilityButton,
              { backgroundColor: visibility === v ? "#4a90e2" : "#ccc" },
            ]}
          >
            <Text style={{ color: "#fff" }}>{v.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* PREVIEW MODAL */}
      <Modal visible={previewVisible} animationType="slide">
        <ScrollView style={styles.container}>
          <Text style={styles.sectionTitle}>Post Preview</Text>

          <Text>{postText}</Text>

          <FlatList
            data={mediaUris}
            horizontal
            keyExtractor={(i) => i}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.mediaPreview} />
            )}
          />

          <TouchableOpacity
            onPress={() => setPreviewVisible(false)}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>Close Preview</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  userName: { fontWeight: "bold" },

  sectionTitle: { fontWeight: "bold", marginVertical: 8 },

  categoriesRow: { flexDirection: "row", flexWrap: "wrap" },
  categoryButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    margin: 3,
    borderRadius: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },

  characterCount: {
    textAlign: "right",
    color: "#555",
  },

  mediaPreview: {
    width: 100,
    height: 100,
    marginBottom: 8,
    borderRadius: 6,
  },

  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  mediaColumn: {
    alignItems: "flex-start",
    marginVertical: 10,
  },
  actionColumn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  marginVertical: 10,
},
    
     button: {
    backgroundColor: "#4a90e2",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    width: 160,
  },

  liveButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    width: 160,
  },

 submitButton: {
  backgroundColor: "#06d6a0",
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
  marginLeft: 8,
  alignItems: "center",
},

submitButtonBlue: {
  backgroundColor: "#fff",
  borderWidth: 2,
  borderColor: "#003366",
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
  marginLeft: 8,
  alignItems: "center",
}, 
     submitText: {
    color: "#fff",
    fontWeight: "bold",
  },

  submitTextBlue: {
    color: "#003366",
    fontWeight: "bold",
  },

  visibilityRow: {
    flexDirection: "row",
    marginVertical: 8,
  },

  visibilityButton: {
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
rainbowBorder: {
  padding: 2, // thickness of the border
  borderRadius: 8,
  margin: 3,
},

normalWrapper: {
  margin: 3,
},

categoryButton: {
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 6,
},
addPostButton: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: "#4a90e2",
  alignItems: "center",
  justifyContent: "center",
  marginVertical: 8,
  elevation: 5, // Android shadow
},

expandedButton: {
  backgroundColor: "#4a90e2",
  padding: 10,
  borderRadius: 6,
  marginVertical: 5,
  width: 160,
  alignItems: "center",
},
mediaContainer: {
  margin: 5,
},

imagePreview: {
  width: 100,
  height: 100,
  borderRadius: 10,
},

deleteButton: {
  position: "absolute",
  top: -5,
  right: -5,
},

progressBarContainer: {
  height: 6,
  backgroundColor: "#ddd",
  borderRadius: 5,
  marginTop: 10,
},

progressBar: {
  height: 6,
  backgroundColor: "#4CAF50",
  borderRadius: 5,
},
textInput: {
  minHeight: 120,
  maxHeight: 250,
  borderWidth: 0,
  fontSize: 16,
  padding: 12,
},
});
