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
import { CATEGORIES } from "../../constants/categories";
import { usePosts } from "./context/PostContext";

// Placeholder user profile
const USER = {
  name: "John Doe",
  avatar: "https://i.pravatar.cc/150?img=3",
};

export default function CreatePostScreen() {
  const { addPost } = usePosts();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [postText, setPostText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mediaUris, setMediaUris] = useState<string[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [draft, setDraft] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const CHARACTER_LIMIT = 280;

  / Restore draf/
  useEffect(() => {
    if (draft) {
      setPostText(draft.postText);
      setSelectedCategory(draft.selectedCategory);
      setCustomCategory(draft.customCategory);
      setMediaUris(draft.mediaUris);
      setAudioUri(draft.audioUri);
      setHashtags(draft.hashtags);
      setLocation(draft.location);
      setVisibility(draft.visibility);
    }
  }, [draft]);

  // Pick IMAGE
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUris([...mediaUris, result.assets[0].uri]);
    }
  };

  // Pick VIDEO
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUris([...mediaUris, result.assets[0].uri]);
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
    setAudioUri(recording.getURI());
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

  // Submit post
 const submitPost = () => {
  if (!postText.trim() && mediaUris.length === 0 && !audioUri) {
    Alert.alert("Post cannot be empty!");
    return;
  }

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
    mediaUris,
    audioUri,
    hashtags,
    location,
    visibility,
    comments: [],
    likes: 0,
    createdAt: Date.now(),
  };

  addPost(newPost);

  // Reset fields
  setPostText("");
  setSelectedCategory(null);
  setCustomCategory("");
  setMediaUris([]);
  setAudioUri(null);
  setHashtags("");
  setLocation("");
  setVisibility("public");

  Alert.alert("Post submitted!");
};
  
     return (
    <ScrollView style={styles.container}>
      {/* USER */}
      <View style={styles.userRow}>
        <Image source={{ uri: USER.avatar }} style={styles.avatar} />
        <Text style={styles.userName}>{USER.name}</Text>
      </View>

      {/* CATEGORY */}
      <Text style={styles.sectionTitle}>Select Category:</Text>
      <View style={styles.categoriesRow}>
        {Object.keys(CATEGORIES).map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSelectedCategory(key)}
            style={[
              styles.categoryButton,
              {
                backgroundColor:
                  selectedCategory === key ? CATEGORIES[key].color : "#ddd",
              },
            ]}
          >
            <Text style={{ color: "#fff", fontSize: 12 }}>
              {CATEGORIES[key].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        placeholder="Write your post..."
        value={postText}
        onChangeText={setPostText}
        multiline
        maxLength={CHARACTER_LIMIT}
        style={[styles.input, { minHeight: 100 }]}
      />

      <Text style={styles.characterCount}>
        {postText.length}/{CHARACTER_LIMIT}
      </Text>

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

      {audioUri && <Text>Audio recorded</Text>}

      {/* MEDIA + ACTION BUTTON ROW */}
      <View style={styles.buttonsRow}>
        {/* MEDIA BUTTONS */}
        <View style={styles.mediaColumn}>
          <TouchableOpacity onPress={handleGoLive} style={styles.liveButton}>
            <Text style={styles.buttonText}>🔴 Go Live</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage} style={styles.button}>
            <Text style={styles.buttonText}>🖼 Pick Image</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickVideo} style={styles.button}>
            <Text style={styles.buttonText}>🎥 Pick Video</Text>
          </TouchableOpacity>

          {!recording ? (
            <TouchableOpacity onPress={startRecording} style={styles.button}>
              <Text style={styles.buttonText}>🎤 Start Audio</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={stopRecording} style={styles.button}>
              <Text style={styles.buttonText}>⏹ Stop Audio</Text>
            </TouchableOpacity>
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
    alignItems: "flex-end",
    justifyContent: "space-between",
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
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    width: 140,
    alignItems: "center",
  },

  submitButtonBlue: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#003366",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    width: 140,
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
});
