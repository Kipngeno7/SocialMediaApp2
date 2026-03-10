import React, { useState, useRef, useMemo, useEffect } from "react";
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
} from "react-native";

import { Video } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

import CommentThread from "./components/CommentThread";
import AnimatedSpringConnector from "./components/ElasticSpring";

import { CATEGORIES } from "../../constants/categories";
import { usePosts } from "./context/PostContext";
const FEED_ALGO_VERSION = "1.1.0";
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
const renderCategoryBadge = (post: any) => {
  // Use custom text for "Other" category
  if (post.category === "Other" && post.otherCategoryText) {
    return `${post.otherCategoryText} Post ${CATEGORY_EMOJI["Other"]}`;
  }

  const emoji = CATEGORY_EMOJI[post.category] || "⚪";
  return `${post.category} Post ${emoji}`;
}
const { height, width } = Dimensions.get("window");
const REACTIONS = [
  "❤️", "🥺", "😎", "🔥", "👍", "👏", "😌", "🥱"
];
// 🔥 START FEEDSCREEN
export default function FeedScreen() {

  const { rankedPosts = [] } = usePosts();
// Pagination state
const [page, setPage] = useState(1);
const pageSize = 10;

  // ✅ category state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const [activePostId, setActivePostId] = useState(null);

   // ✅ ADD boostedPosts HERE (AFTER states, BEFORE return)
  const boostedPosts = useMemo(() => {
    let filtered = rankedPosts;

    if (selectedCategories.length > 0) {
      filtered = rankedPosts.filter(post =>
        selectedCategories.includes(post.category)
      );
    }
const paginatedPosts = useMemo(() => {
  return boostedPosts.slice(0, page * pageSize);
}, [boostedPosts, page]);
const handleLoadMore = () => {
  if (paginatedPosts.length < boostedPosts.length) {
    setPage(prev => prev + 1); // load next page
  }
};

    const sorted = [...filtered].sort((a, b) => {
      const rankA = a.rankScore || 0;
      const rankB = b.rankScore || 0;

      if (rankA !== rankB) {
        return rankB - rankA;
      }

      const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();

      return timeB - timeA;
    });

    return sorted;
  }, [rankedPosts, selectedCategories]);
const [postReactions, setPostReactions] = useState<Record<string, Record<string, number>>>({});
// ⏳ Time decay function
  const calculateTimeDecay = (createdAt: string | number | Date) => {
    const now = Date.now();
    const postTime = new Date(createdAt).getTime();
    const hoursOld = (now - postTime) / (1000 * 60 * 60);
    return Math.exp(-hoursOld / 24);
  };

  // 🔥 Trending boost function
  const calculateTrendingBoost = (post: any) => {
    const reactions = Object.values(postReactions[post.id] || {}).reduce(
      (sum: number, val: any) => sum + val,
      0
    );

    const comments = post.commentsCount || 0;
    const shares = post.sharesCount || 0;

    return reactions * 2 + comments * 3 + shares * 4;
  };

  // 👇👇👇 THEN your useMemo comes AFTER the functions 👇👇👇

  const boostedPosts = useMemo(() => {

    let filtered = rankedPosts;

    if (selectedCategories.length > 0) {
      filtered = rankedPosts.filter(post =>
        selectedCategories.includes(post.category)
      );
    }

    const sorted = [...filtered].sort((a, b) => {

      // 🔥 NEW PRODUCTION SCORE
      const scoreA =
        (a.rankScore || 0) +
        calculateTrendingBoost(a) * calculateTimeDecay(a.createdAt);

      const scoreB =
        (b.rankScore || 0) +
        calculateTrendingBoost(b);
// ✅ AI Score
    const aiA = calculateAIScore(a);
    const aiB = calculateAIScore(b);

    // 💎 Final production score with AI boost
    const scoreA = (rankA + trendingA + aiA) * decayA;
    const scoreB = (rankB + trendingB + aiB) * decayB;

    return scoreB - scoreA;
// ✅ Add verified boost here
  const scoreA = ((rankA + trendingA + aiA) + verifiedBoost(a)) * decayA;
  const scoreB = ((rankB + trendingB + aiB) + verifiedBoost(b)) * decayB;

  return scoreB - scoreA;
});

  

  return sorted;
}, [rankedPosts, selectedCategories, postReactions]);

 * calculateTimeDecay(b.createdAt);

      return scoreB - scoreA;
    });
