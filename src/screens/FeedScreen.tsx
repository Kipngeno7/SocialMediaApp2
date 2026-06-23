// src/screens/FeedScreen.tsx

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
  
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

import { Video, AVPlaybackStatus, ResizeMode } from "expo-av";
import { Platform } from 'react-native';

// Dynamically require only on mobile platforms
const MediaLibrary = Platform.OS !== 'web' ? require('expo-media-library') : null;

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import database from "@react-native-firebase/database";
import axios from "axios";

import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

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

// ── [FEATURE 5] TikTok-style: each card takes full screen height ──────────────
const ITEM_HEIGHT = height;

const REACTIONS = ["❤️", "🥺", "😎", "🔥", "👍", "👏", "😌", "😭", "😆", "🥱"];
const CATEGORY_EMOJI: Record<string, string> = {
  "Political/Governance": "🔴",
  Sports: "🟠",
  Health: "🟢",
  "Educational/Philosophical": "🔵",
  Entertainment: "🌸",
  Technological: "🟣",
  Religious: "🕊️",
  "Development/Economic": "🟤",
  "Personal/Warm Touch": "💛",
  "Public Information": "🟦",
  Sociocultural: "🎭",
  Other: "⚪",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const renderCategoryBadge = (post: any): string => {
  if (post.category === "Other" && post.otherCategoryText) {
    return `${post.otherCategoryText} Post ${CATEGORY_EMOJI["Other"]}`;
  }
  const emoji = CATEGORY_EMOJI[post.category] || "⚪";
  return `${post.category} Post ${emoji}`;
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

            {comment.user?.isVerified && (
              <Text style={{ color: "#1DA1F2", marginLeft: 5 }}>👑</Text>
            )}

            {comment.isPinned && (
              <Text style={{ color: "#ffcc00", marginLeft: 8 }}>📌</Text>
            )}
          </View>

          <Text style={styles.commentText}>{comment.text}</Text>

          {/* Actions */}
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            <TouchableOpacity onPress={handleLike}>
              <Text style={{ color: "#fff", marginRight: 15 }}>
                ❤️ {likesCount}
              </Text>
            </TouchableOpacity>

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
            <View style={{ flexDirection: "row", marginTop: 5 }}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write reply..."
                placeholderTextColor="#aaa"
                style={{
                  flex: 1,
                  backgroundColor: "#222",
                  color: "#fff",
                  paddingHorizontal: 10,
                  borderRadius: 20,
                }}
              />
              <TouchableOpacity onPress={handleAddReply}>
                <Text style={{ color: "#ff0050", marginLeft: 10 }}>Send</Text>
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

const PostItem = React.memo(({ item, isActive, onWatchTime }: any) => {
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [comments, setComments] = useState(item?.comments || []);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(item?.text || "");

  // ── [FEATURE 5] Video completion tracking for TikTok-style scrolling ─────────
  const [videoProgress, setVideoProgress] = useState(0);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const heartAnim = useRef(new Animated.Value(0)).current;
  const pinnedAnim = useRef(new Animated.Value(1)).current;
  const videoRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isVideo =
    item?.mediaUris?.[0] &&
    item.mediaUris[0].toLowerCase().endsWith(".mp4");

  const sortedComments = [...comments].sort(
    (a, b) => Number(b.isPinned) - Number(a.isPinned)
  );

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Request media library permissions on mount
  useEffect(() => {
    (async () => {
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
        setWatchTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (watchTime > 3) {
      onWatchTime?.(item.id, watchTime);
      boostPostRanking?.(item.id, watchTime);
    }
  }, [watchTime]);

  // Video play/pause based on active state
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) videoRef.current.playAsync();
      else videoRef.current.pauseAsync();
    }
  }, [isActive]);

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

  const handleDownload = async () => {
    if (!item?.mediaUris?.[0]) return;
    try {
      const uri = item.mediaUris[0];
      const filename = uri.split("/").pop();
      const fileUri = FileSystem.documentDirectory + filename;

      const { exists } = await FileSystem.getInfoAsync(fileUri);
      if (!exists) {
        const downloaded = await FileSystem.downloadAsync(uri, fileUri);
        await MediaLibrary.createAssetAsync(downloaded.uri);
        Alert.alert("Downloaded", "Media saved to gallery!");
      } else {
        Alert.alert("Already exists", "Media already downloaded.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to download media.");
    }
  };

  const handleShare = async () => {
    if (!item?.mediaUris?.[0]) return;
    try {
      const uri = item.mediaUris[0];
      const filename = uri.split("/").pop();
      const fileUri = FileSystem.documentDirectory + filename;

      const { exists } = await FileSystem.getInfoAsync(fileUri);
      let shareUri = fileUri;

      if (!exists) {
        const downloaded = await FileSystem.downloadAsync(uri, fileUri);
        shareUri = downloaded.uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, { dialogTitle: "Share this post" });
      } else {
        Alert.alert("Sharing not available on this device");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to share media.");
    }
  };
const handleSendReply = () => {
    if (!replyText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      text: replyText,
      user: {
        name: "You",
        avatar: "https://i.pravatar.cc/100",
        isVerified: true,
      },
      likes: 0,
      liked: false,
      isPinned: false,
      replies: [],
    };
    setComments((prev: any[]) => [...prev, newComment]);
    setReplyText("");
  };

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
          <Text style={{ fontWeight: "bold", fontSize: 14, color: "#000" }}>
            {item.user?.name ?? "Unknown"}
          </Text>
          <Text style={{ fontSize: 14, marginLeft: 4, color: "#000" }}>
            has posted:{" "}
          </Text>

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

      {/* Media + text area */}
      <TouchableWithoutFeedback
        onPress={handleDoubleTap}
        onLongPress={handleLongPress}
      >
        <View style={{ flex: 1 }}>
          {/* Video */}
          {isVideo && (
            <Video
              ref={videoRef}
              source={{ uri: item.mediaUris[0] }}
              style={styles.fullScreenVideo}
              resizeMode={ResizeMode.COVER}
              isLooping
              onPlaybackStatusUpdate={handleVideoPlaybackStatus}
            />
          )}

          {/* Post text */}
          {!editing && (
            <Text style={styles.postText}>{item?.text}</Text>
          )}

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

      {/* [FEATURE 5] TikTok-style video progress bar at bottom of card */}
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
          }}
        >
          <Text style={styles.iconText}>❤️</Text>
          <Text style={styles.countText}>{likesCount}</Text>
        </TouchableOpacity>

        {/* Comment toggle */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setCommentsVisible((prev) => !prev)}
        >
          <Text style={styles.iconText}>💬</Text>
          <Text style={styles.countText}>{comments.length}</Text>
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
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setPayMenuVisible((prev) => !prev)}
          >
            <Text style={styles.iconText}>💰</Text>
            <Text style={styles.countText}>Pay</Text>
          </TouchableOpacity>

          {payMenuVisible && (
            <View style={styles.payDropdown}>
              <TouchableOpacity onPress={handleMpesaPayment}>
                <Text style={styles.payOption}>🇰🇪 MPESA</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStripePayment}>
                <Text style={styles.payOption}>🌍 Stripe</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Subscribe */}
        <TouchableOpacity style={styles.iconButton} onPress={handleSubscribe}>
          <Text style={styles.iconText}>⭐</Text>
          <Text style={styles.countText}>
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </Text>
        </TouchableOpacity>

        {/* Go Live */}
        <TouchableOpacity style={styles.goLiveButton} onPress={handleGoLive}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            {item?.isLive ? "🔴 Stop Live" : "Go Live"}
          </Text>
        </TouchableOpacity>
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
          {watchTime}s watched
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
                <Text style={{ fontSize: 14 }}>{count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Active reactions summary */}
      {Object.values(postReactions[item.id] || {}).some((v) => v > 0) && (
        <Text style={{ marginTop: 4, fontSize: 14, color: "#555" }}>
          {Object.entries(postReactions[item.id] || {})
            .filter(([, v]) => v > 0)
            .map(([emoji]) => emoji)
            .join(" ")}
        </Text>
      )}

      {/* Comments section */}
      {commentsVisible && (
        <View
          style={{
            position: "absolute",
            bottom: 140,
            left: 20,
            right: 20,
            maxHeight: 180,
          }}
        >
          {/* Pinned comment sticky */}
          {sortedComments[0]?.isPinned && (
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                backgroundColor: "#111",
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#ffcc00",
                shadowColor: "#ffcc00",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                transform: [{ scale: pinnedAnim }],
              }}
            >
              <CommentItem
                comment={sortedComments[0]}
                onPin={handlePin}
              />
            </Animated.View>
          )}

          <FlatList
            ref={flatListRef}
            data={sortedComments.filter((c: any) => !c.isPinned)}
            keyExtractor={(c: any) => c.id}
            contentContainerStyle={{
              paddingTop: sortedComments[0]?.isPinned ? 100 : 0,
            }}
            renderItem={({ item: commentItem, index }) => (
              <CommentItem
                comment={commentItem}
                isLast={index === sortedComments.length - 2}
                onPin={handlePin}
              />
            )}
          />

          {/* Reply input */}
          <View style={styles.replyContainer}>
            <TextInput
              placeholder="Write a reply..."
              placeholderTextColor="#aaa"
              value={replyText}
              onChangeText={setReplyText}
              style={styles.replyInput}
            />
            <TouchableOpacity
              onPress={handleSendReply}
              style={styles.replyButton}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
});

