// src/screens/WatchLiveScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  Easing,
  ScrollView,
  Image,
} from "react-native";
import Video from "react-native-video";
import { Ionicons } from "@expo/vector-icons";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildAdded, push, onValue, set } from "firebase/database";
import { updateProfile } from 'firebase/auth';

import { getAuth, onAuthStateChanged, signInAnonymously, User } from "firebase/auth";

// ---- Firebase configuration ----
const firebaseConfig = {
  apiKey: "AIzaSyCvuMKo2JqYS_FOw0_JQIZJhjz6ke7jheo",
  authDomain: "socialmediaapp-9ea15.firebaseapp.com",
  databaseURL: "https://socialmediaapp-9ea15-default-rtdb.firebaseio.com",
  projectId: "socialmediaapp-9ea15",
  storageBucket: "socialmediaapp-9ea15.appspot.com",
  messagingSenderId: "1008667339911",
  appId: "1:1008667339911:web:38fb4f3664b85d0e2e1c22",
  measurementId: "G-FCN9P8PZ0S",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ---- List of live streams ----
const STREAMS = [
  {
    id: "d6a9f8f7-b845-4c41-8704-a28d7ac6846d",
    name: "RealDeal Live 1",
    playbackId: "d6a90j5g3fg656l9",
    playbackUrl: "https://livepeercdn.studio/hls/d6a90j5g3fg656l9/index.m3u8",
  },
  { id: "stream2", name: "RealDeal Live 2", playbackId: "YOUR_PLAYBACK_ID_2", playbackUrl: "https://livepeercdn.studio/hls/YOUR_PLAYBACK_ID_2/index.m3u8" },
  { id: "stream3", name: "RealDeal Live 3", playbackId: "YOUR_PLAYBACK_ID_3", playbackUrl: "https://livepeercdn.studio/hls/YOUR_PLAYBACK_ID_3/index.m3u8" },
];

export default function WatchLiveScreen() {
  const [currentStream, setCurrentStream] = useState(STREAMS[0]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [messages, setMessages] = useState<{ id: number; text: string; user: string; photoURL?: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<{ user: string; count: number; photoURL?: string }[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // ---- Sign in anonymously if not logged in ----
  useEffect(() => {
    onAuthStateChanged(auth,async currentUser => {
      if (currentUser) {
        // Set default displayName and photoURL if null
        if (currentUser) {
            await updateProfile(currentUser, {
                displayName: currentUser.displayName || `User-${currentUser.uid.substring(0, 5)}`,
                    photoURL: currentUser.photoURL || 'https://pravatar.cc'
                      });
                      }

        
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch(console.error);
      }
    });
  }, []);

  // ---- Update viewers on current stream ----
  useEffect(() => {
      const updateViewers = async () => {
          if (!user) return;
              const viewerRef = ref(db, `viewers/${currentStream.id}/${user.uid}`);
                  await set(viewerRef, {
                        name: user.displayName || `User-${user.uid.substring(0, 5)}`,
                              photoURL: user.photoURL || 'https://pravatar.cc',
                                    reactions: 0
                                        });
                                          };

                                            updateViewers();

  

    

    // Cleanup on unmount or strea
    return () => {
          if (user) {
                const viewerRef = ref(db, `viewers/${currentStream.id}/${user.uid}`);
                      set(viewerRef, null);
                          }
                            };
                            }, [user, currentStream]);
    

  // ---- Add reaction (real-time per stream) ----
  const addReaction = (emoji: string) => {
    if (!user) return;
    const reactionRef = ref(db, `reactions/${currentStream.id}`);
    push(reactionRef, { 
      emoji, 
      timestamp: Date.now(), 
      user: user.displayName || `User-${user.uid.substring(0, 5)}`,
      photoURL: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`
    });

    // Increment viewer reaction count
    const viewerRef = ref(db, `viewers/${currentStream.id}/${user.uid}`);
    onValue(viewerRef, snapshot => {
      const data = snapshot.val() || {};
      set(viewerRef, { ...data, reactions: (data.reactions || 0) + 1 });
    }, { onlyOnce: true });
  };

  // ---- Send chat message (real-time per stream) ----
  const sendMessage = () => {
    if (inputText.trim() === '' || !user) return;
    const chatRef = ref(db, `chat/${currentStream.id}`);
    push(chatRef, {
      text: inputText,
      timestamp: Date.now(),
      user: user.displayName || `User-${user.uid.substring(0, 5)}`,
      photoURL: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`
    });
    setInputText('');
  };

  // ---- Listen for real-time reactions ----
  useEffect(() => {
    setReactions([]);
    const reactionRef = ref(db, `reactions/${currentStream.id}`);
    onChildAdded(reactionRef, snapshot => {
      const { emoji } = snapshot.val();
      const id = Date.now() + Math.random();
      const animatedValue = new Animated.Value(0);
      setReactions(prev => [...prev, { id, emoji, animatedValue }]);

      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      });
    });
  }, [currentStream]);

  // ---- Listen for real-time chat messages ----
  useEffect(() => {
    setMessages([]);
    const chatRef = ref(db, `chat/${currentStream.id}`);
    onChildAdded(chatRef, snapshot => {
      const { text, user: messageUser, photoURL } = snapshot.val();
      setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, user: messageUser, photoURL }]);
    });
  }, [currentStream]);

  // ---- Viewer count & leaderboard per stream ----
  useEffect(() => {
    const viewersRef = ref(db, `viewers/${currentStream.id}`);
    onValue(viewersRef, snapshot => {
      const viewers = snapshot.val() || {};
      const count = Object.keys(viewers).length;
      setViewerCount(count);

      const leaderboardData: { user: string; count: number; photoURL?: string }[] = [];
      for (let key in viewers) {
        leaderboardData.push({ user: viewers[key].name || "Anonymous", count: viewers[key].reactions || 0, photoURL: viewers[key].photoURL });
      }
      leaderboardData.sort((a, b) => b.count - a.count);
      setLeaderboard(leaderboardData.slice(0, 5));
    });
  }, [currentStream]);

  return (
    <View style={styles.container}>
      {/* Stream Selector */}
      <ScrollView horizontal style={styles.streamSelector}>
        {STREAMS.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.streamButton,
              currentStream.id === s.id && styles.streamButtonActive
            ]}
            onPress={() => setCurrentStream(s)}
          >
            <Text style={styles.streamButtonText}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Video Player */}
      <Video
        source={{ uri: currentStream.playbackUrl }}
        style={styles.video}
        controls
        resizeMode="cover"
      />

      {/* Animated Floating Reactions */}
      {reactions.map(r => (
        <Animated.View
          key={r.id}
          style={[
            styles.reaction,
            {
              transform: [
                { translateY: r.animatedValue.interpolate({ inputRange: [0,1], outputRange: [0,-150] }) },
                { scale: r.animatedValue.interpolate({ inputRange: [0,1], outputRange: [1,1.5] }) }
              ],
              opacity: r.animatedValue.interpolate({ inputRange: [0,0.7,1], outputRange: [0,1,0] }),
            }
          ]}
        >
          <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
        </Animated.View>
      ))}

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <Text style={styles.live}>LIVE | Viewers: {viewerCount}</Text>

        {/* Reaction Buttons */}
        <View style={styles.reactionButtons}>
          <TouchableOpacity onPress={() => addReaction('❤️')}>
            <Text style={styles.reactionEmoji}>❤️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addReaction('🔥')}>
            <Text style={styles.reactionEmoji}>🔥</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addReaction('👍')}>
            <Text style={styles.reactionEmoji}>👍</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Chat */}
        <View style={styles.chatContainer}>
          <FlatList
            data={messages}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={{flexDirection:'row', alignItems:'center', marginVertical:2}}>
                {item.photoURL && <Image source={{uri:item.photoURL}} style={{width:24,height:24,borderRadius:12,marginRight:4}} />}
                <Text style={styles.chatMessage}>
                  <Text style={{fontWeight:'bold'}}>{item.user}: </Text>{item.text}
                </Text>
              </View>
            )}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#ccc"
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Leaderboard */}
        <View style={styles.leaderboard}>
          <Text style={styles.leaderboardTitle}>Top Viewers:</Text>
          {leaderboard.map((u, idx) => (
            <View key={idx} style={{flexDirection:'row', alignItems:'center', marginVertical:2}}>
              {u.photoURL && <Image source={{uri:u.photoURL}} style={{width:20,height:20,borderRadius:10,marginRight:4}} />}
              <Text style={styles.leaderboardItem}>
                {u.user}: {u.count} reactions
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  video: { flex: 1 },

  streamSelector: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  streamButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 12,
  },
  streamButtonActive: {
    backgroundColor: '#007AFF',
  },
  streamButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  overlay: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    alignItems: "flex-end",
  },

  live: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },

  reactionButtons: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "flex-end",
  },
  reactionEmoji: { fontSize: 28, marginHorizontal: 5 },

  chatContainer: {
    maxHeight: 140,
    width: '100%',
    justifyContent: 'flex-end',
  },
  chatMessage: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 2,
    alignSelf: 'flex-start',
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingHorizontal: 12,
    color: 'white',
  },
  sendButton: {
    marginLeft: 6,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 18,
  },

  reaction: {
    position: 'absolute',
    bottom: 80,
    right: 50,
  },

  leaderboard: {
    position: 'absolute',
    top: 50,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  leaderboardTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  leaderboardItem: {
    color: 'white',
    fontSize: 14,
  },
});