// 🔮 AI Smart Ranking (ML Boost)
const calculateAIScore = (post: any) => {
  // Example: integrate with ML API or use precomputed value
  return post.aiScore || 0; 
};
// 🔹 Verified user boost
const verifiedBoost = (post: any) => post.user?.isVerified ? 10 : 0;

    return sorted;

  }, [rankedPosts, selectedCategories, postReactions]);
const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 80 });

  const onViewRef = useRef(({ viewableItems }: any) => {
    viewableItems.forEach(({ item }) => {
      item.viewTime = (item.viewTime || 0) + 1; // in seconds
    });

    // Optional: mark the first visible post as active
    if (viewableItems.length > 0) setActivePostId(viewableItems[0].item.id);
  });
const calculateTrendingBoost = (post: any) => {
  const reactions = Object.values(postReactions[post.id] || {}).reduce((sum, val) => sum + val, 0);
  const comments = post.commentsCount || 0;
  const shares = post.sharesCount || 0;
  const viewScore = (post.viewTime || 0) * 0.5; // half point per sec viewed
  return reactions * 2 + comments * 3 + shares * 4 + viewScore;
};

  return (
    ...
  );
}
 const boostedPosts = useMemo(() => {
    let filtered = rankedPosts;

    // 🎯 Category filtering
    if (selectedCategories.length > 0) {
      filtered = rankedPosts.filter(post =>
        selectedCategories.includes(post.category)
      );
    }
<FlatList
  data={paginatedPosts}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <PostItem
      item={item}
      isActive={item.id === activePostId}
      onWatchTime={handleWatchTime}
    />
  )}
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5} // load more when 50% from bottom
  initialNumToRender={pageSize}
  windowSize={10}              // memory optimization
  showsVerticalScrollIndicator={false}
/>

    const sorted = [...filtered].sort((a, b) => {
      const rankA = a.rankScore || 0;
      const rankB = b.rankScore || 0;

      const decayA = calculateTimeDecay(a.createdAt || a.timestamp || Date.now());
      const decayB = calculateTimeDecay(b.createdAt || b.timestamp || Date.now());

      const trendingA = calculateTrendingBoost(a);
      const trendingB = calculateTrendingBoost(b);

      // 💎 Final production score
      const scoreA = (rankA + trendingA) * decayA;
      const scoreB = (rankB + trendingB) * decayB;

      return scoreB - scoreA;
    });

    return sorted;
  }, [rankedPosts, selectedCategories, postReactions]);

  // 5️⃣ THEN comes your return() with the FlatList or Feed UI
  return (
    <View style={styles.container}>
      ...
    </View>
  );
}
const handleReact = (postId: string, emoji: string) => {
  setPostReactions(prev => {
    const current = prev[postId] || {};

    // If emoji already exists, toggle it off
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
 
////////////////////////////////////////////////////////////
// COMMENT ITEM
////////////////////////////////////////////////////////////
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
// Ripple effect for this comment's avatar
const ripple = useSharedValue(0);

const triggerRipple = () => {
  ripple.value = 0;
  ripple.value = withTiming(1, { duration: 700 });
};
// Animated style for ripple
const rippleStyle = useAnimatedStyle(() => ({
  transform: [{ scale: 1 + ripple.value * 2 }],
  opacity: 1 - ripple.value,
}));

// Animated depth for physics-based indentation
const depthAnim = useSharedValue(depth);
useEffect(() => {
  depthAnim.value = withSpring(depth * 24, { damping: 10, stiffness: 120 });
}, [depth]);

const animatedIndent = useAnimatedStyle(() => ({
  marginLeft: depthAnim.value,
}));
const glowAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (comment.isPinned) {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }
}, [comment.isPinned]);

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

// ← Replace old handleAddReply here
const handleAddReply = () => {
  if (!replyText.trim()) return;

  const newReply = {
    id: Date.now().toString(),
    text: replyText,
    user: { name: "You", avatar: "https://i.pravatar.cc/100", isVerified: false },
    likes: 0,
    liked: false,
    isPinned: false,
    replies: [],
  };

  // Add the new reply to the state
  setReplies(prev => [...prev, newReply]);
  
  // Clear input and close reply box
  setReplyText("");
  setShowReplyInput(false);

  // Trigger the ripple animation on avatar
  triggerRipple();
};
   return (
    <View style={{ marginVertical: 8 }}>

      {/* SPRING CONNECTOR */}
      {depth > 0 && (
       <AnimatedSpringConnector height={replies.length * 70 + 60} /> 
      )}
<Animated.View
  style={[
    animatedIndent,
    { flexDirection: "row", marginVertical: 8 },
    comment.isPinned && {
      borderColor: glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#ffcc00", "#ffaa00"],
      }),
      borderWidth: 2,
      shadowColor: "#ffcc00",
      shadowOpacity: 0.8,
      shadowRadius: 10,
    },
  ]}
