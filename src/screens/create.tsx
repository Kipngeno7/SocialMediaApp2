import React, { useState, useEffect, useCallback } from "react";
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
import { CATEGORIES } from "../../src/constants/constantCategories";
import { usePosts } from "../../src/context/PostContext";
import * as VideoThumbnails from "expo-video-thumbnails";
import * as ImageManipulator from 'expo-image-manipulator';
import { Video } from 'react-native-compressor';
import { Ionicons } from "@expo/vector-icons";

//import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
//import { app } from "../firebaseConfig";
import {supabase} from '../config/supabase';
import { auth } from "../firebaseConfig"; 
import { useNavigation } from "@react-navigation/native";

//import { createPost } from '../services/postService';


//const storage = getStorage(app);

export const uploadFile = async (uri: string, folder: string): Promise<string | null> => {
    // 1. Guard check: Stop immediately if the file path is empty or invalid
      if (!uri || typeof uri !== 'string' || uri.trim() === "") {
          console.log("Upload bypassed: URI path is empty.");
              return null;
                }
                  
                    try {
                        // 2. Fetch local asset and convert to a file data blob
                            const response = await fetch(uri);
                                if (!response.ok) return null;
                                    const blob = await response.blob();

                                        // 3. Generate a clean unique filename string layout
                                            const filename = uri.substring(uri.lastIndexOf("/") + 1);
                                                const filePath = `${folder}/${Date.now()}_${filename}`;

                                                    // 4. Upload raw file blob data straight into your active 'posts-media' bucket
                                                        const { data, error } = await supabase.storage
                                                              .from('posts-media')
                                                                    .upload(filePath, blob, {
                                                                            cacheControl: '3600',
                                                                                    upsert: false,
                                                                                            contentType: blob.type // Automatically preserves image/video types safely
                                                                                                  });

                                                                                                      if (error) {
                                                                                                            console.error("Supabase file write error details:", error.message);
                                                                                                                  return null;
                                                                                                                      }

                                                                                                                          // 5. Retrieve and return the public CDN URL to save into your post object
                                                                                                                              const { data: publicUrlData } = supabase.storage
                                                                                                                                    .from('posts-media')
                                                                                                                                          .getPublicUrl(filePath);

                                                                                                                                              return publicUrlData.publicUrl;

                                                                                                                                                } catch (error) {
                                                                                                                                                    console.log("Safe catch triggered for file storage upload failure:", error);
                                                                                                                                                        return null; 
                                                                                                                                                          }
                                                                                                                                                          };



                                                      
                                                                
                                                                                
                                                                                        
                                                                                    
                                                                                                    
                                                                                                                
                                                                                                            
                                                                                                                            
                                                                                                                                            
                                                                                                                                              
                                                                                                                                                            
                                                                                                                                                                  
                                                                                                                                                                        
                                                                                                                                                                              
                                                                                                                                                                                            
                                                                                                                                                                                                    
                                                                                                                                                                                                  
                                                                                                                                                                                                            
                                                                                                                                                                                                                  
                                                                                                                                                                                                                  



const CATEGORY_EMOJI: Record<string, string> = {
  "Political/Governance": "🔴",
  Sports: "🟠",
  Health: "🟢",
  "Educational/Philosophical": "🔵",
  Entertainment: "🌸",
  Technological: "🟣",
    Religious: "🕊️",
  "Development/Economics": "🟤",
  "Personal/Warm Touch": "💛",
  "Public Information": "🟦",
  Sociocultural: "🎭",
   "Breaking News": "📰",
     Love: "❤️",
  Others: "⚪",
};