// ─── FeedScreen ────────────────────────────────────────────────────────────────

export default function FeedScreen() {
    // 👇 Combine everything into this single line so TypeScript doesn't throw a duplicate error
      const { rankedPosts = [], editPost, isLoading, fetchPosts } = usePosts();

        // ── Firebase / socket state ───────────────────────────────────────────
          const [socketPosts, setSocketPosts] = useState<any[]>([]);
            const [popup, setPopup] = useState<string | null>(null);
              const [walletBalance, setWalletBalance] = useState(0);
                const [floatingDonations, setFloatingDonations] = useState<
                    {
                          id: string;
                                amount: number;
                                      method: string;
                                            user: string;
                                                  animatedValue: Animated.Value;
                                                      }[]
                                                        >([]);
                                                          const [topFans, setTopFans] = useState<{ user: string; total: number }[]>([]);

                                                            const streamerId = "STREAM01";
                                                              const PLATFORM_CUT = 0.2;

                                                                // ── Feed state ───────────────────────────────────────────
                                                                  // 👇 Add your mounting hook right here to trigger the sync cleanly
                                                                    useEffect(() => { 
                                                                        fetchPosts(); 
                                                                          }, [fetchPosts]);



  // ── Feed state ────────────────────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [postReactions, setPostReactions] = useState<
    Record<string, Record<string, number>>
  >({});

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

  // ── Firebase & socket setup ───────────────────────────────────────────────────
  useEffect(() => {
    if (auth.currentUser) {
      connectSocket(auth.currentUser.uid);
      subscribeToNewPosts((newPost: any) =>
        setSocketPosts((prev) => [newPost, ...prev])
      );
    }

    const walletRef = database().ref(`wallets/${streamerId}`);
    walletRef.on("value", (snapshot: any) => {
      const data = snapshot.val();
      if (data && data.balance) setWalletBalance(data.balance);
    });

    const donationsRef = database().ref(`liveDonations/${streamerId}`);
    donationsRef.on("value", (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const totals: Record<string, number> = {};
        Object.values(data).forEach((donation: any) => {
          const donorName = donation.user || "Anonymous";
          totals[donorName] =
            (totals[donorName] || 0) + donation.streamerAmount;
        });
        const sorted = Object.entries(totals)
          .map(([user, total]) => ({ user, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        setTopFans(sorted);
      }
    });

    return () => {
      walletRef.off();
      donationsRef.off();
    };
  }, [auth.currentUser]);

  // ── Floating donation animation ───────────────────────────────────────────────
  const addFloatingDonation = (
    amount: number,
    method: string,
    user: string
  ) => {
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

  // ── Payment handlers ──────────────────────────────────────────────────────────
  const handleDonation = async (
    method: "Daraja" | "Stripe",
    amount = 50
  ) => {
    try {
      const streamerAmount = amount * (1 - PLATFORM_CUT);
      const donorName = auth.currentUser?.displayName || "Anonymous";

      if (method === "Daraja") {
        const res = await axios.post(
          "http://YOUR_IP:3000/api/mpesa/stkpush",
          {
            phoneNumber:
              auth.currentUser?.phoneNumber || "2547XXXXXXXX",
            amount,
            accountReference: streamerId,
            transactionDesc: "Tip for Streamer",
          }
        );
        if (!res.data.success) throw new Error("M-Pesa failed");
      } else if (method === "Stripe") {
        await axios.post("http://YOUR_IP:3000/api/stripe/charge", {
          amount,
          currency: "usd",
          streamerId,
        });
      }

      setPopup(
        `${method} Payment Successful! Streamer receives ${streamerAmount}`
      );
      setTimeout(() => setPopup(null), 10000);

      database()
        .ref(`liveDonations/${streamerId}`)
        .push({
          method,
          amount,
          streamerAmount,
          platformFee: amount * PLATFORM_CUT,
          user: donorName,
          timestamp: Date.now(),
        });

      database()
        .ref(`wallets/${streamerId}/balance`)
        .transaction(
          (balance: number | null) => (balance || 0) + streamerAmount
        );

      addFloatingDonation(streamerAmount, method, donorName);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const withdrawToMobile = async (method: string, country?: string) => {
    try {
      if (walletBalance <= 0) {
        Alert.alert("No funds", "Your wallet is empty");
        return;
      }

      const payload: any = { streamerId, amount: walletBalance };

      switch (method) {
        case "M-Pesa":
          payload.phoneNumber = "2547XXXXXXXX";
          break;
        case "PayPal":
          payload.paypalEmail = "STREAMER_PAYPAL_EMAIL";
          break;
        case "Stripe":
          payload.stripeAccountId = "STREAMER_STRIPE_ACCOUNT";
          break;
        case "MTN":
          payload.phoneNumber = "MTN_NUMBER";
          payload.country = country || "GH";
          break;
        case "Airtel":
          payload.phoneNumber = "AIRTEL_NUMBER";
          payload.country = country || "TZ";
          break;
        case "GCash":
          payload.phoneNumber = "GCASH_NUMBER";
          payload.country = country || "PH";
          break;
        case "Bank":
          payload.bankAccount = "STREAMER_BANK";
          payload.country = country || "US";
          break;
        default:
          throw new Error("Unsupported withdrawal method");
      }

      await axios.post("http://YOUR_IP:3000/api/withdraw", payload);

      setPopup(`Withdrawal of ${walletBalance} via ${method} successful`);
      setTimeout(() => setPopup(null), 10000);

      database().ref(`wallets/${streamerId}`).set({ balance: 0 });
    } catch (err: any) {
      Alert.alert("Withdrawal failed", err.message);
    }
  };
  // ── Category filter ───────────────────────────────────────────────────────────
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    setPage(1);
  };

  // ── Watch time handler ────────────────────────────────────────────────────────
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

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((post) =>
        selectedCategories.includes(post.category)
      );
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
  }, [rankedPosts, socketPosts, selectedCategories, postReactions, userInterestMap]);

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
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Support Streamer
      </Text>

      <TouchableOpacity
        onPress={() => handleDonation("Daraja")}
        style={{
          backgroundColor: "#FFA500",
          padding: 12,
          marginBottom: 10,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Pay with M-Pesa
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDonation("Stripe")}
        style={{
          backgroundColor: "#6772E5",
          padding: 12,
          marginBottom: 20,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Pay with Stripe
        </Text>
      </TouchableOpacity>

      {/* ── Streamer wallet ───────────────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#f5f5f5",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          Streamer Wallet
        </Text>
        <Text style={{ fontSize: 22, marginVertical: 10 }}>
          Balance: {walletBalance}
        </Text>

        {["M-Pesa", "PayPal", "Stripe", "MTN", "Airtel", "GCash", "Bank"].map(
          (method, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => withdrawToMobile(method)}
              style={{
                backgroundColor:
                  method === "M-Pesa" ||
                  method === "MTN" ||
                  method === "Airtel" ||
                  method === "GCash"
                    ? "#34A853"
                    : "#FF6600",
                padding: 10,
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Withdraw via {method}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* ── Category filter ───────────────────────────────────────────────────── */}
      <View style={styles.categoryFilterContainer}>
        {Object.keys(CATEGORIES).map((key) => {
          const cat = (CATEGORIES as any)[key].label;
          const color = (CATEGORIES as any)[key].color;
          const isSelected = selectedCategories.includes(cat);

          return (
            <TouchableOpacity
              key={cat}
              onPress={() => toggleCategory(cat)}
              style={[styles.categoryButton, { borderColor: color }]}
            >
              <Text style={{ color: color, fontWeight: "bold" }}>{cat}</Text>
              {isSelected && (
                <Text style={styles.tickMark}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── User posts summary strip ──────────────────────────────────────────── */}
      <FlatList
        horizontal
        data={Object.values(postsByUser)}
        keyExtractor={(userPosts: any[]) =>
          userPosts[0].user?.id || userPosts[0].user?.name
        }
        renderItem={({ item: userPosts }) => {
          const user = userPosts[0].user;
          return (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 8,
                marginRight: 12,
              }}
            >
              <Image
                source={{
                  uri: user?.avatar || "https://i.pravatar.cc/100",
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  marginRight: 8,
                }}
              />
              <Text style={{ color: "#000", flexShrink: 1 }}>
                {user?.name}:{" "}
                {userPosts.map((post: any, idx: number) => (
                  <Text key={post.id}>
                    {renderCategoryBadge(post)}
                    {idx < userPosts.length - 1 ? ", " : ""}
                  </Text>
                ))}
              </Text>
            </View>
          );
        }}
      />

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

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  postCard: {
    height: height,
    width: width,
  },
  fullScreenVideo: {
    height: height,
    width: width,
  },
  postText: {
    color: "#fff",
    fontSize: 16,
    padding: 20,
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
  commentText: {
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
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    marginBottom: 8,
  },
  tickMark: {
    marginLeft: 6,
    fontWeight: "bold",
    color: "#000",
  },
  payDropdown: {
    backgroundColor: "#222",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 5,
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
});