>
 {/* AVATAR COLUMN */}
<View style={{ position: "relative", alignItems: "center", marginRight: 8 }}>
  
  {/* Ripple effect */}
  <Animated.View
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
  <ElasticSpring
    height={(replies.length + 1) * 80}
    verified={comment.user?.isVerified}
  />
       
   {/* Avatar */}
  <Image
    source={{ uri: comment.user?.avatar || "https://i.pravatar.cc/100" }}
    style={styles.commentAvatar}
  />
</View>     
       <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.commentUser}>
              {comment.user?.name}
            </Text>

            {comment.user?.isVerified && (
              <Text style={{ color: "#1DA1F2", marginLeft: 5 }}>
                👑
              </Text>
            )}

            {comment.isPinned && (
              <Text style={{ color: "#ffcc00", marginLeft: 8 }}>
                📌
              </Text>
            )}
          </View>

          <Text style={styles.commentText}>
            {comment.text}
          </Text>

          {/* ACTIONS */}
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            <TouchableOpacity onPress={handleLike}>
              <Text style={{ color: "#fff", marginRight: 15 }}>
                ❤️ {likesCount}
              </Text>
            </TouchableOpacity>
  <TouchableOpacity onPress={() => setShowReplyInput(!showReplyInput)}>
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
              <Text style={{ color: "#ffcc00" }}>
                Pin
              </Text>
            </TouchableOpacity>
          </View>

          {/* REPLY INPUT */}
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
                <Text style={{ color: "#ff0050", marginLeft: 10 }}>
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RECURSIVE REPLIES */}
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
      </View>
    </View>
  );
};