const USER = {
  name: "John Doe",
  avatar: "https://i.pravatar.cc/150?img=3",
};

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { setPosts } = usePosts() as any; // Extractor

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

  const CHARACTER_LIMIT = 10000;
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

  const generateThumbnail = useCallback(async (uri: string) => {
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
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotation.stopAnimation();
      rotation.setValue(0);
    }
  }, [selectedCategory]);

  // Restore draft
  useEffect(() => {
    if (draft) {
      setPostText(draft.postText);
      setSelectedCategory(draft.selectedCategory);
      setCustomCategory(draft.customCategory);
      setImageUris(draft.imageUris || []);
      setVideoUris(draft.videoUris || []);
      setAudioUris(draft.audioUris || []);
      setHashtags(draft.hashtags);
      setLocation(draft.location);
      setVisibility(draft.visibility);
    }
  }, [draft]);

  // Pick IMAGE
  const pickImage = async () => {
    if (imageUris.length >= 15) {
      Alert.alert("You can upload a maximum of 15 images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', //  New

    
      allowsMultipleSelection: true,
      selectionLimit: 15 - imageUris.length,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map(asset => asset.uri);
      const updatedImages = [...imageUris, ...selectedImages].slice(0, 15);
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
        mediaTypes: 'videos', //  New

    
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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAudioUris([...audioUris, asset.uri]);
        Alert.alert("Audio selected!", asset.name ?? "Audio file");
      }
    } catch (error) {
      console.log("Error picking audio:", error);
    }
  };

  // GO LIVE
  const handleGoLive = () => {
    const livePlaceholder = "https://via.placeholder.com/300x200.png?text=LIVE+STREAM";

    createPost("1", postText || "🔴 LIVE NOW", livePlaceholder, location, undefined);

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
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
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

    const uri = recording.getURI();
    if (uri) {
      setAudioUris([...audioUris, uri]);
    }
    setRecording(null);
  };

  // Save draft
  const saveDraft = () => {
    setDraft({
      postText,
      selectedCategory,
      customCategory,
      imageUris,
      videoUris,
      audioUris,
      hashtags,
      location,
      visibility,
    });
    Alert.alert("Draft saved!");
  };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      console.log("Image compression error:", error);
      return uri;
    }
  };

  const compressVideo = async (uri: string): Promise<string> => {
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
      return uri;
    }
  };

  // Submit post
  const submitPost = async () => {
    if (!selectedCategory) {
      Alert.alert("Please select category");
      return;
    }
     if (selectedCategory && selectedCategory.toLowerCase().includes("other")) {
        if (!customCategory.trim()) {
            Alert.alert("Missing Category", "Please type the title for your custom category.");
                return;
                  }
                    
                   // Safety check: Formats the string to true Title Case before database storage
                        const formattedCategory = customCategory
                            .trim()
                                .split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');
                                            
                                              setCustomCategory(formattedCategory);
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

           // 1. Safe Image Upload
                 const uploadedImages: string[] = [];
                       if (imageUris && imageUris.length > 0) {
                               for (const uri of imageUris) {
                                         if (!uri) continue; // Safety skip for invalid paths
                                                   const compressedUri = await compressImage(uri);
                                                             const url = await uploadFile(compressedUri, "images");
                                                                       if (url) uploadedImages.push(url);
                                                                               }
                                                                                     }

                                                                                           // 2. Safe Video Upload
                                                                                                 const uploadedVideos: string[] = [];
                                                                                                       if (videoUris && videoUris.length > 0) {
                                                                                                               for (const uri of videoUris) {
                                                                                                                         if (!uri) continue;
                                                                                                                                   const compressedUri = await compressVideo(uri);
                                                                                                                                             const url = await uploadFile(compressedUri, "videos");
                                                                                                                                                       if (url) uploadedVideos.push(url);
                                                                                                                                                               }
                                                                                                                                                                     }

                                                                                                                                                                           // 3. Safe Audio Upload
                                                                                                                                                                                 const uploadedAudios: string[] = [];
                                                                                                                                                                                       if (audioUris && audioUris.length > 0) {
                                                                                                                                                                                               for (const uri of audioUris) {
                                                                                                                                                                                                         if (!uri) continue;
                                                                                                                                                                                                                   const url = await uploadFile(uri, "audios");
                                                                                                                                                                                                                             if (url) uploadedAudios.push(url);
                                                                                                                                                                                                                                     }
                                                                                                                                                                                                                                           }


          // ==========================================
                // START OF REPLACEMENT PIPELINE
                      // ==========================================

                            // 1. Grab current authenticated Firebase User ID dynamically
                                  const userId = auth.currentUser?.uid || "1"; 

                                        // 2. Fetch the first uploaded image/video URL if it exists (PRESERVED LOGIC)
                                              const mainMediaUrl = uploadedImages.length > 0 ? uploadedImages[0] : (uploadedVideos.length > 0 ? uploadedVideos[0] : "");

                                                    // 3. Insert data cleanly directly into your Supabase Database table
                                                          const { data: dbPost, error: supabaseError } = await supabase
                                                                  .from("posts")
                                                                          .insert([
                                                                                    {
                                                                                                user_id: userId,
                                                                                                            content: postText.trim(),
                                                                                                                        category: selectedCategory === "Others" ? customCategory : (selectedCategory || "Others"),
                                                                                                                                    // 🌟 Change your lines 465 and 466 to look EXACTLY like this:
                                                                                                                                    media_url: mainMediaUrl || uploadedImages[0] || uploadedVideos[0] || null,
                                                                                                                                    
                                                                                                                                              
                                                                                                                                                         // 🌟 Replace your old line 467 with this exact line:
                                                                                                                                                         audio_url: uploadedAudios?.[0] || uploadedAudios || null,
                                                                                                                                                          
                                                                                                                                                                        hashtags: hashtags || null,
                                                                                                                                                                                    location: location || "Unknown Location",
                                                                                                                                                                                                visibility: visibility,
                                                                                                                                                                                                            likes_count: 0,
                                                                                                                                                                                                                        comments_count: 0,
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                          ])
                                                                                                                                                                                                                                                  .select()
                                                                                                                                                                                                                                                          .single();

                                                                                                                                                                                                                                                                if (supabaseError) {
                                                                                                                                                                                                                                                                        throw new Error(`Supabase Insert Failed: ${supabaseError.message}`);
                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                    // 4. Assemble the complete modern object payload structure (PRESERVED LOGIC)
                                                                                                                                                                                                                                                                                          const newPostData = {
                                                                                                                                                                                                                                                                                                  id: dbPost?.id?.toString() || Date.now().toString(),
                                                                                                                                                                                                                                                                                                          user: {
                                                                                                                                                                                                                                                                                                                    id: userId,
                                                                                                                                                                                                                                                                                                                              name: "Dennis",
                                                                                                                                                                                                                                                                                                                                        isVerified: false,
                                                                                                                                                                                                                                                                                                                                                  avatar: USER.avatar,
                                                                                                                                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                                                                                                                                                  text: postText.trim(),
                                                                                                                                                                                                                                                                                                                                                                          category: selectedCategory || "Others",
                                                                                                                                                                                                                                                                                                                                                                                  otherCategoryText: selectedCategory === "Others" ? customCategory : "",
                                                                                                                                                                                                                                                                                                                                                                                          mediaUris: [...uploadedImages, ...uploadedVideos],
                                                                                                                                                                                                                                                                                                                                                                                                  audioUris: uploadedAudios,
                                                                                                                                                                                                                                                                                                                                                                                                          hashtags,
                                                                                                                                                                                                                                                                                                                                                                                                                  location,
                                                                                                                                                                                                                                                                                                                                                                                                                          visibility,
                                                                                                                                                                                                                                                                                                                                                                                                                                  comments: [],
                                                                                                                                                                                                                                                                                                                                                                                                                                          likes: 0,
                                                                                                                                                                                                                                                                                                                                                                                                                                                  createdAt: Date.now(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                        };

                                                                                                                                                                                                                                                                                                                                                                                                                                                              // 5. Prepend fresh post into context UI feed layout state immediately (PRESERVED LOGIC)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    if (setPosts) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            setPosts((prevPosts: any) => [newPostData, ...prevPosts]);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  } else if ((usePosts() as any).addPost) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          (usePosts() as any).addPost(newPostData);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      // 6. Automatically route the user back to the feed to see it render live (PRESERVED LOGIC)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            if (navigation.canGoBack()) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    navigation.goBack();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          } else {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  (navigation.navigate as any)("Feed");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              // ==========================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    // END OF REPLACEMENT PIPELINE
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          // ==========================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

                                                                            


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
                                                                                                            } catch (error: any) {
                                                                                                                    console.log("CRASH ERROR DETAILS:", error);
                                                                                                                          Alert.alert(
                                                                                                                                  "Submission Failed", 
                                                                                                                                          error?.message || JSON.stringify(error) || String(error)
                                                                                                                                                );
                                                                                                                                                    }

                                                                                                             finally {
      setUploading(false);
    }
  };

  const mediaUris = [...imageUris, ...videoUris];

  return (
    <ScrollView style={styles.container}>
      {/* USER */}
      <View style={styles.userRow}>
        <Image source={{ uri: USER.avatar }} style={styles.avatar} />
        <Text style={styles.userName}>{USER.name}</Text>
      </View>

      

      {/* CATEGORY */}
      {/* CATEGORY */}
      <Text style={styles.sectionTitle}>Select Category:</Text>
      <View style={styles.categoriesRow}>
        {Object.keys(CATEGORIES).map((key) => {
            const isSelected = selectedCategory === key;

                return (
                      <TouchableOpacity
                              key={key}
                                      onPress={() => setSelectedCategory(key)}
                                              style={{ 
                                                        padding: isSelected ? 3 : 0, // Outer spacing padding for rainbow border frame width
                                                                  borderRadius: 20, 
                                                                            marginBottom: 8, 
                                                                                      marginHorizontal: 4,
                                                                                                overflow: 'hidden', // Clips the animated gradient box to a smooth pill path
                                                                                                          position: 'relative',
                                                                                                                    alignItems: 'center',
                                                                                                                              justifyContent: 'center'
                                                                                                                                      }}
                                                                                                                                            >
                                                                                                                                                    {/* Rainbow border animation container if active */}
                                                                                                                                                            {isSelected && (
                                                                                                                                                                      <Animated.View
                                                                                                                                                                                  style={{
                                                                                                                                                                                                position: 'absolute',
                                                                                                                                                                                                              width: '200%', // Ensures gradient covers corners safely during rotation
                                                                                                                                                                                                                            height: '200%',
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            style={{ flex: 1 }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </Animated.View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          {/* Inner button surface content sits safely on top */}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <View
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            style={{
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        backgroundColor: (CATEGORIES as any)[key].color,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    borderRadius: 18,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                paddingHorizontal: 12,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            paddingVertical: 6,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        alignItems: "center",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          >
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: '600' }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                {(CATEGORIES as any)[key].label}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </Text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </TouchableOpacity>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              })}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </View>
      {/* Show custom category input if any variant of Other is selected */}
      {selectedCategory && selectedCategory.toLowerCase().includes("other") && (
        <View style={{ marginVertical: 8 }}>
            <Text style={[styles.sectionTitle, { color: '#ef476f', fontSize: 13, marginBottom: 4 }]}>
                  ⚠️ Please type the title of your custom category:
                      </Text>
                          <TextInput
                           placeholder="Type your category title here... (e.g., Maucori Story)"
                                 placeholderTextColor="#888"
                                       value={customCategory}
                                             onChangeText={setCustomCategory}
                                                   autoCapitalize="words" // Automatically capitalizes the first letter of each word
                                                         style={[styles.input, { borderColor: '#ef476f', backgroundColor: '#fff5f5' }]}
                                                             />     
                                                              </View>
                                                              )}
                                                              


      {/* POST TEXT */}
      <TextInput
        style={styles.textInput}
        placeholder="Add post"
        multiline
        value={postText}
        onChangeText={setPostText}
        maxLength={CHARACTER_LIMIT}
        textAlignVertical="top"
      />

      <Text style={styles.characterCount}>
        {postText.length}/{CHARACTER_LIMIT}
      </Text>

            {/* IMAGE GRID */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
                          {imageUris.map((item) => (
                                    <View key={item} style={styles.mediaContainer}>
                                                <Image source={{ uri: item }} style={styles.imagePreview} />
                                                            <TouchableOpacity
                                                                          style={styles.deleteButton}
                                                                                        onPress={() => removeImage(item)}
                                                                                                    >
                                                                                                                  <Ionicons name="close-circle" size={22} color="red" />
                                                                                                                              </TouchableOpacity>
                                                                                                                                        </View>
                                                                                                                                                ))}
                                                                                                                                                      </View>

      
      

            {/* VIDEO GRID */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
                          {videoUris.map((item) => (
                                    <View key={item} style={styles.mediaContainer}>
                                                <Image
                                                              source={{ uri: videoThumbnails[item] || item }}
                                                                            style={styles.imagePreview}
                                                                                        />
                                                                                                    <TouchableOpacity
                                                                                                                  style={styles.deleteButton}
                                                                                                                                onPress={() => removeVideo(item)}
                                                                                                                                            >
                                                                                                                                                          <Ionicons name="close-circle" size={22} color="red" />
                                                                                                                                                                      </TouchableOpacity>
                                                                                                                                                                                </View>
                                                                                                                                                                                        ))}
                                                                                                                                                                                              </View>

      

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

      

      {/* MEDIA + ACTION BUTTON ROW */}
      {/* MEDIA + ACTION BUTTON ROW */}
      <View style={styles.buttonsRow}>
        
          {/* LEFT COLUMN: LISTED MEDIA ACTIONS */}
            <View style={styles.mediaColumn}>
                {/* Go Live Button sits cleanly at the top of media list */}
                    <TouchableOpacity onPress={handleGoLive} style={styles.liveButton}>
                          <Text style={styles.buttonText}>🔴 Go Live</Text>
                              </TouchableOpacity>

                                  {/* Exposed Media Selection Links list down vertically */}
                                      <TouchableOpacity onPress={pickImage} style={styles.expandedButton}>
                                            <Text style={styles.buttonText}>🖼️ Pick Image</Text>
                                                </TouchableOpacity>

                                                    <TouchableOpacity onPress={pickAudio} style={styles.expandedButton}>
                                                          <Text style={styles.buttonText}>🎵 Pick Audio</Text>
                                                              </TouchableOpacity>

                                                                  <TouchableOpacity onPress={pickVideo} style={styles.expandedButton}>
                                                                        <Text style={styles.buttonText}>🎥 Pick Video</Text>
                                                                            </TouchableOpacity>

                                                                                {!recording ? (
                                                                                      <TouchableOpacity onPress={startRecording} style={styles.expandedButton}>
                                                                                              <Text style={styles.buttonText}>🎤 Record Audio</Text>
                                                                                                    </TouchableOpacity>
                                                                                                        ) : (
                                                                                                              <TouchableOpacity onPress={stopRecording} style={styles.expandedButton}>
                                                                                                                      <Text style={styles.buttonText}>⏹️ Stop Recording</Text>
                                                                                                                            </TouchableOpacity>
                                                                                                                                )}

                                                                                                                                    {/* UPLOAD PROGRESS TRACKING */}
                                                                                                                                        {uploading && (
                                                                                                                                              <View style={{ width: 160, marginTop: 10 }}>
                                                                                                                                                      <View style={styles.progressBarContainer}>
                                                                                                                                                                <View
                                                                                                                                                                            style={[
                                                                                                                                                                                          styles.progressBar,
                                                                                                                                                                                                        { width: `${uploadProgress}%` as any },
                                                                                                                                                                                                                    ]}
                                                                                                                                                                                                                              />
                                                                                                                                                                                                                                      </View>
                                                                                                                                                                                                                                              <Text style={{ textAlign: "right", fontSize: 12, color: "#333" }}>
                                                                                                                                                                                                                                                        {Math.round(uploadProgress)}%
                                                                                                                                                                                                                                                                </Text>
                                                                                                                                                                                                                                                                      </View>
                                                                                                                                                                                                                                                                          )}
                                                                                                                                                                                                                                                                            </View>

                                                                                                                                                                                                                                                                              {/* RIGHT COLUMN: ACTION BUTTONS ADJACENT TO RECORD AUDIO */}
                                                                                                                                                                                                                                                                                <View style={styles.actionColumn}>
                                                                                                                                                                                                                                                                                    <TouchableOpacity onPress={saveDraft} style={styles.submitButton}>
                                                                                                                                                                                                                                                                                          <Text style={styles.submitText}>Save Draft</Text>
                                                                                                                                                                                                                                                                                              </TouchableOpacity>

                                                                                                                                                                                                                                                                                                  <TouchableOpacity onPress={() => setPreviewVisible(true)} style={styles.submitButton}>
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

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", marginVertical: 10 }}>
                                  {mediaUris.map((uri) => (
                                                <Image key={uri} source={{ uri }} style={[styles.mediaPreview, { marginRight: 8 }]} />
                                                            ))}
                                                                      </ScrollView>
                                                                      
            

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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    margin: 3,
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
                alignItems: "flex-end", // Keeps right action options anchored cleanly near Record Audio baseline
                    marginVertical: 12,
                      },
  
  

  mediaColumn: {
        flexDirection: "column",
            alignItems: "flex-start",
              },
  
  actionColumn: {
        flexDirection: "row", // Lines your action choices up horizontally side-by-side
            alignItems: "center",
                justifyContent: "flex-end",
                    flex: 1, // Expands column box smoothly to leverage remaining container space
                        paddingBottom: 5, // Tiny alignment balance adjustment tweak
                          },

  

  button: {
    backgroundColor: "#4a90e2",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    width: 160,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
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
            paddingVertical: 10,
                paddingHorizontal: 8,
                    borderRadius: 6,
                        marginLeft: 6,
                            alignItems: "center",
                                minWidth: 65, // Balances text content sizing constraints safely
                                  },
  

  submitButtonBlue: {
        backgroundColor: "#fff",
            borderWidth: 2,
                borderColor: "#003366",
                    paddingVertical: 8, // Factoring in the 2px line border boundary thickness balance
                        paddingHorizontal: 8,
                            borderRadius: 6,
                                marginLeft: 6,
                                    alignItems: "center",
                                        minWidth: 85,
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
    padding: 2,
    borderRadius: 8,
    margin: 3,
  },

  normalWrapper: {
    margin: 3,
  },

  addPostButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4a90e2",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    elevation: 5,
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
function createPost(arg0: string, arg1: string, livePlaceholder: string, location: string, undefined: undefined) {
  throw new Error("Function not implemented.");
}

