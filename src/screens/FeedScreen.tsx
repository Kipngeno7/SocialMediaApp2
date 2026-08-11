

// Combined & cleaned: feed.tsx + FeedScreen.tsx

import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  
  Alert,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
  Button,
  Animated,
  ScrollView,
  
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
} from "react-native";

import { Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import { Platform } from 'react-native';

// Dynamically require only on mobile platforms
const MediaLibrary = Platform.OS !== 'web' ? require('expo-media-library') : null;

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
//import { getDatabase, ref, onValue } from 'firebase/database';

import axios from "axios";

import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import {  Modal,KeyboardAvoidingView } from 'react-native';






import CommentThread from "../../src/components/CommentThread";
import AnimatedSpringConnector from "../../src/components/ElasticSpring";

import { CATEGORIES } from "../../src/constants/constantCategories";
import { usePosts } from "../../src/context/PostContext";
import PostCard from "../components/PostCard";
import { calculateFinalScore } from "../utils/feedRanking";
import { auth } from "../firebaseConfig";
import {supabase} from '../config/supabase';
import { connectSocket, subscribeToNewPosts } from "../services/socketService";

// ─── Constants ─────────────────────────────────────────────────────────────────

const FEED_ALGO_VERSION = "1.2.0";
const { height, width } = Dimensions.get("window");
const PAGE_SIZE = 10;
const formatCommentCount = (count: number | undefined | null): string => {
    if (!count || isNaN(count)) return '0';
      if (count >= 1000000) {
          return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
            }
              if (count >= 1000) {
                  return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
                    }
                      return count.toString();
                      };
                const formatSocialCounter = (num: number): string => {
                    if (!num || isNaN(num)) return "0";
                      if (num >= 1000000) {
                          return (num / 1000000) % 1 === 0 ? `${(num / 1000000).toFixed(0)}m` : `${(num / 1000000).toFixed(1)}m`;
                            }
                              if (num >= 1000) {
                                  return (num / 1000) % 1 === 0 ? `${(num / 1000).toFixed(0)}k` : `${(num / 1000).toFixed(1)}k`;
                                    }
                                      return num.toString();
                                      };
                                const getRelativePostTimestamp = (timeInput: string | number): string => {
                                    if (!timeInput) return "now";
                                      const postDate = new Date(timeInput);
                                        const diffInSecs = Math.floor((Date.now() - postDate.getTime()) / 1000);

                                          if (diffInSecs < 60) return "now";
                                            
                                              const mins = Math.floor(diffInSecs / 60);
                                                if (mins < 60) return `${mins} mins`;
                                                  
                                                    const hours = Math.floor(mins / 60);
                                                      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
                                                        
                                                          const days = Math.floor(hours / 24);
                                                            if (days < 7) return `${days} day${days > 1 ? 's' : ''}`;
                                                              
                                                                const weeks = Math.floor(days / 7);
                                                                  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''}`;
                                                                    
                                                                      const months = Math.floor(days / 30);
                                                                        if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
                                                                          
                                                                            const years = Math.floor(months / 12);
                                                                              return `${years} year${years > 1 ? 's' : ''}`;
                                                                              };

                                    

                    




const ITEM_HEIGHT = height;

const REACTIONS = ["❤️", "🥺", "😎", "🔥", "👍", "👏", "😌", "😭", "😆", "🥱"];
const CATEGORY_EMOJI: Record<string, string> = {
  "Political/Governance": "🔴",
  "Sports": "🟠",
  "Health": "🟢",
  "Educational/Philosophical": "🔵",
  "Entertainment": "🌸",
  "Technological": "🟣",
  "Religious": "🕊️",
  "Development/Economics": "🟤",
  "Personal/Warm Touch": "💛",
  "Public Information": "🟦",
  "Sociocultural": "🎭",
    "Breaking News": "📰",
      "Love" : "❤️",

  "Others": "⚪",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const sanitizeAndCapitalizeCategory = (categoryStr: string): string => {
    if (!categoryStr) return "Others";
      
        return categoryStr
            .split("/")
                .map(part => 
                      part
                              .trim()
                                      .split(" ")
                                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                                      .join(" ")
                                                          )
                                                              .join("/");
                                                              };

                                                              const renderCategoryBadge = (post: any): string => {
                                                                if (!post) return "General Post ✨";

                                                                  // 1. Handle Custom "Others" Category typing
                                                                    if (post.category === "Others" || post.category === "Other") {
                                                                        const customText = post.customCategoryTitle || post.customCategory || "Custom Title";
                                                                            const capitalizedCustom = sanitizeAndCapitalizeCategory(customText);
                                                                                return `${capitalizedCustom} Post ⚪`;
                                                                                  }

                                                                                    // 2. Standardize casing (fixes 'Political/governance' -> 'Political/Governance')
                                                                                      const rawCategory = post.category || "Others";
                                                                                        const capitalizedNormal = sanitizeAndCapitalizeCategory(rawCategory);

                                                                                          // 3. Find your exact chosen emoji from above
                                                                                            const emoji = CATEGORY_EMOJI[capitalizedNormal] || "✨";

                                                                                              // Returns ONLY the clean text structure layout without secondary copies on the right side
                                                                                                return `${capitalizedNormal} Post ${emoji}`;
                                                                                                };


                
      
        
                      
                                
                                  

                                      
                                              

                                      
                                          
                                        
                                                    
                                                          
                                                          

                                                        
                                                            
                                                                  


                                                    



const verifiedBoost = (post: any): number => {
  return post.user?.isVerified ? 10 : 0;
};

const calculateTimeDecay = (createdAt: any): number => {
  const now = Date.now();
  const postTime = new Date(createdAt).getTime();
  const hoursOld = (now - postTime) / (1000 * 60 * 60);
  return Math.exp(-hoursOld / 24);
};

const calculateTrendingBoost = (
  post: any,
  postReactions: Record<string, Record<string, number>>
): number => {
  const reactions = Object.values(postReactions[post.id] || {}).reduce(
    (sum: number, val: any) => sum + val,
    0
  );
  const comments = post.commentsCount || 0;
  const shares = post.sharesCount || 0;
  const viewScore = (post.viewTime || 0) * 0.5;
  return reactions * 2 + comments * 3 + shares * 4 + viewScore;
};

const calculateAIScore = (post: any): number => {
  const watchTime = post.watchTime || 0;
  const completionRate = post.completionRate || 0;
  return watchTime * 0.5 + completionRate * 2;
};

// ── [FEATURE 1] Velocity ranking — viral detection ────────────────────────────
// Measures how fast engagement is accelerating in the last window vs. earlier.
// A post with rapidly growing reactions/comments is flagged as viral.
const calculateVelocityScore = (
  post: any,
  postReactions: Record<string, Record<string, number>>
): number => {
  const now = Date.now();
  const postTime = new Date(post.createdAt || post.timestamp || now).getTime();
  const ageMs = now - postTime;
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours <= 0) return 0;

  const reactions = Object.values(postReactions[post.id] || {}).reduce(
    (sum: number, val: any) => sum + val,
    0
  );
  const comments = post.commentsCount || 0;
  const shares = post.sharesCount || 0;
  const totalEngagement = reactions + comments * 2 + shares * 3;

  // Engagement per hour — newer posts with the same engagement score higher
  const engagementRate = totalEngagement / Math.max(ageHours, 0.5);

  // Velocity boost: square-root curve so runaway viral posts don't dominate
  return Math.sqrt(engagementRate) * 5;
};

// ── [FEATURE 2] User-interest AI ranking ─────────────────────────────────────
// Looks at categories and users that the current viewer has engaged with most
// (tracked in userInterestMap) and rewards posts that match those interests.
const calculateUserInterestScore = (
  post: any,
  userInterestMap: Record<string, number>
): number => {
  const categoryKey = `cat:${post.category || "Other"}`;
  const authorKey = `author:${post.user?.id || post.user?.name || ""}`;

  const categoryInterest = userInterestMap[categoryKey] || 0;
  const authorInterest = userInterestMap[authorKey] || 0;

  // Normalise: cap at 20 so a single super-liked category doesn't dominate
  return Math.min(categoryInterest * 3 + authorInterest * 5, 20);
};

// ── [FEATURE 3] Cold-start boost for new posts ────────────────────────────────
// Posts younger than 1 hour get a temporary lift so they surface before they
// have accumulated engagement. The boost fades linearly over 60 minutes.
const calculateColdStartBoost = (post: any): number => {
  const now = Date.now();
  const postTime = new Date(post.createdAt || post.timestamp || now).getTime();
  const ageMinutes = (now - postTime) / (1000 * 60);

  if (ageMinutes > 60) return 0;

  // Maximum +15 for brand-new posts, decaying to 0 at 60 min
  return 15 * (1 - ageMinutes / 60);
};

// ── [FEATURE 4] Anti-spam suppression ────────────────────────────────────────
// Detects suspicious patterns: very high reaction count with zero comments/shares
// (bot-style inflation) or posts flagged with a spamScore by the backend.
const calculateSpamPenalty = (
  post: any,
  postReactions: Record<string, Record<string, number>>
): number => {
  // Backend-provided spam flag
  if (post.spamScore && post.spamScore > 0.7) return -30;

  const reactions = Object.values(postReactions[post.id] || {}).reduce(
    (sum: number, val: any) => sum + val,
    0
  );
  const comments = post.commentsCount || 0;
  const shares = post.sharesCount || 0;

  // Suspiciously high reactions with almost no comments or shares
  if (reactions > 500 && comments === 0 && shares === 0) return -20;

  // Repeat-poster suppression: many posts from same user in short time
  if (post.recentPostCount && post.recentPostCount > 10) return -10;

  return 0;
};

// ─── CommentItem ───────────────────────────────────────────────────────────────

const CommentItem = ({
  comment,
  depth = 0,
  onPin,
}: any) => {
  const [liked, setLiked] = useState(comment?.liked ?? false);
  const [likesCount, setLikesCount] = useState(comment?.likes ?? 0);
  const [collapsed, setCollapsed] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState(comment?.replies || []);

  // Ripple effect
  const ripple = useSharedValue(0);

  const triggerRipple = () => {
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 700 });
  };

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ripple.value * 2 }],
    opacity: 1 - ripple.value,
  }));

  // Physics-based depth indentation
  const depthAnim = useSharedValue(depth);
  useEffect(() => {
    depthAnim.value = withSpring(depth * 24, { damping: 10, stiffness: 120 });
  }, [depth]);

  const animatedIndent = useAnimatedStyle(() => ({
    marginLeft: depthAnim.value,
  }));

  // Pinned glow animation (using RN Animated for interpolate)
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (comment.isPinned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [comment.isPinned]);

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikesCount((prev: number) => prev + 1);
    }
  };

  const handleAddReply = () => {
    if (!replyText.trim()) return;

    const newReply = {
      id: Date.now().toString(),
      text: replyText,
      user: {
        name: "You",
        avatar: "https://i.pravatar.cc/100",
        isVerified: false,
      },
      likes: 0,
      liked: false,
      isPinned: false,
      replies: [],
    };

    setReplies((prev: any[]) => [...prev, newReply]);
    setReplyText("");
    setShowReplyInput(false);
    triggerRipple();
  };

  return (
    <View style={{ marginVertical: 8 }}>
      {depth > 0 && (
        <AnimatedSpringConnector height={replies.length * 70 + 60} />
      )}

      <AnimatedReanimated.View
        style={[
          animatedIndent,
          { flexDirection: "row", marginVertical: 8 },
          comment.isPinned && {
            borderColor: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["#ffcc00", "#ffaa00"],
            }) as any,
            borderWidth: 2,
            shadowColor: "#ffcc00",
            shadowOpacity: 0.8,
            shadowRadius: 10,
          },
        ]}
      >
        {/* Avatar column */}
        <View
          style={{ position: "relative", alignItems: "center", marginRight: 8 }}
        >
          {/* Ripple shockwave */}
          <AnimatedReanimated.View
            style={[
              {
                position: "absolute",
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,242,255,0.2)",
                top: -6,
                left: -6,
              },
              rippleStyle,
            ]}
          />

          {/* Elastic spring connector */}
          <AnimatedSpringConnector
            height={(replies.length + 1) * 80}
            verified={comment.user?.isVerified}
          />

          {/* Avatar */}
          <Image
            source={{
              uri: comment.user?.avatar || "https://i.pravatar.cc/100",
            }}
            style={styles.commentAvatar}
          />
        </View>

        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.commentUser}>{comment.user?.name}</Text>

          

            {comment.isPinned && (
              <Text style={{ color: "#ffcc00", marginLeft: 8 }}>📌</Text>
            )}
          </View>

        <Text style={[styles.commentText, { color: "#111111", fontSize: 13, fontWeight: "normal", opacity: 1 }]}>
            {comment && comment.text ? comment.text : ""}
            </Text>

              

          {/* Actions */}
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            

            <TouchableOpacity
              onPress={() => setShowReplyInput(!showReplyInput)}
            >
              <Text style={{ color: "#aaa", marginRight: 15 }}>
                Reply ({replies.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
              <Text style={{ color: "#aaa", marginRight: 15 }}>
                {collapsed ? "Expand" : "Collapse"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onPin(comment.id)}>
              <Text style={{ color: "#ffcc00" }}>Pin</Text>
            </TouchableOpacity>
          </View>

          {/* Reply input */}
          {showReplyInput && (
            <View style={{ flexDirection: "column", marginTop: 8, alignItems: "center" }}>
                <TextInput
                      value={replyText}
                            onChangeText={setReplyText}
                                  placeholder="Write reply..."
                                        placeholderTextColor="#aaa"
                                              style={{
                                                      width: "100%", 
                                                              height: 40,
                                                                      backgroundColor: "#222",
                                                                              color: "#fff",
                                                                                      paddingHorizontal: 15,
                                                                                              borderRadius: 20,
                                                                                                    }}
                                                                                                        />
                                                                                                            <TouchableOpacity 
                                                                                                                  onPress={handleAddReply}
                                                                                                                        style={{
                                                                                                                                marginTop: 8,
                                                                                                                                        paddingVertical: 6,
                                                                                                                                                paddingHorizontal: 16,
                                                                                                                                                      }}
                                                                                                                                                          >
                                                                                                                                                                <Text style={{ color: "#ff0050", fontWeight: "bold" }}>Send</Text>
                                                                                                                                                                    </TouchableOpacity>
                                                                                                                                                                      </View>
                                                                                                                                                                      )}


          {/* Recursive replies */}
          {!collapsed &&
            replies.map((reply: any) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                onPin={onPin}
              />
            ))}
        </View>

      </AnimatedReanimated.View>

    </View>
  );
};

// ─── PostItem ──────────────────────────────────────────────────────────────────

const PostItem = React.memo(({ item, isActive, onWatchTime,setActiveCommentPost, handleDonation, addFloatingDonation, setIsCommentModalVisible  }: any) => {
  const {
    boostPostRanking,
    editPost,
    deletePost,
    startLive,
    stopLive,
  } = usePosts();

  // ── State ────────────────────────────────────────────────────────────────────
  const [postReactions, setPostReactions] = useState<
    Record<string, Record<string, number>>
  >({});
  const [liked, setLiked] = useState(item?.liked ?? false);
  const [likesCount, setLikesCount] = useState(item?.likes ?? 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [payMenuVisible, setPayMenuVisible] = useState(false);
  const [localPaymentMethods, setLocalPaymentMethods] = useState<any[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState<boolean>(false);
const screenWidth = Dimensions.get('window').width;


  const [isSubscribed, setIsSubscribed] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [comments, setComments] = useState(item?.comments || []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);


  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(item?.text || "");

  // ── [FEATURE 5] Video completion tracking for  scrolling
  const [videoProgress, setVideoProgress] = useState(0);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const heartAnim = useRef(new Animated.Value(0)).current;
  const pinnedAnim = useRef(new Animated.Value(1)).current;
  const videoRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  //  NEW ACCURATE MEDIA DETECTOR
  // ─── SAFE MEDIA TYPE DISCRIMINATOR ───
  // Safely extract the full array of media URIs
      // 1. Always guarantee an actual array for multi-image grids to map over
           // 1. BULLETPROOF PARSER: Handles single URLs, JSON arrays, and Postgres curly-brace strings
               // 1. Force extraction of a clean array of URLs from whatever Supabase provides
                 // ——— Safe extraction mapping
                   const safeMediaUris = (() => {
                       if (!item || !item.mediaUris) return [];
                           if (Array.isArray(item.mediaUris)) return item.mediaUris;
                               if (typeof item.mediaUris === 'string') {
                                     let trimmed = item.mediaUris.trim();

                                                 // Clear out raw Postgres array characters
                                                       if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                                               trimmed = trimmed.substring(1, trimmed.length - 1);
                                                                       return trimmed.split(',').map((u: string) => u.replace(/["']/g, '').trim()).filter(Boolean);
                                                                             }

                                                                                         // Clear out raw JSON array string text lines
                                                                                               if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                                                                                       try {
                                                                                                                 const parsed = JSON.parse(trimmed);
                                                                                                                           return Array.isArray(parsed) ? parsed : [parsed];
                                                                                                                                   } catch {
                                                                                                                                             // JSON block parsing safe fallback
                                                                                                                                                     }
                                                                                                                                                           }

                                                                                                                                                                       return trimmed.split(',').map((u: string) => u.trim()).filter(Boolean);
                                                                                                                                                                           }
                                                                                                                                                                               return [];
                                                                                                                                                                                 })();

                                                                                                                                                                                   // Extract a single clean fallback target string out of index 0
                                                                                                                                                                                     const primaryMediaUrl = safeMediaUris.length > 0 ? String(safeMediaUris[0]).replace(/[\[\]\{\}\"\']/g, '').trim() : '';

                                                                                                                                                                                       // Safe runtime evaluation flag for expo video configuration layouts
                                                                                                                                                                                         const isVideo = typeof primaryMediaUrl === 'string' && primaryMediaUrl !== '' && 
                                                                                                                                                                                             (/\.(mp4|mov|m4v|3gp|webm|avi|mkv|m3u8)/i.test(primaryMediaUrl) || primaryMediaUrl.toLowerCase().includes('video'));

            
                         
                          
                        
                              
                                           
                                               
                                        
                                                
                                                               
                                                                
                                                                      
                                                                          
                                                                                    
                                                                                                 
                                                                                                       
                                                                                                    
                                                                                                          
                                                                                                                  
                                                                                                                            
                                                                                                                                            
                                                                                                                                                    
                                                                                                                                                                     
                                                                                                                                                                      
                                                                                                                                                                              
                                                                                                                                                                                                 
                                                                                                                                                                                                    
                                                                                                                                                                                                               
                                                                                                                                                                                                                     
                                                                                                                                                                                                                
                                                                                                                                                                                                                      
                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                            

                
                  
                
                    

                                        
                                      
                                            
                                                                
                                                                      

                                                                                   
                                                                                    
                                                                                        
                                                                                                    
                                                                                                              
                                                                                                                    
                                                                                                                              
                                                                                                                                               
                                                                                                                                                  

                                                                                                                                                  
                                                                                                                                                              
                                                                                                                                                                           
                                                                                                                                                                              
                                                                                                                                                            

                                                                                                                                                                              
                                                                                                                                                                  

                                                                                                                                                                                
                                                                                                                                                                              
                                                                                                                                                                                

            
                    
                  
                        
                            
                                            
                                              
                                                        
                                                                      
                                                                          
                                                                                          
                                                                                                
                                                                                        
                                                                                                          
                                                                                                          
                                                                                                          

                                                                                                      
                                                                                                          

                                                                                                           
                                                                                                                  

          
    
          
            
                  
                      
                                    
                                  
                                                      
                                                                
                                                              
                                                                                      
                                                                                            
                                                                                        
                                                                                                      
                                                                                                    
                                                                                                            

                                                                                                  
                                                                                                  

                                                                                                          
                                                                                                            
                                                                                                                

          
              
              
                          
                          
                                                      
                                                                       
                                                                           
                                                                                                
                                                                                                          
                                                                                                          

                                                                                                              
                                                                                                              
                                                                                                                
                                                                                                                        


                                                                                                                   
                                                                                                                    

  
          
            
                          
                                      
                                                  
                                                                
                                                                            
                                                                                        
                                                                                                          
                                                                                                                  
                                                                                                                              

                                                                                                                          
                                                                                                                                

                                                                                                                                
                                                                                                                                
                                                                                                                                


                
              
                          
                            
                                
                                
                          

                            
                        

                          
                        
                          
                                
                                
                                  
                                    
                                            



      

  
        
            
                          
                    
                                
                          
                            

                          

                        
                                        
                                                        
                                                                        
                                                                            
                                                                                              




  

  const sortedComments = [...comments].sort(
    (a, b) => Number(b.isPinned) - Number(a.isPinned)
  );

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Request media library permissions on mount
  // Request media library permissions on mount safely
  useEffect(() => {
    (async () => {
        if (!MediaLibrary) return; // Exit if on web or null
            const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow media access to download or share files."
        );
      }
    })();
  }, []);

  // Live timer
  useEffect(() => {
    let interval: any;
    if (item?.isLive) {
      setLiveSeconds(0);
      interval = setInterval(() => setLiveSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [item?.isLive]);

  // Pinned comment animation
  useEffect(() => {
    if (sortedComments[0]?.isPinned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pinnedAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pinnedAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [sortedComments]);

  // Scroll to top when first comment is pinned
  useEffect(() => {
    if (flatListRef.current && sortedComments[0]?.isPinned) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [sortedComments]);

  // Watch time tracking
  
  useEffect(() => {
    let interval: any;
      if (isActive && isVideo) {
          interval = setInterval(() => {
                setWatchTime((prev: any) => {
                        const currentNum = typeof prev === 'object' ? 0 : Number(prev || 0);
                                return currentNum + 1;
                                      });
                                          }, 1000);
                                            }
                                              return () => clearInterval(interval);
                                              }, [isActive, isVideo]);


  
  useEffect(() => {
    let interval: any;
      if (isActive && isVideo) {
          interval = setInterval(() => {
                setWatchTime((prev: any) => {
                        // Force the value to always be a safe number primitive
                                const currentNum = typeof prev === 'object' ? 0 : Number(prev || 0);
                                        return currentNum + 1;
                                              });
                                                  }, 1000);
                                                    }
                                                      return () => clearInterval(interval);
                                                      }, [isActive, isVideo]);

                                                      useEffect(() => {
                                                        // Extract number primitive to protect parental state components
                                                          const safeWatchTime = typeof watchTime === 'object' ? 0 : Number(watchTime || 0);
                                                            
                                                              if (safeWatchTime > 3) {
                                                                  onWatchTime?.(item.id, safeWatchTime);
                                                                      boostPostRanking?.(item.id, safeWatchTime);
                                                                        }
                                                                        }, [watchTime]);


  // Video play/pause based on active state
  useEffect(() => {
    if (videoRef.current && isVideo) {
        if (isActive) {
            // Catch asynchronous interruptions native to web view rendering components
                videoRef.current.playAsync().catch((err: any) => {
                      console.log("Video playback safely deferred:", err.message);
                          });
                            } else {
                                videoRef.current.pauseAsync().catch(() => {});
                                  }
                                  }

    
  }, [isActive]);
  const handleTogglePayMenu = async () => {
      if (payMenuVisible) {
          setPayMenuVisible(false);
              return;
                }

                  setPayMenuVisible(true);
                    setIsLoadingMethods(true);

                      try {
                          
                              const response = await fetch("https://jywoururkjaszyfrfqnd.supabase.co");
                                  const data = await response.json();

                                      if (data.success && data.methods) {
                                            setLocalPaymentMethods(data.methods);
                                                } else {
                                                      // Fallback default if backend fails
                                                            setLocalPaymentMethods([{ id: 'card', name: 'Bank Card' }]);
                                                                }
                                                                  } catch (error) {
                                                                      console.error("Error fetching local payment rails:", error);
                                                                          setLocalPaymentMethods([{ id: 'card', name: 'Bank Card' }]);
                                                                            } finally {
                                                                                setIsLoadingMethods(false);
                                                                                  }
                                                                                  };

  

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleReact = (postId: string, emoji: string) => {
    setPostReactions((prev) => {
      const current = prev[postId] || {};
      const alreadyReacted = current[emoji] && current[emoji] > 0;
      return {
        ...prev,
        [postId]: {
          ...current,
          [emoji]: alreadyReacted ? 0 : (current[emoji] || 0) + 1,
        },
      };
    });
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikesCount((prev: number) => prev + 1);
    }
    heartAnim.setValue(0);
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLongPress = () => {
    Alert.alert("Post Options", "Choose an action", [
      { text: "Edit", onPress: () => setEditing(true) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePost?.(item.id),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePin = (commentId: string) => {
    setComments((prev: any[]) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, isPinned: !c.isPinned } : c
      )
    );
  };

  const handleFollow = () => setIsFollowing(!isFollowing);

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    if (!isSubscribed) boostPostRanking?.(item.id, 50);
  };

  const handleMpesaPayment = () =>
    Alert.alert("MPESA Payment", "Initiating STK Push...");

  const handleStripePayment = () =>
    Alert.alert("Stripe Payment", "Redirecting to Stripe Checkout...");

  const handleGoLive = () => {
    if (item?.isLive) stopLive?.(item.id);
    else startLive?.(item.id);
  };

  const getLocalFileUri = (uri: string) => {
    const sanitizedUri = uri.split("?")[0];
    const fallbackName = `media-${Date.now()}.bin`;
    const filename = sanitizedUri.split("/").pop() || fallbackName;
    // Use cacheDirectory (or documentDirectory) as a writable base directory for downloads
    // cast to any because expo-file-system types may differ across SDK versions
    const baseDirectory = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? "";
    return `${baseDirectory}${filename}`;
  };

const handleDownload = async () => {
    try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                  Alert.alert("Storage Permission Required", "We need storage access permissions to download this post asset.");
                        return;
                            }

                                // Matches your exact data field array mapping
                                    const mediaUrl = Array.isArray(item.mediaUris) ? item.mediaUris[0] : item.mediaUris;
                                        if (!mediaUrl) {
                                              Alert.alert("Unavailable", "No downloadable media was discovered on this post card.");
                                                    return;
                                                        }

                                                            const fileExt = isVideo ? '.mp4' : '.jpg';
                                                            const baseDir = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
                                                            const localUri = baseDir + "download_" + Date.now() + fileExt;
                                                                

                                                                    Alert.alert("Downloading", "Saving media file to storage gallery rolls...");
                                                                        
                                                                            // Fixed: This removes the deprecated getInfoAsync call entirely
                                                                                const result = await FileSystem.downloadAsync(mediaUrl, localUri);

                                                                                    if (result.status === 200) {
                                                                                          await MediaLibrary.createAssetAsync(result.uri);
                                                                                                Alert.alert("Success", "Media saved directly to your phone storage gallery!");
                                                                                                    } else {
                                                                                                          throw new Error(`Media download stream terminated with status code: ${result.status}`);
                                                                                                              }
                                                                                                                } catch (err: any) {
                                                                                                                    console.error("Download Error log trace details:", err);
                                                                                                                        Alert.alert("Download Interrupted", err.message || "An issue occurred while writing file system buffer streams.");
                                                                                                                          }
                                                                                                                          };



  const handleShare = async () => {
      try {
          // 1. Internal App Sharing log indicator
              console.log(`Processing Internal share action for item: ${item.id}`);

                  // Matches your exact code data field array mapping
                      const mediaUrl = Array.isArray(item.mediaUris) ? item.mediaUris[0] : item.mediaUris;
                          
                              // Fallback share behavior for text-only posts
                                  if (!mediaUrl) {
                                        if (await Sharing.isAvailableAsync()) {
                                                Alert.alert("Share Content", item.text || "Check out this app post!");
                                                        return;
                                                              }
                                                                  }

                                                                      // 2. Download asset data locally first to hand off to mobile share sheets
                                                                          const fileExt = isVideo ? '.mp4' : '.jpg';
                                                                              const cacheBase = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? '';
                                                                              const tempCachePath = `${cacheBase}share_${Date.now()}${fileExt}`;
                                                                                  
                                                                                      const result = await FileSystem.downloadAsync(mediaUrl, tempCachePath);
                                                                                          
                                                                                              if (result.uri && (await Sharing.isAvailableAsync())) {
                                                                                                    await Sharing.shareAsync(result.uri, {
                                                                                                            dialogTitle: `Share post from ${item.user?.name || 'User'}`,
                                                                                                                    mimeType: isVideo ? 'video/mp4' : 'image/jpeg'
                                                                                                                          });
                                                                                                                              } else {
                                                                                                                                    Alert.alert("Unsupported System", "Native sharing channels are not available on this device environment.");
                                                                                                                                        }
                                                                                                                                          } catch (err) {
                                                                                                                                              console.error("Sharing handler error logging detail context:", err);
                                                                                                                                                }
                                                                                                                                                };

  

const handleSendReply = (replyMessage?: string) => {
    const message = (replyMessage ?? replyText).trim();
      if (!message || !item) return;

        const newComment = {
            id: Date.now().toString(),
                username: "You",
                    text: message,
                        content: message,
                            user: { name: "You" },
                                likes: 0,
                                    liked: false,
                                        isPinned: false,
                                            replies: [],
                                              };

                                                // 1. Calculate the new up-to-date list of comments
                                                  const updatedComments = [...(item.comments || []), newComment];
                                                    
                                                      // 2. Update the modal view state so it shows up on the screen immediately
                                                        if (typeof setActiveCommentPost === 'function') setActiveCommentPost({

                                                        
                                                            ...item,
                                                                comments: updatedComments,
                                                                    commentCount: updatedComments.length
                                                                      });
                                                                        
                                                                          // 3. Update the standalone local comments array if your code uses it
                                                                            if (typeof setComments === 'function') {
                                                                                setComments(updatedComments);
                                                                                  }
                                                                                    
                                                                                      setReplyText("");

                                                                                        // 4. THE MAGIC LINK: Forcefully inject the new comment into the main posts state array
                                                                                          const postId = item.id;

                                                                                            if (item) {
                                                                                                item.comments = updatedComments;
                                                                                                  item.commentCount = updatedComments.length;
                                                                                                  

                                                                                            
                                                                                          
                                                                                            

                                                                                                
                                                                                              
                                                                                                            
                                                                                                        
                                                                                                                      
                                                                                                                                
                                                                                                                                              
                                                                                                                                               
                                                                                                                                                                
                                                                                                                                                                                            };
                                                                                                                                                                                                    }
                                                                                                                                                                                                            
                                                                                                                                                                                                              
                                                                                                                                                                                                                    
                                                                                                                                                                                                                        
                                                                                                                                                                                                                        




  const handleWatchTime = (postId: string, seconds: number) => {
    onWatchTime?.(postId, seconds);
  };

  // ── [FEATURE 5] Video playback status handler for progress bar ───────────────
  const handleVideoPlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.durationMillis && status.durationMillis > 0) {
      const progress =
        (status.positionMillis || 0) / status.durationMillis;
      setVideoProgress(progress);
    }
  };

  

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.postCard, { height: ITEM_HEIGHT }]}>
      {/* Author + category label */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
        <Image
          source={{ uri: item.user?.avatar || "https://i.pravatar.cc/100" }}
          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
                  {/* Re-arranged layout structure to allow name and time to stack vertically */}
                            <View style={{ paddingHorizontal: 4, flexDirection: 'column' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                      <Text style={{ fontWeight: "bold", fontSize: 14, color: "#000" }}>
                                                                      {item.user?.name ?? "Unknown"}:{" "}
                                                                                    </Text>
                                                                                                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>
                                                                                                                  {renderCategoryBadge(item)}
                                                                                                                                </Text>
                                                                                                                                            </View>
                                                                                                                                                        
                                                                                                                                                                    {/* Surgical Insert: Your dynamic relative timestamp element directly underneath */}
                                                                                                                                                                                <Text style={{ fontSize: 11, color: "#888", marginTop: 2, fontWeight: "400" }}>
                                                                                                                                                                                              {getRelativePostTimestamp(item.created_at || item.timestamp)}
                                                                                                                                                                                                          </Text>
                                                                                                                                                                                                                    </View>



          {/* Category badge */}
          <View
            style={{
              backgroundColor:
                Object.values(CATEGORIES).find(
                  (c: any) => c.label === item.category
                )?.color || "#888",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginLeft: 4,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
              {item.category === "Other"
                ? `${item.otherCategoryText || "others"} Post`
                : `${item.category} Post`}
            </Text>
          </View>
        </View>
      </View>
      {/* Post text words with high contrast display visibility rule */}
            {!editing && (
                      <Text style={[styles.postText, { color: '#000', fontSize: 16, fontWeight: '500', paddingHorizontal: 15, marginVertical: 8 }]}>
                                    {typeof item?.text === 'object' ? String(JSON.stringify(item.text)) : (item?.text || "")}
                                                    </Text>
                                                              )}

      {/* Media + text area */}
    <TouchableWithoutFeedback onPress={handleDoubleTap} onLongPress={handleLongPress}>
        <View style={{ flex: 1 }}>
            
                {/* 🎥 VIDEO LANE: Render only if explicitly flagged as video */}
                   {isVideo && safeMediaUris.length > 0 && (

                   
                          
                             <TouchableWithoutFeedback
                             onPress={async () => {
                                // Only trigger video playback actions if it is explicitly a video post
                                  if (isVideo && videoRef.current && typeof videoRef.current.getStatusAsync === 'function') {
                                      try {
                                            const status = await videoRef.current.getStatusAsync();
                                                  if (status && 'isPlaying' in status) {
                                                          if (status.isPlaying) {
                                                                    await videoRef.current.pauseAsync();
                                                                            } else {
                                                                                      await videoRef.current.playAsync();
                                                                                              }
                                                                                                    }
                                                                                                        } catch (videoError) {
                                                                                                              console.log("Guarded video interaction check deferred:", videoError);
                                                                                                                  }
                                                                                                                    } else if (!isVideo) {
                                                                                                                        // Treat as a photo post action: open the full screen image modal view
                                                                                                                            if (typeof handleDoubleTap === 'function') {
                                                                                                                                  handleDoubleTap(); 
                                                                                                                                      }
                                                                                                                                        }
                                                                                                                                        }}

                                 
                                  
                                        
                                                               
                                                                        
                                                                                        
                                                                                          
                                                                                                        
                                                                                                                               
                                                                                                                                        
                                                                                                                                              
                                                                                                                                                  
                                                                                                                                                           >
                                                                                                                                                                 <Video
                                                                                                                                                                         ref={videoRef}
                                                                                                                                                                               source={{ uri: primaryMediaUrl }}
                                                                                                                                                                                 
                                                                                                                                                                                         style={styles.fullScreenVideo}
                                                                                                                                                                                                 resizeMode={ResizeMode.COVER}
                                                                                                                                                                                                         isLooping
                                                                                                                                                                                                                 onPlaybackStatusUpdate={() => {}}
                                                                                                                                                                                                                       />
                                                                                                                                                                                                                           </TouchableWithoutFeedback>
                                                                                                                                                                                                                           )}

                                    
                                                  
                                                
                                                                
                                                                
                                                                                    

                                                                                        {/* 🖼️ IMAGE LANE: Render only if NOT a video */}
                                                                                           {(() => {
                                                                                           // Robust multi-format array parser
                                                                                             

                                                                                          
                                                                                        
                                                                                    
                                                                                        
                                                                                    
                                                                                        
                                                                                            
                                                                                    
                                                                                            const splitUris = Array.isArray(safeMediaUris) ? safeMediaUris : [];
                                                                                            const totalCount = splitUris.length;
                                                                                            const visibleImages = isExpanded ? splitUris : splitUris.slice(0, 4);
                                                                                            const remainingCount = totalCount - 4;
                                                                                            
                                                                                          
                                                                                            
                                                                                        
                                                                                    

                                                                                           
                                                                                            
                                                                                            
                                                                                        
                                                                                                     
                                                                                                      
                                                                                                      
                                                                                                                   
                                                                                                          
                                                                                                                         
                                                                                                                        
                                                                                                                    

                                                                                                                        
                                                                                                                  
                                                                                                                           
                                                                                             
                                                                                          
                                                                                        
                                                                                        
                                                                                                  
                                                                                                            

                                                                                                      
                                                                                                    

                                                                                                  

                                                                                                               return !isExpanded ? (
                                                                                                                  <View 
                                                                                                                      style={{
                                                                                                                            width: '100%',
                                                                                                                                  padding: 2,
                                                                                                                                        backgroundColor: '#fff',
                                                                                                                                              alignSelf: 'stretch',
                                                                                                                                                  }}
                                                                                                                                                    >
                                                                                                                                                        <View 
                                                                                                                                                              style={{
                                                                                                                                                                      flexDirection: 'row',
                                                                                                                                                                              flexWrap: 'wrap',
                                                                                                                                                                                      justifyContent: 'space-between',
                                                                                                                                                                                              width: '100%',
                                                                                                                                                                                                    }}
                                                                                                                                                                                                        >
                                                                                                                                                                                                              {visibleImages && visibleImages.map((photoUrl: any, index: number) => {
                                                                                                                                                                                                                      let itemLayout: any = { width: '49.5%', height: 140, marginBottom: 4, position: 'relative' };

                                                                                                                                                                                                                              if (totalCount === 1) {
                                                                                                                                                                                                                                        itemLayout = { width: '100%', height: 350 };
                                                                                                                                                                                                                                                } else if (totalCount === 2) {
                                                                                                                                                                                                                                                          itemLayout = { width: '49.5%', height: 250 };
                                                                                                                                                                                                                                                                  } else if (totalCount === 3 && index === 0) {
                                                                                                                                                                                                                                                                            itemLayout = { width: '100%', height: 220, marginBottom: 4 };
                                                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                                                            const isLastVisibleItem = index === 3 && remainingCount > 0;

                                                                                                                                                                                                                                                                                                    return (
                                                                                                                                                                                                                                                                                                              <TouchableOpacity
                                                                                                                                                                                                                                                                                                                          key={index}
                                                                                                                                                                                                                                                                                                                                      style={itemLayout}
                                                                                                                                                                                                                                                                                                                                                  activeOpacity={0.9}
                                                                                                                                                                                                                                                                                                                                                              onPress={() => {
                                                                                                                                                                                                                                                                                                                                                                            setIsExpanded(true); 
                                                                                                                                                                                                                                                                                                                                                                                        }}
                                                                                                                                                                                                                                                                                                                                                                                                  >
                                                                                                                                                                                                                                                                                                                                                                                                    return (
                                                                                                                                                                                                                                                                                                                                                                                                              <Image 
                                                                                                                                                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                                                                                                                                                                                               source={{ 
                                                                                                                                                                                                                                                                                                                                                                                                                                               uri: (() => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                 if (!photoUrl) return 'https://placeholder.com';
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   return String(photoUrl).replace(/[\[\]\{\}\"\']/g, '').trim();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   })()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 }} 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               style={[styles.gridImage, { width: '100%', height: '100%' }]} 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             resizeMode="cover"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   );
                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                {isLastVisibleItem && (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <View 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              style={{
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                position: 'absolute',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  top: 0,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    left: 0,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      right: 0,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        bottom: 0,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            justifyContent: 'center',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              alignItems: 'center',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                borderRadius: 4,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              >
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                +{remainingCount} View more
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </Text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </TouchableOpacity>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  })}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ) : (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <ScrollView 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              style={styles.imageScrollContainer}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  contentContainerStyle={styles.imageScrollContent}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      showsVerticalScrollIndicator={true}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        >
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            {splitUris && splitUris.map((photoUrl: any, index: number) => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  const cleanUrl = typeof photoUrl === 'string' ? photoUrl.trim().replace(/^"|"$/g, '') : '';
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        if (!cleanUrl) return null;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              return (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Image 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                key={index}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          source={{ uri: cleanUrl }} 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    style={styles.scrollableImageItem}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              resizeMode="contain"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                })}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </ScrollView>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

                                                                                                                   
                                                                                                                
                                                                                                                    
                                                                                                                        
                                                                                                                              
                                                                                                                                  
                                                                                                                                          
                                                                                                                                            
                                                                                                                                                      
                                                                                                                                                          
                                                                                                                                                        
                                                                                                                                                            
                                                                                                                                                                      
                                                                                                                                                                              
                                                                                                                                                                                
                                                                                                                                                                                            
                                                                                                                                                                                                        
                                                                                                                                                                                                              
                                                                                                                                                                                                              
                                                                                                                                                                                                                

                                                                                                                                                                                                                
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

                                                                                                                          
                                                                                                                              
                                                                                                                                        
                                                                                                                                                    
                                                                                                                                                                              
                                                                                                                                                                                        
                                                                                                                                                                                            
                                                                                                                                                                                                            
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                          

  


  
      
          
              
                
                    
                                  
                                        
                                              
                                                              
                                                          
                                                                
                                                                  
                                                                      


                    
                                  
                                                  
                                                    
                                                                                  
                                                                                                      
                                                                                                                              
                                                                                                                      
                                                                                                                    
                                                                                                                          
                                                                                                                            
                                                                                                                                

                                                                                                                                                  
                                                                                                                                                                                     
                                                                                                                                                                                                      
                                                                                                                                                                                                            

                                                                                                                                
                                                                                                                                                                                                                                                                                       
                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         })()}                     
                                                                
                                                                                                      
                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                  

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
            
                    
                  
                            
                                                  
                                                    
                                                              
                                                                  
                                                                                    
                                                                                              

                                                                                                

                                                                                                                    
                                                                                                                              
                                                                                                                                              
                                                                                                                                                        
                                                                                                                                                                        
                                                                                                                                                                                        
                                                                                                                                                                                              
                                                                                                                                                                                                                  
                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

                                                                                                                                           
                                                                                                                                                          
                                                                                                                                                                
                                                                                                                                                                                    
                                                                                                                                                                                        
                                                                                                                                                                                                          
                                                                                                                                                                                                                              
                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                

                    

                                                        
                                                        

      

      


          {/* Edit mode */}
          {editing && (
            <View style={{ padding: 10 }}>
              <TextInput
                value={editedText}
                onChangeText={setEditedText}
                style={{
                  color: "#fff",
                  backgroundColor: "#222",
                  padding: 10,
                  borderRadius: 10,
                }}
                multiline
              />
            </View>
          )}

          {/* Heart overlay (double-tap animation) */}
          <Animated.View
            style={[
              styles.heartOverlay,
              {
                opacity: heartAnim,
                transform: [
                  {
                    scale: heartAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={{ fontSize: 80, color: "white" }}>❤️</Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/*  Video progress bar at bottom of card */}
      {isVideo && (
        <View style={styles.videoProgressContainer}>
          <View
            style={[
              styles.videoProgressBar,
              { width: `${Math.round(videoProgress * 100)}%` },
            ]}
          />
        </View>
      )}

      {/* Right side action bar */}
      <View style={styles.rightOverlay}>
        {item?.user?.isVerified && (
          <Text style={styles.verifiedBadge}>✔</Text>
        )}

        {/* Follow button */}
        <TouchableOpacity
          style={[
            styles.followButton,
            { backgroundColor: isFollowing ? "#444" : "#ff0050" },
          ]}
          onPress={handleFollow}
        >
          <Text style={{ color: "#fff", fontSize: 12 }}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity
          style={styles.iconButton}
            onPress={() => {
                setLiked(!liked);
                   setLikesCount((prev: number) =>
                   liked ? prev - 1 : prev + 1);
                        handleReact(item.id, "❤️");
                          }}
                          >
                            <Text style={styles.iconText}>{liked ? "❤️" : "🤍"}</Text>
                              <Text style={[styles.countText, { color: '#000', fontWeight: 'bold', textShadowColor: '#fff', textShadowRadius: 2 }]}>
                                {formatSocialCounter(likesCount)}
                                  </Text>
                              </TouchableOpacity>


      {/* Comment toggle */}
      <TouchableOpacity
        style={styles.iconButton}
          onPress={() => {
                setActiveCommentPost(item);
                    
                        // Explicitly pass this post's existing comments to the modal state
                            if (typeof setComments === 'function') {
                                  setComments(item.comments || []);
                                      }
                                          
                                              if (typeof setIsCommentModalVisible === 'function') {
                                                    setIsCommentModalVisible(true);
                                                        }
                                                          }}
                                                          >
           
                      <Text style={styles.iconText}>💬</Text>
                        <Text style={[styles.countText, { color: '#000', fontWeight: 'bold' }]}>
                            {formatCommentCount(item.comments && item.comments.length > 0 ? item.comments.length : item.commentCount || 0)}

                              </Text>
                              </TouchableOpacity>



        {/* Share */}
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <Text style={styles.iconText}>📤</Text>
          <Text style={styles.countText}>Share</Text>
        </TouchableOpacity>

        {/* Download */}
        <TouchableOpacity style={styles.iconButton} onPress={handleDownload}>
          <Text style={styles.iconText}>⬇️</Text>
          <Text style={styles.countText}>Save</Text>
        </TouchableOpacity>

        {/* Pay dropdown */}
        {/* Unified Expandable Support Button & Menu */}
        {/* Unified Expandable Support Button & Menu */}
                <View style={{ alignItems: "center", position: "relative" }}>
                      

                            
                        
                              <TouchableOpacity
                                style={[styles.iconButton, { minHeight: 50, justifyContent: 'center' }]}
                                  onPress={handleTogglePayMenu}
                                  >

                                <Text style={styles.iconText}>💰</Text>
                                  <Text style={[styles.countText, { textAlign: 'center', width: 60 }]}>Support</Text>
                                  </TouchableOpacity>
                                 {payMenuVisible && (
                                    <View style={[styles.payDropdown, { bottom: 50, right: 10, width: 140 }]}>
                                        {isLoadingMethods ? (
                                              // Display standard loading indicator while querying country rails
                                                    <ActivityIndicator size="small" color="#ffffff" style={{ padding: 10 }} />
                                                        ) : localPaymentMethods.length === 0 ? (
                                                              // Emergency fallback component if list returns empty
                                                                    <TouchableOpacity onPress={() => handleDonation("card", 50)}>
                                                                            <Text style={styles.payOption}>Bank Card</Text>
                                                                                  </TouchableOpacity>
                                                                                      ) : (
                                                                                            //  Loop through only the valid options returned by Paystack
                                                                                                  localPaymentMethods.map((method) => (
                                                                                                          <TouchableOpacity
                                                                                                                    key={method.id}
                                                                                                                              onPress={() => handleDonation(method.id, 50)} // Passes 'mpesa', 'card', or 'applepay'
                                                                                                                                      >
                                                                                                                                                <Text style={styles.payOption}>{method.name}</Text> 
                                                                                                                                                        </TouchableOpacity>
                                                                                                                                                              ))
                                                                                                                                                                  )}
                                                                                                                                                                    </View>
                                                                                                                                                                    )}

                                 
                                      
                                              
                                                            
                                                              
                                                                      
                                                                              
                                                                                  
                                                                            
                                                                                          
                                                                                                        
                                                                                                              
                                                                                                                      
                                                                                                                                    
                                                                                                                                        
                                                                                                                                                  
                                                                                                                                                        
                                                                                                                                                            
                                                                                                                                                                  
                                                                                                                                                              

                                  

                                
                                                
                                                            
                                                                    
                                                                                    
                                                                                      

                                          
                                                                                                                    
                                                                                                                              
                                                                                                                                                
                                                                                                                                                                
                                                                                                                                                                        
                                                                                                                                                                                  
                                                                                                                                                                                                  
                                                                                                                                                                                                                      
                                                                                                                                                                                                                                
                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                      

                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                          

                    
                
                      
                          

                  
                      
                                
                                        
                                              
                                                      
                                                        
                                                                  
                                                                          
                                                                                  
                                                                                            
                                                                                                    
                                                                                                            
                                                                                                                  
                                                                                                                          
                                                                                                                              
                                                                                                                                      
                                                                                                                                            
                                                                                                                                                  
                                                                                                                                                          
                                                                                                                                                                  
                                                                                                                                                                          
                                                                                                                                                                                  
                                                                                                                                                                            
                                                                                                                                                                                    

</View>
        
      </View>

      {/* Bottom info overlay */}
      <View style={styles.overlayInfo}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          {item?.user?.name}
        </Text>
        {item?.user?.isVerified && (
          <Text style={styles.verifiedBadge}>✔</Text>
        )}
        {item?.isLive && (
          <Text style={styles.goLiveTimerText}>🔴 LIVE {liveSeconds}s</Text>
        )}
      <Text style={{ color: "#fff", fontSize: 12, marginTop: 2 }}>
          {typeof watchTime === 'number' ? watchTime : 0} watched
          </Text>
      </View>

      {/* Reaction buttons */}
      <View style={{ flexDirection: "row", marginTop: 8, flexWrap: "wrap" }}>
        {REACTIONS.map((emoji) => {
          const count = postReactions[item.id]?.[emoji] || 0;
          return (
            <TouchableOpacity
              key={emoji}
              onPress={() => handleReact(item.id, emoji)}
              style={{
                marginRight: 8,
                marginBottom: 4,
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 12,
                backgroundColor: count > 0 ? "#ffe0e0" : "transparent",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18, marginRight: 4 }}>{emoji}</Text>
              {count > 0 && (
                <Text style={{ fontSize: 14 }}>{formatSocialCounter(count)}</Text>

              )}
            </TouchableOpacity>
          );
        })}
      </View>
    {/* Active reactions summary */}
    {Object.values(postReactions[item.id] || {}).some((v) => v > 0) && (
      <Text style={{ marginTop: 4, fontSize: 14, color: "#555" }}>
          {Object.entries(postReactions[item.id] || {})
                .filter(([_, v]) => v > 0)
                      .map(([emoji]) => emoji)
                            .join(" ")}
                                {/* Surgical Add: This adds a space and the formatted total counter next to the emojis */}
                                    {"  " + formatSocialCounter(
                                          Object.values(postReactions[item.id] || {}).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
                                              )}
                                                </Text>
                                                )}


      {/* Comments section */}
          {/* 💬 Clean Action Bar Counter Only */}
              
                
                        
                              
                                          
                                              
                                              
                                                                      
                                                                            
                                                                              
                                                                                                        
                                                                                                                  
                                                                                                                          
                                                                                                                  
                                                                                                                        
                                                                                                                                                
                                                                                                                                                    
                                                                                                                                                              

        
                    
                        
                            
                                
                                            
                                              
                                                
                                                               
                                                          
                                                          
                                                            
                                                                                   
                                                                              
                                                                                               
                                                                                               
                                                                                               
                                                                                               
                                                                                               
                                                                                            

                                                                                               

        
               
              
                    
                          
                            
                                          
                                               
                                            
                                                 
                                              
                                                
                                                          
                                                            
                                                            
                                                                
                                                                    
                                                                                
                                                                                
                                                                                                
                                                                                                         
                                                                                                    
                                                                                                        
                                                                                                              
                                                                                                            
                                                                                                                  
                                                                                                                         
                                                                                                                            
                                                                                                                                      
                                                                                                                                              
                                                                                                                                                           
                                                                                                                                                            
                                                                                                                                                                 
                                                                                                                                                        
                                                                                                                                                              
                                                                                                                                                                  
                                                                                                                                                                       <Modal
                                                                                                                                                                           visible={fullscreenVisible}
                                                                                                                                                                               transparent={false}
                                                                                                                                                                                   animationType="fade"
                                                                                                                                                                                       onRequestClose={() => setFullscreenVisible(false)}
                                                                                                                                                                                         >
                                                                                                                                                                                             <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
                                                                                                                                                                                                   
                                                                                                                                                                                                         {/* Floating top close window action */}
                                                                                                                                                                                                               <TouchableOpacity 
                                                                                                                                                                                                                       style={{ position: 'absolute', top: 50, right: 25, zIndex: 10, padding: 10 }}
                                                                                                                                                                                                                               onPress={() => setFullscreenVisible(false)}
                                                                                                                                                                                                                                     >
                                                                                                                                                                                                                                             <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✕ Close</Text>
                                                                                                                                                                                                                                                   </TouchableOpacity>

                                                                                                                                                                                                                                                         {/* Horizontal full-screen paging list reader */}
                                                                                                                                                                                                                                                               <FlatList
                                                                                                                                                                                                                                                                       data={item.mediaUris}
                                                                                                                                                                                                                                                                               horizontal
                                                                                                                                                                                                                                                                                       pagingEnabled
                                                                                                                                                                                                                                                                                               initialScrollIndex={selectedImageIndex}
                                                                                                                                                                                                                                                                                                       getItemLayout={(data, index) => ({
                                                                                                                                                                                                                                                                                                                 length: screenWidth,
                                                                                                                                                                                                                                                                                                                           offset: screenWidth * index,
                                                                                                                                                                                                                                                                                                                                     index,
                                                                                                                                                                                                                                                                                                                                             })}
                                                                                                                                                                                                                                                                                                                                                     showsHorizontalScrollIndicator={false}
                                                                                                                                                                                                                                                                                                                                                             keyExtractor={(url, index) => index.toString()}
                                                                                                                                                                                                                                                                                                                                                                     renderItem={({ item: photoUrl }) => (
                                                                                                                                                                                                                                                                                                                                                                               <View style={{ width: screenWidth, height: '100%', justifyContent: 'center', backgroundColor: '#000' }}>
                                                                                                                                                                                                                                                                                                                                                                                           <Image 
                                                                                                                                                                                                                                                                                                                                                                                                         source={{ uri: photoUrl }} 
                                                                                                                                                                                                                                                                                                                                                                                                                       style={{ width: '100%', height: '75%' }} 
                                                                                                                                                                                                                                                                                                                                                                                                                                     resizeMode="contain" 
                                                                                                                                                                                                                                                                                                                                                                                                                                                 />
                                                                                                                                                                                                                                                                                                                                                                                                                                                           </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                   )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                         />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     </Modal>
                                                                                                                                                                       
                                              
                                                      
                                                              
                                                                  
                                                                        
                                                                    
                                                                                           
                                                                                            
                                                                                              
                                                                                        
                                                                                              
                                                                                                        
                                                                                                          
                                                                                                                  
                                                                                                                
                                                                                                                              
                                                                                                                                    
                                                                                                                              
                                                                                                                                                
                                                                                                                                                      

        
      
</View>
);
  });
    


// ─── FeedScreen ────────────────────────────────────────────────────────────────
export default function FeedScreen() {
  
  const [posts, setPosts] = useState<any[]>([]);
  const { rankedPosts = [], editPost, isLoading, fetchPosts } = usePosts();




      // --- Constants & System Settings ---
        const streamerId = "STREAM01";
          const PLATFORM_CUT = 0.2;

            // --- Payment, Leaderboard & Animation States ---
              const [popup, setPopup] = useState<string | null>(null);
                const [topFans, setTopFans] = useState<{ user: string; total: number }[]>([]);
                  const [floatingDonations, setFloatingDonations] = useState<
                      {
                            id: string;
                                  amount: number;
                                        method: string;
                                              user: string;
                                                    animatedValue: Animated.Value;
                                                        }[]
                                                          >([]);



                                                                    

              
                    
                        
                            

                                                            

                                                                // ── Feed state ───────────────────────────────────────────
                                                                                                                         useEffect(() => {
                                                                                                                                                                                                const syncSupabaseFeed = async () => {
                                                                                                                                                                                                                                                                        try {
                                                                                                                                                                                                                                                                                                                                                  const { data, error } = await supabase
                                                                                                                                                                                                                                                                                                                                                                                                                              .from("posts")
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          .select("*")
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      .order("id", { ascending: false });

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                if (error) throw error;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          const mappedPosts = data.map((post: any) => ({
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      id: post.id.toString(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  user: {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                id: post.user_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              name: post.user_name || "Dennis",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            avatar: post.user_avatar || "https://pravatar.cc",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          isVerified: post.is_verified || false,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      },
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  text: post.content,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              category: post.category || "Others",
  //  NEW CLEAN MULTI-MEDIA MAPPING
      mediaUris: (() => {
              const rawUrl = post.mediaUrl || post.media_url;
                    if (!rawUrl) return [];

                          // 1. If it's already an array, check if any element contains commas
                                if (Array.isArray(rawUrl)) {
                                        if (rawUrl.length === 1 && typeof rawUrl[0] === 'string' && rawUrl[0].includes(',')) {
                                                  return rawUrl[0].split(',').map(u => u.trim());
                                                          }
                                                                  return rawUrl;
                                                                        }

                                                                              // 2. If it's a JSON string array format (e.g. "['url1','url2']"), parse it
                                                                                    if (typeof rawUrl === 'string' && (rawUrl.startsWith('[') || rawUrl.startsWith('{'))) {
                                                                                            try {
                                                                                                      const parsed = JSON.parse(rawUrl);
                                                                                                                return Array.isArray(parsed) ? parsed : [parsed];
                                                                                                                        } catch (e) {
                                                                                                                                  // Fall through if parsing fails
                                                                                                                                          }
                                                                                                                                                }

                                                                                                                                                      // 3. If it's a single string with commas, split it into separate links
                                                                                                                                                            if (typeof rawUrl === 'string') {
                                                                                                                                                                    return rawUrl.includes(',') 
                                                                                                                                                                              ? rawUrl.split(',').map(u => u.trim()).filter(Boolean) 
                                                                                                                                                                                        : [rawUrl];
                                                                                                                                                                                              }

                                                                                                                                                                                                    return [rawUrl];
                                                                                                                                                                                                        })(),

      
            

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      audioUris: post.audio_urls || [],
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  hashtags: post.hashtags || "",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              location: post.location || "Unknown Location",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          visibility: post.visibility || "public",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      likes: post.likes_count || 0,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  comments: post.comments || [],
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              createdAt: new Date(post.created_at || Date.now()).getTime(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        }));

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    if (setPosts) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      setPosts(mappedPosts);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                } catch (err: any) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          console.error("Supabase live feed loading error:", err.message);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        };

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              syncSupabaseFeed();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  }, []);

                                                                                                                         
                                                            



  // ── Feed state ────────────────────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
    const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
      const [activeCommentPost, setActiveCommentPost] = useState<any>(null);
        const [commentText, setCommentText] = useState("");
        const [replyText, setReplyText] = useState("");

  const [postReactions, setPostReactions] = useState<
    Record<string, Record<string, number>>
  >({});
  const [socketPosts, setSocketPosts] = useState<any[]>([]);

  // ── [FEATURE 2] User-interest map: tracks which categories/authors the user engages with ──
  const [userInterestMap, setUserInterestMap] = useState<Record<string, number>>({});

  // ── [FEATURE 5] Ref for the main TikTok-style FlatList ───────────────────────
  const mainFeedRef = useRef<FlatList>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 80 });
  const onViewRef = useRef(({ viewableItems }: any) => {
    viewableItems.forEach(({ item }: any) => {
      item.viewTime = (item.viewTime || 0) + 1;
    });
    if (viewableItems.length > 0) {
      setActivePostId(viewableItems[0].item.id);
    }
  });

  
                                                                                                    
                                                                                                                                          
                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                  

                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
  
                                    
                                        

                                            

                                      
                                                                      
                                                                            
                                                                                  
                                                                                      
                                                                                                
                                                                                                    
                                                                                                                
                                                                                                        
                                                                                                                          
                                                                                                                                                  
                                                                                                                                                        
                                                                                                                                                                  
                                                                                                                                                                      
                                                                                                                                                                                          
                                                                                                                                                                                          
                                                                                                                                                                                                            
                                                                                                                                                                                                            

                                                                                                                                                                                                            
                                                                                                                                                                                                              
                                                                                                                                                                                                                          
                
                                                                                                                                                                                                                                          


  // ── Floating donation animation ───────────────────────────────────────────────
  

  // ── Payment handlers ──────────────────────────────────────────────────────────
  

    // --- Floating donation animation ---
      const addFloatingDonation = (amount: number, method: string, user: string) => {
          const id = `${Date.now()}-${Math.random()}`;
              const newDonation = {
                    id,
                          amount,
                                method,
                                      user,
                                            animatedValue: new Animated.Value(0),
                                                };
                                                    setFloatingDonations((prev) => [...prev, newDonation]);

                                                        Animated.timing(newDonation.animatedValue, {
                                                              toValue: 1,
                                                                    duration: 3000,
                                                                          useNativeDriver: true,
                                                                              }).start(() => {
                                                                                    setFloatingDonations((prev) => prev.filter((d) => d.id !== id));
                                                                                        });
                                                                                          };

                                                                                            // --- Payment handlers ---
                                                                                             // --- Updated Payment Handlers for Paystack ---
                                                                                             const handleDonation = async (method: string, amount = 50) => {
                                                                                               try {
                                                                                                   const streamerAmount = amount * (1 - PLATFORM_CUT);
                                                                                                       const donorName = auth.currentUser?.displayName || "Anonymous";
                                                                                                           const donorEmail = auth.currentUser?.email || "anonymous@realdapp.com"; // 👈 Paystack requires an email parameter

                                                                                                               // Call your updated Supabase edge function processor route
                                                                                                                   const response = await fetch("https://jywoururkjaszyfrfqnd.supabase.co", {
                                                                                                                         method: "POST",
                                                                                                                               headers: {
                                                                                                                                       "Content-Type": "application/json",
                                                                                                                                             },
                                                                                                                                                   body: JSON.stringify({
                                                                                                                                                           amount: amount,
                                                                                                                                                                   currency: "usd", // Paystack will convert this to local options dynamically
                                                                                                                                                                           streamerId: streamerId,
                                                                                                                                                                                   method: method,
                                                                                                                                                                                           email: donorEmail // 👈 Inject the donor's email address safely
                                                                                                                                                                                                 })
                                                                                                                                                                                                     });

                                                                                                                                                                                                         const paymentResult = await response.json();

                                                                                                                                                                                                             if (!paymentResult.success || !paymentResult.checkoutUrl) {
                                                                                                                                                                                                                   throw new Error(paymentResult.error || "Payment initialization failed.");
                                                                                                                                                                                                                       }

                                                                                                                                                                                                                           // 🚀 THE MAGIC STEP: Open the dynamic global check-out window instantly
                                                                                                                                                                                                                               // Users in Kenya see M-Pesa; users in the US/UK see Card/Apple Pay!
                                                                                                                                                                                                                                   await Linking.openURL(paymentResult.checkoutUrl);

                                                                                                                                                                                                                                       // Optional: Keep your floating animation or display a message guiding them to the checkout
                                                                                                                                                                                                                                           setPopup(`Opening secure checkout window...`);
                                                                                                                                                                                                                                               setTimeout(() => setPopup(null), 6000);

                                                                                                                                                                                                                                                 } catch (err: any) {
                                                                                                                                                                                                                                                     Alert.alert("Payment Error", err.message);
                                                                                                                                                                                                                                                       }
                                                                                                                                                                                                                                                       };


                                                                                                    
                                                                                                    
                                                                                                        

                                                                                                                  
                                                                                                                        
                                                                                                                                         
                                                                                                                                          
                                                                                                                                                    
                                                                                                                                                                
                                                                                                                                                                  
                                                                                                                                                                                    
                                                                                                                                                                                      
                                                                                                                                                                                                  
                                                                                                                                                                                                              
                                                                                                                                                                                                                        
                                                                                                                                                                                                                        

                                                                                                                                                                                                                          

                                                                                                                                                                                                                      
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                      

                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                

                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                

                                                                                        
                                                                                                
                                                                                              
                                                                                            
                                                                                                    

                                                                                                            
                                                                                                                
                                                                                                                          
                                                                                                                                  
                                                                                                                                                
                                                                                                                                                    
                                                                                                                                                                    
                                                                                                                                                                          
                                                                                                                                                                              
                                                                                                                                                                                          
                                                                                                                                                                                              
                                                                                                                                                                                                        
                                                                                                                                                                                                                      
                                                                                                                                                                                                                            
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                              
                                                                                                                        
  // ── Category filter ───────────────────────────────────────────────────────────
  const toggleCategory = (category: string) => {
        if (category === "All") {
              setSelectedCategories([]); // Clears filters to show all combined
                  } else {
                        setSelectedCategories((prev) =>
                                prev.includes(category)
                                          ? prev.filter((c) => c !== category)
                                                    : [...prev, category]
                                                          );
                                                              }
                                                                  setPage(1);
                                                                    };

  



  const handlePin = (commentId: string, postId?: string) => {
    if (!activeCommentPost) return;

    const updatedComments = (activeCommentPost.comments || []).map((comment: any) => {
      if (comment.id === commentId) {
        return { ...comment, isPinned: true };
      }
      return { ...comment, isPinned: false };
    });

    setActiveCommentPost({ ...activeCommentPost, comments: updatedComments });

    if (postId) {
      setPosts((prevPosts) =>
        prevPosts.map((post: any) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments
                  ? post.comments.map((comment: any) =>
                      comment.id === commentId ? { ...comment, isPinned: true } : { ...comment, isPinned: false }
                    )
                  : [],
              }
            : post
        )
      );
    }
  };

  // ── Watch time handler ────────────────────────────────────────────────────────
  const handleSendReply = (replyMessage?: string) => {
      const message = (replyMessage ?? replyText).trim();
        if (!message || !activeCommentPost) return;

          const newComment = {
              id: Date.now().toString(),
                  username: "You",
                      text: message,
                          content: message,
                              user: { name: "You" },
                                  likes: 0,
                                      liked: false,
                                          isPinned: false,
                                              replies: [],
                                                };

                                                  const updatedComments = [...(activeCommentPost.comments || []), newComment];
                                                    
                                                      // 1. Keeps the local overlay modal UI updated instantly while open
                                                        setActiveCommentPost({
                                                            ...activeCommentPost,
                                                                comments: updatedComments,
                                                                    commentCount: updatedComments.length
                                                                      });
                                                                        
                                                                          setReplyText("");

                                                                            // 2. Syncs the changes back into the main feed database array state immediately
                                                                              const postId = activeCommentPost.id;
                                                                                if (postId) {
                                                                                    setPosts((prevPosts: any) =>
                                                                                          prevPosts.map((post: any) =>
                                                                                                  post.id === postId
                                                                                                            ? { 
                                                                                                                          ...post, 
                                                                                                                                        commentCount: updatedComments.length, // Updates the feed array instantly
                                                                                                                                                      comments: updatedComments 
                                                                                                                                                                  }
                                                                                                                                                                            : post
                                                                                                                                                                                  )
                                                                                                                                                                                      );
                                                                                                                                                                                        }
                                                                                                                                                                                        };

  

  const handleWatchTime = (postId: string, seconds: number) => {
    editPost?.(postId, { 
        watchTime: seconds 
        } as any);

     // ── [FEATURE 2] Record user interest based on the post they watched ─────────
    const watchedPost = [...rankedPosts, ...socketPosts].find(
      (p) => p.id === postId
    );
    if (watchedPost && seconds > 5) {
      const categoryKey = `cat:${watchedPost.category || "Other"}`;
      const authorKey = `author:${watchedPost.user?.id || watchedPost.user?.name || ""}`;
      setUserInterestMap((prev) => ({
        ...prev,
        [categoryKey]: (prev[categoryKey] || 0) + 1,
        [authorKey]: (prev[authorKey] || 0) + 1,
      }));
    }
  };

  // ── [FEATURE 2] Record interest when user likes or reacts to a post ───────────
  const handleUserEngagement = useCallback((post: any) => {
    if (!post) return;
    const categoryKey = `cat:${post.category || "Other"}`;
    const authorKey = `author:${post.user?.id || post.user?.name || ""}`;
    setUserInterestMap((prev) => ({
      ...prev,
      [categoryKey]: (prev[categoryKey] || 0) + 2,
      [authorKey]: (prev[authorKey] || 0) + 2,
    }));
  }, []);

  // ── Boosted/filtered/ranked posts ─────────────────────────────────────────────
  const boostedPosts = useMemo(() => {
    const allPosts = [...rankedPosts, ...socketPosts];

    let filtered = allPosts.map((post) => ({
      ...post,
      finalScore: calculateFinalScore(post),
    }));

    if (selectedCategories && selectedCategories.length > 0) {
        filtered = filtered.filter((post) => {
            if (!post || !post.category) return false;

                // If "Others" is toggled, we must also match posts with custom written titles
                    const includesOthers = selectedCategories.includes("Others") || selectedCategories.includes("Other");
                    const isCustomCategory = !Object.keys(CATEGORY_EMOJI).includes(post.category);

                        if (includesOthers && (post.category === "Other" || post.category === "Others" || isCustomCategory)) {

                        
                              return true;
                                  }

                                      // Check if the current post category name exists inside our selected array tracker
                                          return selectedCategories.some(cat => 
                                                cat.toLowerCase().trim() === post.category.toLowerCase().trim()
                                                    );
                                                      });
                                                      }

    

    

    return filtered.sort((a, b) => {
      const rankA = a.rankScore || 0;
      const rankB = b.rankScore || 0;

      const decayA = calculateTimeDecay(
        a.createdAt || a.timestamp || Date.now()
      );
      const decayB = calculateTimeDecay(
        b.createdAt || b.timestamp || Date.now()
      );

      const trendingA = calculateTrendingBoost(a, postReactions);
      const trendingB = calculateTrendingBoost(b, postReactions);

      const aiA = calculateAIScore(a);
      const aiB = calculateAIScore(b);

      const verifiedA = verifiedBoost(a);
      const verifiedB = verifiedBoost(b);

      // ── [FEATURE 1] Velocity score (viral detection) ──────────────────────────
      const velocityA = calculateVelocityScore(a, postReactions);
      const velocityB = calculateVelocityScore(b, postReactions);

      // ── [FEATURE 2] User-interest AI score ───────────────────────────────────
      const interestA = calculateUserInterestScore(a, userInterestMap);
      const interestB = calculateUserInterestScore(b, userInterestMap);

      // ── [FEATURE 3] Cold-start boost ─────────────────────────────────────────
      const coldStartA = calculateColdStartBoost(a);
      const coldStartB = calculateColdStartBoost(b);

      // ── [FEATURE 4] Anti-spam penalty ────────────────────────────────────────
      const spamA = calculateSpamPenalty(a, postReactions);
      const spamB = calculateSpamPenalty(b, postReactions);

      const scoreA =
        (rankA + trendingA + aiA + verifiedA + velocityA + interestA + coldStartA + spamA) * decayA;
      const scoreB =
        (rankB + trendingB + aiB + verifiedB + velocityB + interestB + coldStartB + spamB) * decayB;

      return scoreB - scoreA;
    });
  }, [rankedPosts, setSocketPosts, selectedCategories, postReactions, userInterestMap]);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const paginatedPosts = useMemo(
    () => boostedPosts.slice(0, page * PAGE_SIZE),
    [boostedPosts, page]
  );

  const handleLoadMore = () => {
    if (paginatedPosts.length < boostedPosts.length) {
      setPage((prev) => prev + 1);
    }
  };

  // ── Posts grouped by user (for summary strip) ─────────────────────────────────
  const postsByUser = useMemo(() => {
    const map: Record<string, any[]> = {};
    boostedPosts.forEach((post) => {
      const key = post.user?.id || post.user?.name || "unknown";
      if (!map[key]) map[key] = [];
      map[key].push(post);
    });
    return map;
  }, [boostedPosts]);

  // ── [FEATURE 5] getItemLayout for precise TikTok snap scrolling ──────────────
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Donation section ─────────────────────────────────────────────────── */}
      

      {/* ── Streamer wallet ───────────────────────────────────────────────────── */}


      {/* ── Category filter ───────────────────────────────────────────────────── */}
  {/* ─── Multi-Selection Categories Row Wrap (Locks on Top) ─── */}
  <View style={styles.categoryFilterContainer}>
    <TouchableOpacity
        key="All-Toggle"
            onPress={() => toggleCategory("All")}
                style={[
                      styles.categoryButton,
                            { 
                                    borderColor: "#ffffff", 
                                            backgroundColor: selectedCategories.length === 0 ? "rgba(255,255,255,0.15)" : "transparent" 
                                                  }
                                                      ]}
                                                        >
                                                            <Text style={{ color: "#ffffff", fontWeight: "bold" }}>All</Text>
                                                                {selectedCategories.length === 0 && (
                                                                      <Text style={styles.tickMark}>✓</Text>
                                                                          )}
                                                                            </TouchableOpacity>

                                                                              {Object.keys(CATEGORY_EMOJI).map((key) => {
                                                                                  const cat = CATEGORY_EMOJI[key] ? key : "Other";
                                                                                      const emoji = CATEGORY_EMOJI[key] || "⚪";
                                                                                          const isSelected = selectedCategories.includes(cat);

                                                                                              // Pull custom colors if they exist in your constants file configuration
                                                                                                  const color = (CATEGORIES as any)[key]?.color || "#ffffff";

                                                                                                      return (
                                                                                                            <TouchableOpacity
                                                                                                                    key={cat}
                                                                                                                            onPress={() => toggleCategory(cat)}
                                                                                                                                    style={[
                                                                                                                                              styles.categoryButton, 
                                                                                                                                                        { 
                                                                                                                                                                    borderColor: isSelected ? "#ff0050" : color,
                                                                                                                                                                                backgroundColor: isSelected ? "rgba(255,255,255,0.12)" : "transparent"
                                                                                                                                                                                          }
                                                                                                                                                                                                  ]}
                                                                                                                                                                                                        >
                                                                                                                                                                                                                <Text style={{ color: cat === "Technological" && !isSelected ? "#ffffff" : (isSelected ? "#fff050" : color), fontWeight: "bold" }}>

                                                                                                                                                                                                                          {cat} {emoji}
                                                                                                                                                                                                                                  </Text>
                                                                                                                                                                                                                                          {isSelected && (
                                                                                                                                                                                                                                                    <Text style={styles.tickMark}>✓</Text>
                                                                                                                                                                                                                                                            )}
                                                                                                                                                                                                                                                                  </TouchableOpacity>
                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                        })}
                                                                                                                                                                                                                                                                        </View>

                                                          
                                                                
                                                                            
                                                                                      
                                                                                                          
                                                                                                                    
                                                                                                                        
                                                                                                                                      
                                                                                                                                                  
                                                                                                                                                        
                                                                                                                                                                  
                                                                                                                                                                          
                                                                                                                                                                                  
                                                                                                                                                                                                    

                                                                                                                                                                                                          
                                                                                                                                                                                                                      
                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

      
      
      
          
            
                  
                      
                          
                                  
                                      

                                            
                                                    
                                                          

                                                                        
                                                                                
                                                                                    
                                                                                      
                                                                                                          
                                                                                                                      
                                                                                                                                            
                                                                                                                                        
                                                                                                                                                                                    
                                                                                                                                                                                              
                                                                                                                                                                                    
                                                                                                                                                                                                                    
                                                                                                                                                                                                                  
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                        
                                                                                                                                                                        


      {/* ── User posts summary strip ──────────────────────────────────────────── */}
      

      {/* ── [FEATURE 5] Main feed — infinite TikTok-style full-screen snap scroll ── */}
      <FlatList
        ref={mainFeedRef}
        data={paginatedPosts}
        keyExtractor={(item, i) => item?.id ?? i.toString()}
        renderItem={({ item }) => (
          <PostItem
            item={item}
            isActive={item.id === activePostId}
            onWatchTime={handleWatchTime}
            handleDonation={handleDonation}
            addFloatingDonation={addFloatingDonation}
               setActiveCommentPost={setActiveCommentPost}
              setIsCommentModalVisible={setIsCommentModalVisible}

          />
        )}
        // ── TikTok snap behaviour ─────────────────────────────────────────────
        pagingEnabled
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
        disableIntervalMomentum={true}
        // ── Performance ───────────────────────────────────────────────────────
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        initialNumToRender={PAGE_SIZE}
        windowSize={5}
        maxToRenderPerBatch={3}
        removeClippedSubviews={true}
        // ── Infinite scroll ───────────────────────────────────────────────────
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        // ── Active-post tracking ──────────────────────────────────────────────
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
      />

      {/* ── Top fans leaderboard ──────────────────────────────────────────────── */}
      <View
        style={{
          marginTop: 20,
          backgroundColor: "#fff",
          padding: 10,
          borderRadius: 10,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>
          Top Fans
        </Text>
        {topFans.map((fan, index) => (
          <Text key={index}>
            {index + 1}️⃣ {fan.user} - ${fan.total}
          </Text>
        ))}
      </View>

      {/* ── Floating donation animations ──────────────────────────────────────── */}
      {floatingDonations.map((donation) => (
        <Animated.View
          key={donation.id}
          style={{
            position: "absolute",
            bottom: 50,
            left: Math.random() * 200,
            opacity: donation.animatedValue,
            transform: [
              {
                translateY: donation.animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -150],
                }),
              },
            ],
          }}
        >
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>
            {donation.user} sent {donation.method} ${donation.amount}
          </Text>
        </Animated.View>
      ))}

      {/* ── Popup notification ────────────────────────────────────────────────── */}
      {popup && (
        <View
          style={{
            position: "absolute",
            bottom: 100,
            alignSelf: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 15,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>{popup}</Text>
        </View>
      )}
      {/* ─── Floating donation animations overlay layer ───────────────────────── */}
            {floatingDonations.map((donation) => (
                    <Animated.View
                              key={donation.id}
                                        style={{
                                                    position: "absolute",
                                                                bottom: 120,
                                                                            left: Math.random() * 180 + 20,
                                                                                        opacity: donation.animatedValue,
                                                                                                    transform: [
                                                                                                                  {
                                                                                                                                  translateY: donation.animatedValue.interpolate({
                                                                                                                                                    inputRange:[0, 1],
                                                                                                                                                                      outputRange: [0, -200],
                                                                                                                                                                                      }),
                                                                                                                                                                                                    },
                                                                                                                                                                                                                ],
                                                                                                                                                                                                                            zIndex: 999,
                                                                                                                                                                                                                                      }}
                                                                                                                                                                                                                                              >
                                                                                                                                                                                                                                                        <Text style={{ fontWeight: "bold", fontSize: 14, color: "#fff", backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' }}>
                                                                                                                                                                                                                                                                    🎉 {donation.user} supported via {donation.method} (${donation.amount})
                                                                                                                                                                                                                                                                              </Text>
                                                                                                                                                                                                                                                                                      </Animated.View>
                                                                                                                                                                                                                                                                                            )
                                                                                                                                                                                                                                                                                          )
                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                {/* --- FACEBOOK STYLE COMMENTS BOTTOM SHEET MODAL --- */}
      <Modal
        visible={isCommentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsCommentModalVisible(false);
          setActiveCommentPost(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                      {/* Top Handle Bar */}
                                                                                                                                                                                                                                                                                                                                            <View style={styles.modalHandle}/>
                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                        {/* Modal Header Row */}
                                                                                                                                                                                                                                                                                                                                                              <View style={styles.modalHeader}>
                                                                                                                                                                                                                                                                                                                                                                      <TouchableOpacity 
                                                                                                                                                                                                                                                                                                                                                                                style={styles.floatingBackButton}
                                                                                                                                                                                                                                                                                                                                                                                         onPress={() => {
                                                                                                                                                                                                                                                                                                                                                                                            // Fix: Correctly close the modal visibility sheet state
                                                                                                                                                                                                                                                                                                                                                                                              setIsCommentModalVisible(false);
                                                                                                                                                                                                                                                                                                                                                                                                // Reset the active comment post reference
                                                                                                                                                                                                                                                                                                                                                                                                  setActiveCommentPost(null);
                                                                                                                                                                                                                                                                                                                                                                                                  

                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                                                                                                                                // Forcefully update the main feed posts list with the new comments
                                                                                                                                                                                                                                                                                                                                                                                                        if (activeCommentPost) {
                                                                                                                                                                                                                                                                                                                                                                                                                activeCommentPost.comments = activeCommentPost.comments || [];
                                                                                                                                                                                                                                                                                                                                                                                                                      activeCommentPost.commentCount = activeCommentPost.comments.length;
                                                                                                                                                                                                                                                                                                                                                                                                                          }

                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                          }}

                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                    >
                                                                                                                                                                                                                                                                                                                                                                                                                                              <Text style={styles.backButtonAngle}>‹</Text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                      </TouchableOpacity>
                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Text style={styles.modalTitle}>Comments</Text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </View>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                          {/* Scrollable Comments Area */}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     {/* Scrollable Comments Area */}
                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    {/* 🌟 High-Performance Scrollable Comments Body */}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <FlatList
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  data={activeCommentPost?.comments || []}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          keyExtractor={(comment, index) => index.toString()}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  style={{ flex: 1 }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 25 }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      renderItem={({ item: comment, index }) => (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <CommentItem
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              key={index}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          comment={comment}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      isLast={index === ((activeCommentPost?.comments?.length || 1) - 1)}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  onPin={handlePin}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ListEmptyComponent={
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <Text style={styles.noCommentsText}>No comments yet. Be the first to reply!</Text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    />

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    {/* Bottom Input Area aligned vertically */}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <View style={styles.modalBottomContainer}>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        {/* The text input and send button are now unified inside a single capsule border */}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <View style={styles.sketchInputContainer}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <TextInput
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   style={styles.sketchTextInput}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       placeholder="Write a reply..."
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           placeholderTextColor="#888"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               value={replyText}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   onChangeText={setReplyText}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       <TouchableOpacity
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         style={styles.sketchSendButton}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           onPress={() => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              const message = replyText.trim();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                if (message && activeCommentPost) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    const newComment = {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          id: Date.now().toString(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                username: "You",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      text: message,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            content: message,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  user: { name: "You" },
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        likes: 0,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              liked: false,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    isPinned: false,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          replies: [],
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              };

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  // 1. Force push straight into active state memory arrays
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      const updatedComments = [...(activeCommentPost.comments || []), newComment];
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          activeCommentPost.comments = updatedComments;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              activeCommentPost.commentCount = updatedComments.length;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  // 2. Refresh the modal view instantly
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      if (typeof setActiveCommentPost === 'function') {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            setActiveCommentPost({
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ...activeCommentPost,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            comments: updatedComments,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    commentCount: updatedComments.length
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          });
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      // 3. Reset input text layer field cleanly so it never freezes
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          setReplyText("");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                

                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     >
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       <Text style={styles.sketchSendButtonText}>Send</Text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       </TouchableOpacity>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          


                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
          </KeyboardAvoidingView>
        </View>
      </Modal>
      </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
    
  
          );
             };

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
modalOverlay: {
    flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end", // Keeps the modal at the bottom
        },
        modalContainer: {
          backgroundColor: "#ffffff",
            borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
                paddingTop: 10,
                },


  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  floatingBackButton: {
    marginRight: 15,
    paddingHorizontal: 5,
  },
  backButtonAngle: {
    fontSize: 32,
    fontWeight: "300",
    color: "#000",
    lineHeight: 32,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },
  modalCommentsScroll: {
    flex: 1,
    padding: 15,
  },
  noCommentsText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
  },
  commentBubbleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentText: {
    color: "#222",
    fontSize: 14,
  },
  commentMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#1877f2",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  commentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ddd",
    marginRight: 10,
  },
  commentTextBubble: {
    flex: 1,
    backgroundColor: "#f1f2f6",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentUserText: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#000",
    marginBottom: 2,
  },
  commentContentText: {
    fontSize: 14,
    color: "#333",
  },
  modalBottomContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  sketchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 46,
    backgroundColor: "#f9f9f9",
  },
  sketchTextInput: {
    flex: 1,
    height: "100%",
    color: "#000",
    fontSize: 14,
    padding: 0,
  },
  sketchSendButton: {
    paddingLeft: 10,
    justifyContent: "center",
    height: "100%",
  },
  sketchSendButtonText: {
    color: "#ff0050",
    fontWeight: "bold",
    fontSize: 14,
  },

    
    postCard: {
          width: '100%',
              backgroundColor: '#ffffff', // Ensures comments don't bleed through
                  marginBottom: 12,           // Separates individual posts in the feed
                      paddingVertical: 10,
                          display: 'flex',
                              flexDirection: 'column',    // Clean linear stack from top to bottom
                                },
  fullScreenVideo: {
        width: '100%',
            height: 300,                // Locks feed videos to a safe, controlled block size
                backgroundColor: '#000000',
                    overflow: 'hidden',
                      },

  
    
    postText: {
          color: "#fff",
              fontSize: 16,
                  padding: 20,
                      width: '100%',
                          marginBottom: 8,            // Clean breathing space below paragraphs
                            },

    
  
  overlayInfo: {
    position: "absolute",
    bottom: 60,
    left: 20,
    width: "70%",
  },
  heartOverlay: {
    position: "absolute",
    alignSelf: "center",
    top: "40%",
  },
  rightOverlay: {
    position: "absolute",
    right: 15,
    bottom: 100,
    alignItems: "center",
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  followButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  iconButton: {
    alignItems: "center",
    marginVertical: 10,
    color: "#ffffff",
  },
  iconText: {
    fontSize: 28,
    color: "#fff",
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  verifiedBadge: {
    color: "#4da6ff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoryBadge: {
    position: "absolute",
    top: 60,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  commentRow: {
    flexDirection: "row",
    marginVertical: 6,
  },
  commentAvatarContainer: {
    alignItems: "center",
    marginRight: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentLine: {
    width: 2,
    backgroundColor: "#ccc",
    flex: 1,
    marginTop: 2,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#fff",
  },
  commentTextWhite: {
    fontSize: 12,
    color: "#fff",
  },
  replyContainer: {
    flexDirection: "row",
    marginTop: 6,
    alignItems: "center",
  },
  replyInput: {
    flex: 1,
    backgroundColor: "#222",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  replyButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ff0050",
    borderRadius: 20,
  },
  goLiveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff0050",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  goLiveTimerText: {
    color: "#ff3b30",
    fontWeight: "bold",
    marginTop: 4,
    fontSize: 13,
  },
  categoryFilterContainer: {
    backgroundColor: "#111111",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "ios" ? 50 : 25,
    paddingBottom: 12,
    zIndex: 10,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  tickMark: {
    marginLeft: 6,
    fontWeight: "bold",
    color: "#fff",
  },
  payDropdown: {
    position: "absolute",
    backgroundColor: "rgba(20, 20, 20, 0.95)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    zIndex: 99,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },

  payOption: {
    color: "#fff",
    paddingVertical: 6,
    fontSize: 13,
  },
  springConnector: {
    position: "absolute",
    left: 15,
    top: 0,
    bottom: 0,
    width: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#888",
    borderStyle: "dashed",
  },
  // ── [FEATURE 5] TikTok-style video progress bar ───────────────────────────────
  videoProgressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  videoProgressBar: {
    height: 3,
    backgroundColor: "#ff0050",
  },
   // PASTE THIS REPLACEMENT BLOCK EXACTLY HERE:
     imageScrollContainer: {
          width: '100%',         // Fill the feed card safely
              height: 300,           // Lock the height to a clean, fixed layout grid dimension
                  alignSelf: 'center',
                      overflow: 'hidden',    // Completely chops off any rogue media spills
                          marginBottom: 10,
                            },

     
         imageScrollContent: {
           flexDirection: 'column',
             paddingVertical: 12,
             },
             scrollableImageItem: {
               width: '100%',
                 height: 450, // Sets a clear height for clean vertical stacking
                   borderRadius: 8,
                     marginBottom: 16, // Adds spacing between your 4 or 11+ photos
                     },
                      
          
      
                  
                  
                    
                      
                          
                                  
                                    
                                          
                                          

    
                                    
                                    
                                      
                                              
                                                  
                                                      
                                                      
                                                        
                                                                
                                                            
                                                                  
                                                                    
                                                                            
                                                                              
                                                                            
                                                                                  
                                                                                  
                                                                                        
                                                                                          
                                                                                            
                                                                                                
                                                                                                      
                                                                                                          
                                                                                                            
  fbGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
    timestampText: {
          fontSize: 11,
              color: "#888888",
                  marginTop: 2,
                      fontWeight: "400",
                        },
                          actionText: {
                              color: "#ffffff",
                                  fontSize: 12,
                                      fontWeight: "bold",
                                          textAlign: "center",
                                              marginTop: 4,
                                                },
                                                  reactionSummaryText: {
                                                      color: "#666666",
                                                          fontSize: 12,
                                                              marginLeft: 6,
                                                                  fontWeight: "500",
                                                                    },

    
  fbGridOverlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  collapseButton: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#222',
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  collapseButtonText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 14,
  },
  inlineCommentsWrapper: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  inlineCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    padding: 6,
    borderRadius: 8,
  },
});