////////////////////////////////////////////////////////////
// POST ITEM
////////////////////////////////////////////////////////////
const PostItem = React.memo(({ item, isActive, onWatchTime }: any) => {
const { boostPostRanking, editPost, deletePost, startLive, stopLive } = usePosts();
const pinnedAnim = useRef(new Animated.Value(1)).current;
const [postReactions, setPostReactions] = useState<Record<string, string[]>>({});
const handleReact = (postId: string, emoji: string) => {
  setPostReactions(prev => {
    const current = prev[postId] || [];
    const alreadyReacted = current.includes(emoji);

    return {
      ...prev,
      [postId]: alreadyReacted
        ? current.filter(e => e !== emoji) // remove reaction if already clicked
        : [...current, emoji],           // add reaction
    };
  });
};

useEffect(() => {
  if (sortedComments[0]?.isPinned) {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pinnedAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pinnedAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }
}, [sortedComments]);
const sortedComments = comments
  .slice() // copy array
  .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
useEffect(() => {
  if (flatListRef.current && sortedComments[0]?.isPinned) {
    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  }
}, [sortedComments]);
const flatListRef = useRef<FlatList>(null);
const [editing, setEditing] = useState(false);
const [editedText, setEditedText] = useState(item?.text || "");
const handleLongPress = () => {
  Alert.alert("Post Options", "Choose an action", [
    {
      text: "Edit",
      onPress: () => setEditing(true), // this opens the edit input
    },
    {
      text: "Delete",
      style: "destructive",
      onPress: () => deletePost?.(item.id), // calls PostContext delete function
    },
    { text: "Cancel", style: "cancel" },
  ]);
};
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
const heartAnim = useRef(new Animated.Value(0)).current;
const videoRef = useRef<any>(null);
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
useEffect(() => {
  let interval: any;
  if (item?.isLive) {
setLiveSeconds(0);
    interval = setInterval(() => setLiveSeconds(prev => prev + 1), 1000);
  }
  return () => clearInterval(interval);
}, [item?.isLive]);
{/* REACTION BUTTONS */}
<View style={{ flexDirection: "row", marginTop: 8, flexWrap: "wrap" }}>
  {REACTIONS.map(emoji => {
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
        {count > 0 && <Text style={{ fontSize: 14 }}>{count}</Text>}
      </TouchableOpacity>
    );
  })}
</View>   
     {/* Show current reactions */}
{postReactions[item.id]?.length > 0 && (
  <Text style={{ marginTop: 4, fontSize: 14, color: "#555" }}>
    {postReactions[item.id].join(" ")}
  </Text>
)}

////////////////////////////////////////////////////////////
// WATCH TIME TRACKING
////////////////////////////////////////////////////////////
useEffect(() => {
  let interval: any;

  if (isActive && isVideo) {
    interval = setInterval(() => {
      setWatchTime(prev => prev + 1);
    }, 1000);
  }

  return () => {
    clearInterval(interval);
  };
}, [isActive]);
useEffect(() => {
  if (watchTime > 3) {
    onWatchTime?.(item.id, watchTime);
    boostPostRanking?.(item.id, watchTime);
  }
}, [watchTime]);

////////////////////////////////////////////////////////////
// VIDEO PLAY CONTROL
////////////////////////////////////////////////////////////
useEffect(() => {
if (videoRef.current) {
if (isActive) videoRef.current.playAsync();
else videoRef.current.pauseAsync();
}
}, [isActive]);

////////////////////////////////////////////////////////////
// DOUBLE TAP LIKE
////////////////////////////////////////////////////////////
const handleDoubleTap = () => {
if (!liked) {
setLiked(true);
setLikesCount(prev => prev + 1);
}
heartAnim.setValue(0);
Animated.sequence([
Animated.timing(heartAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
Animated.timing(heartAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
]).start();
};

////////////////////////////////////////////////////////////
// FOLLOW / SUBSCRIBE / PAYMENTS
////////////////////////////////////////////////////////////
const handleFollow = () => setIsFollowing(!isFollowing);
const handleSubscribe = () => { setIsSubscribed(!isSubscribed); if(!isSubscribed) boostPostRanking?.(item.id, 50);}
const handleMpesaPayment = () => Alert.alert("MPESA Payment", "Initiating STK Push...");
const handleStripePayment = () => Alert.alert("Stripe Payment", "Redirecting to Stripe Checkout...");
const handleShare = () => Alert.alert("Share", "Open share options here...");
const isVideo =
  item?.mediaUris?.[0] &&
  item.mediaUris[0].toLowerCase().endsWith(".mp4");

////////////////////////////////////////////////////////////
// DOWNLOAD MEDIA
////////////////////////////////////////////////////////////
const handleDownload = async () => {
  if (!item?.mediaUris?.[0]) return;

  try {
    const uri = item.mediaUris[0]; // first media file
    const filename = uri.split("/").pop(); // extract filename
    const fileUri = FileSystem.documentDirectory + filename;

    // Check if already exists
    const { exists } = await FileSystem.getInfoAsync(fileUri);
    if (!exists) {
      // Download to app directory
      const downloaded = await FileSystem.downloadAsync(uri, fileUri);
      // Save to gallery
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
////////////////////////////////////////////////////////////
// SHARE MEDIA
////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////
  // GO LIVE TOGGLE
  ////////////////////////////////////////////////////////////
  const handleGoLive = () => {
    if (item?.isLive) stopLive?.(item.id);
    else startLive?.(item.id);
  };
////////////////////////////////////////////////////////////
// ADD COMMENT / THREAD REPLY
////////////////////////////////////////////////////////////
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
setComments(prev => [...prev, newComment]);
setReplyText("");
};
return (
<View style={styles.postCard}>
{/* AUTHOR + CATEGORY LABEL */}
<View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
  <Image
    source={{ uri: item.user?.avatar || "https://i.pravatar.cc/100" }}
    style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }}
  />
  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
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
    c => c.label === item.category
  )?.color  || "#888",
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
<TouchableWithoutFeedback onPress={handleDoubleTap}
onLongPress={handleLongPress} >
<View style={{ flex: 1 }}>
<View style={{ flex: 1 }}>

  {/* MEDIA FIRST */}
  {isVideo && (
    <Video
      ref={videoRef}
      source={{ uri: item.mediaUris[0] }}
      style={styles.fullScreenVideo}
      resizeMode="cover"
      isLooping
    />
  )}

  {/* TEXT ALWAYS RENDERS */}
  {!editing && (
    <Text style={styles.postText}>
      {item?.text}
    </Text>
  )}

  {/* EDIT MODE */}
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

</View>
 <Animated.View style={[styles.heartOverlay, { opacity: heartAnim, transform: [{ scale: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) }] }]}>
<Text style={{ fontSize: 80, color: "white" }}>❤️</Text>
</Animated.View>
</View>
</TouchableWithoutFeedback>

{/* RIGHT SIDE ACTIONS */}
<View style={styles.rightOverlay}>
{/* AVATAR + SPRING + RIPPLE */}
<View style={{ position: "relative", alignItems: "center", marginRight: 8 }}>

  {/* 1️⃣ Ripple Shockwave */}
  <Animated.View
    style={[
      {
        position: "absolute",
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(0,242,255,0.2)",
        top: -12,
        left: -12,
      },
      rippleStyle,
    ]}
  />

  {/* 2️⃣ Elastic Spring Connector */}
  <ElasticSpring
    height={(replies.length + 1) * 80} // reactive height based on replies
    verified={comment.user?.isVerified}
  />

  {/* 3️⃣ Avatar */}
  <Image
    source={{ uri: comment.user?.avatar || "https://i.pravatar.cc/100" }}
    style={styles.commentAvatar}
  />
</View>
  
  {item?.user?.isVerified && <Text style={styles.verifiedBadge}>✔</Text>}

  {/* 🟢 FOLLOW BUTTON */}
  <TouchableOpacity
    style={[styles.followButton, { backgroundColor: isFollowing ? "#444" : "#ff0050" }]}
    onPress={handleFollow}
  >
    <Text style={{ color: "#fff", fontSize: 12 }}>
      {isFollowing ? "Following" : "Follow"}
    </Text>
  </TouchableOpacity>

  {/* 1️⃣ LIKE */}
  <TouchableOpacity
    style={styles.iconButton}
    onPress={() => {
      if (!liked) {
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
      heartAnim.setValue(0);
      Animated.sequence([
        Animated.timing(heartAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(heartAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }}
  >
    <Text style={styles.iconText}>❤️</Text>
    <Text style={styles.countText}>{likesCount}</Text>
  </TouchableOpacity>

  {/* 2️⃣ COMMENT TOGGLE */}
  <TouchableOpacity
    style={styles.iconButton}
    onPress={() => setCommentsVisible(prev => !prev)}
  >
    <Text style={styles.iconText}>💬</Text>
    <Text style={styles.countText}>{comments.length}</Text>
  </TouchableOpacity>

  {/* 3️⃣ SHARE */}
  <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
    <Text style={styles.iconText}>📤</Text>
    <Text style={styles.countText}>Share</Text>
  </TouchableOpacity>

  {/* 4️⃣ DOWNLOAD */}
  <TouchableOpacity style={styles.iconButton} onPress={handleDownload}>
    <Text style={styles.iconText}>⬇️</Text>
    <Text style={styles.countText}>Save</Text>
  </TouchableOpacity>

  {/* 5️⃣ PAY DROPDOWN */}
  <View style={{ alignItems: "center" }}>
    <TouchableOpacity
      style={styles.iconButton}
      onPress={() => setPayMenuVisible(prev => !prev)}
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

  {/* 6️⃣ SUBSCRIBE */}
  <TouchableOpacity
    style={styles.iconButton}
    onPress={handleSubscribe}
  >
    <Text style={styles.iconText}>⭐</Text>
    <Text style={styles.countText}>{isSubscribed ? "Subscribed" : "Subscribe"}</Text>
  </TouchableOpacity>
</View>
   
{/* Bottom Info */}
<View style={styles.overlayInfo}>
<Text style={{ color: "#fff", fontWeight: "bold" }}>{item?.user?.name}</Text>
{item?.user?.isVerified && <Text style={styles.verifiedBadge}>✔</Text>}
{item?.isLive && (
  <Text style={styles.goLiveTimerText}>
    🔴 LIVE {liveSeconds}s
  </Text>
)}

<Text style={{ color: "#fff", fontSize: 12, marginTop: 2 }}>{watchTime}s watched</Text>
</View>
{/* COMMENTS */}
{commentsVisible && (
  <View style={{ position: "absolute", bottom: 140, left: 20, right: 20, maxHeight: 180 }}>
    
    {/* PINNED COMMENT STICKY */}
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
      data={sortedComments.filter(c => !c.isPinned)}
      keyExtractor={(c: any) => c.id}
      contentContainerStyle={{ paddingTop: sortedComments[0]?.isPinned ? 100 : 0 }}
      renderItem={({ item, index }) => (
        <CommentItem
          comment={item}
          isLast={index === sortedComments.length - 2}
          onPin={handlePin}
        />
      )}
    />

    {/* REPLY INPUT BOX */}
    <View style={styles.replyContainer}>
      <TextInput      
        placeholder="Write a reply..."      
        placeholderTextColor="#aaa"      
        value={replyText}      
        onChangeText={setReplyText}      
        style={styles.replyInput}      
      />
      <TouchableOpacity onPress={handleSendReply} style={styles.replyButton}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

////////////////////////////////////////////////////////////
// FEED SCREEN
////////////////////////////////////////////////////////////
export default function FeedScreen() {
const { rankedPosts = [] } = usePosts();
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const toggleCategory = (category: string) => {
  setSelectedCategories(prev =>
    prev.includes(category)
      ? prev.filter(c => c !== category)
      : [...prev, category]
  );
};
const [activePostId, setActivePostId] = useState(null);
const boostedPosts = useMemo(() => {
  // Step 4.1: Sort posts by rankScore
  const sorted = [...rankedPosts].sort(
    (a, b) => (b.rankScore || 0) - (a.rankScore || 0)
  );

  // Step 4.2: If no category is selected, show all posts
  if (selectedCategories.length === 0) return sorted;

  // Step 4.3: Filter posts by selected categories
  return sorted.filter(post =>
    selectedCategories.includes(post.category)
  );
}, [rankedPosts, selectedCategories]);
 const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 80 });
const onViewRef = useRef(({ viewableItems }: any) => {
if (viewableItems.length > 0) setActivePostId(viewableItems[0].item.id);
});

const handleWatchTime = (postId: string, seconds: number) => {
console.log("Watch time:", postId, seconds);
};

return (
<View style={styles.container}>

<View style={styles.categoryFilterContainer}>
{Object.keys(CATEGORIES).map(key => {
  const cat = CATEGORIES[key].label;
  const color = CATEGORIES[key].color; // ✅ Use this color
  const isSelected = selectedCategories.includes(cat);

  return (
    <TouchableOpacity
      key={cat}
      onPress={() => toggleCategory(cat)}
      style={[
        styles.categoryButton,
        { borderColor: color } // ✅ Use color from CATEGORIES
      ]}
    >
      <Text style={{ color: color, fontWeight: "bold" }}> // ✅ Use color from CATEGORIES
        {cat}
      </Text>

  {isSelected && (
        <Text style={styles.tickMark}>✓</Text>
      )}
    </TouchableOpacity>
  );
})}
</View>
{/* ✅ USER POSTS BY CATEGORY SUMMARY */}
<FlatList
  data={Object.values(postsByUser)} // posts grouped by user
  keyExtractor={(userPosts: any[]) => userPosts[0].user?.id || userPosts[0].user?.name}
  renderItem={({ item: userPosts }) => {
    const user = userPosts[0].user;
    return (
      <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 8 }}>
        {/* Avatar */}
        <Image
          source={{ uri: user?.avatar || "https://i.pravatar.cc/100" }}
          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }}
        />

        {/* Name + Categories */}
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
<FlatList
data={boostedPosts}
keyExtractor={(item, i) => item?.id ?? i.toString()}
renderItem={({ item }) => (
<PostItem item={item} isActive={item.id === activePostId} onWatchTime={handleWatchTime} />
)}
pagingEnabled
showsVerticalScrollIndicator={false}
snapToAlignment="start"
decelerationRate="fast"
onViewableItemsChanged={onViewRef.current}
viewabilityConfig={viewConfigRef.current}
/>
</View>
);
}

////////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////////
const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: "#fff" },
postCard: { height: height, width: width },
fullScreenVideo: { height: height, width: width },
postText: { color: "#fff", fontSize: 16, padding: 20 },
overlayInfo: { position: "absolute", bottom: 60, left: 20, width: "70%" },
heartOverlay: { position: "absolute", alignSelf: "center", top: "40%" },
rightOverlay: { position: "absolute", right: 15, bottom: 100, alignItems: "center" },
profilePic: { width: 50, height: 50, borderRadius: 25, marginBottom: 8 },
followButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 20 },
iconButton: { alignItems: "center", marginVertical: 10 },
iconText: { fontSize: 28, color: "#fff" }, 
countText: { color: "#fff", fontSize: 12, marginTop: 4 },
verifiedBadge: { color: "#4da6ff", fontWeight: "bold", marginBottom: 10 },
categoryBadge: { position: "absolute", top: 60, left: 20, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
commentRow: { flexDirection: "row", marginVertical: 6 },
commentAvatarContainer: { alignItems: "center", marginRight: 8 },
commentAvatar: { width: 28, height: 28, borderRadius: 14 },
commentLine: { width: 2, backgroundColor: "#ccc", flex: 1, marginTop: 2 },
commentContent: { flex: 1 },
commentUser: { fontWeight: "bold", fontSize: 12, color: "#fff" },
commentText: { fontSize: 12, color: "#fff" },
replyContainer: { flexDirection: "row", marginTop: 6, alignItems: "center" },
replyInput: { flex: 1, backgroundColor: "#222", color: "#fff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
replyButton: { marginLeft: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#ff0050", borderRadius: 20 },
goLiveButton: {
  flexDirection: "row",          // To show icon + text side by side
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ff0050",   // same as replyButton
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,              // rounded corners
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
  padding: 10,
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
});
