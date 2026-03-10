// src/screens/LiveStreamScreen.tsx
import React, { useRef, useState, useEffect } from 'react';


import { View, TouchableOpacity, Text, Alert, StyleSheet, FlatList, TextInput, Animated, Easing, Share } from 'react-native';
import NodeCameraView from 'react-native-nodemediaclient';


import { View, Text, StyleSheet, TouchableOpacity, Share, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import database from '@react-native-firebase/database';

const RTMP_URL = "rtmp://rtmp.livepeer.com/live/d6a9f8f7-b845-4c41-8704-a28d7ac6846d";
const PLAYBACK_ID = "d6a90j5g3fg656l9"; // Livepeer playback ID


export default function LiveStreamScreen({ navigation }) {
  const cameraRef = useRef<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraFront, setCameraFront] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<{id:number,text:string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [reactions, setReactions] = useState<any[]>([]);

const [paymentPopup, setPaymentPopup] = useState<{ amount: number; method: string } | null>(null);

const [floatingDonations, setFloatingDonations] = useState<
  { id: string; amount: number; method: string; animatedValue: Animated.Value }[]
>([]);


const addFloatingDonation = (amount: number, method: string) => {
  const id = `${Date.now()}-${Math.random()}`;
  const newDonation = {
    id,
    amount,
    method,
    animatedValue: new Animated.Value(0),
  };
  setFloatingDonations(prev => [...prev, newDonation]);

  Animated.timing(newDonation.animatedValue, {
    toValue: 1,
    duration: 3000,
    useNativeDriver: true,
  }).start(() => {
    setFloatingDonations(prev => prev.filter(d => d.id !== id));
  });
};


const showPaymentPopup = (amount: number, method: string) => {
  setPaymentPopup({ amount, method });

  // Hide popup after 10 seconds
  setTimeout(() => {
    setPaymentPopup(null);
  }, 10000); // 10000 ms = 10 seconds
};

const startStreaming = () => {
  console.log("Start streaming");
  setIsStreaming(true);
};

const stopStreaming = () => {
  console.log("Stop streaming");
  setIsStreaming(false);
};

const switchCamera = () => {
  console.log("Switch camera");
  setCameraFront(!cameraFront);
};

const toggleMic = () => {
  console.log("Toggle mic");
  setMicOn(!micOn);
};

const [poll, setPoll] = useState({
  question: "What topic should we discuss?",
  options: [
    { id: 1, text: "Technology 🟣", votes: 0 },
    { id: 2, text: "Political 🔴", votes: 0 },
    { id: 3, text: "Sports 🟠", votes: 0 },
    { id: 4, text: "Health 🟢", votes: 0 },
    { id: 5, text: "Educational/Philosophical 🔵", votes: 0 },
    { id: 6, text: "Entertainment 🌸", votes: 0 },
    { id: 7, text: "Religious ✝️", votes: 0 },
    { id: 8, text: "Development/Socioeconomic 🟤", votes: 0 },
    { id: 9, text: "Personal/Warm Touch 💛", votes: 0 },
    { id: 10, text: "Public Information 🟦", votes: 0 },
    { id: 11, text: "Other ⚪", votes: 0 },
  ],
});

const shareStream = async () => {
  try {
    await Share.share({
      message: "Join this live stream on my new social platform! 🔴",
      url: `https://lvpr.tv/?v=${PLAYBACK_ID}`,
    });
  } catch (error) {
    console.log(error);
  }
};


// Push vote to Firebase
const votePoll = (id: number) => {
  const voteRef = database().ref(`livePolls/${PLAYBACK_ID}/${id}`);
  voteRef.transaction(current => (current || 0) + 1);

  // Optional: update local UI immediately
  setPoll(prev => ({
    ...prev,
    options: prev.options.map(opt =>
      opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt
    )
  }));
};


  // Start streaming
  const startStreaming = () => {
    if (cameraRef.current) {
      cameraRef.current.start();
      setIsStreaming(true);
      Alert.alert('Live stream started');
    }
  };

  // Stop streaming
  const stopStreaming = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      setIsStreaming(false);
      Alert.alert('Live stream stopped');
    }
  };

  // Switch front/back camera
  const switchCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.switchCamera();
      setCameraFront(!cameraFront);
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (cameraRef.current) {
      cameraRef.current.toggleMute();
      setMicOn(!micOn);
    }
  };

  // Send chat message
  

const sendMessage = () => {
  if (inputText.trim() === '') return;

  const message = { id: Date.now(), text: inputText };

  // Push to Firebase using your playback ID
  database()
    .ref(`liveChats/d6a90j5g3fg656l9`) // <-- Playback ID here
    .push(message);

  setInputText('');
};

  // Add reaction and push to Firebase for real-time updates
  const addReaction = (emoji: string) => {
    const id = Date.now();
    const animatedValue = new Animated.Value(0);

    // Animate locally
    setReactions(prev => [...prev, {id, emoji, animatedValue}]);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 2000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    });

    // Push to Firebase
    database()
      .ref('liveReactions')
      .push({ emoji, timestamp: id });
  };

  // Listen for real-time reactions from Firebase
  useEffect(() => {
    const onChildAdded = database()
      .ref('liveReactions')
      .on('child_added', snapshot => {
        const { emoji, timestamp } = snapshot.val();
        const animatedValue = new Animated.Value(0);
        setReactions(prev => [...prev, {id: timestamp, emoji, animatedValue}]);
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          setReactions(prev => prev.filter(r => r.id !== timestamp));
        });
      });

    return () => database().ref('liveReactions').off('child_added', onChildAdded);
  }, []);


// Listen for live donations and animate floating donations
useEffect(() => {
  const donationRef = database().ref('liveDonations/STREAM01');
  const listener = donationRef.on('child_added', snapshot => {
    const donation = snapshot.val();
    addFloatingDonation(donation.amount, donation.method);
  });

  return () => donationRef.off('child_added', listener);
}, []);

// Listen for poll updates in real-time
useEffect(() => {
  const pollRef = database().ref(`livePolls/${PLAYBACK_ID}`);
  
  const listener = pollRef.on('value', snapshot => {
    const data = snapshot.val();
    if (!data) return;

    setPoll(prev => ({
      ...prev,
      options: prev.options.map(opt => ({
        ...opt,
        votes: data[opt.id] || 0
      }))
    }));
  });

  return () => pollRef.off('value', listener);
}, []);


// Listen for new chat messages in real-time
useEffect(() => {
  const onChildAdded = database()
    .ref(`liveChats/d6a90j5g3fg656l9`) // <-- your playback ID
    .on('child_added', snapshot => {
      const msg = snapshot.val();
      setMessages(prev => [...prev, msg]);
    });

  // Cleanup listener on unmount
  return () => database().ref(`liveChats/d6a90j5g3fg656l9`).off('child_added', onChildAdded);
}, []);

  // Fetch live viewer count from Livepeer API every 5 seconds
  useEffect(() => {
    let interval: any;
    const fetchViewerCount = async () => {
      try {
        const res = await axios.get(`https://livepeer.studio/api/stream/${PLAYBACK_ID}/stats`, {
          headers: {
            Authorization: `Bearer lp_daf34171-2a73-4db5-98bd-1431474417ef`,
          },
        });
        const viewers = res.data?.viewers || 0;
        setViewerCount(viewers);
      } catch (err) {
        console.log("Error fetching viewer count:", err);
      }
    };

    if (isStreaming) {
      fetchViewerCount();
      interval = setInterval(fetchViewerCount, 5000);
    } else {
      setViewerCount(0);
    }

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <View style={styles.container}>
      <NodeCameraView
        style={styles.preview}
        ref={cameraRef}
        outputUrl={RTMP_URL}
        camera={{ cameraId: cameraFront ? 1 : 0, cameraFrontMirror: cameraFront }}
        audio={{ bitrate: 32000, profile: 1, samplerate: 44100 }}
        video={{ preset: 1, bitrate: 400000, profile: 2, fps: 30, videoFrontMirror: cameraFront }}
        autopreview={true}
      />

      {/* Overlay controls */}
      <View style={styles.controls}>
        <Text style={styles.viewerText}>Live Viewers: {viewerCount}</Text>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isStreaming ? 'red' : 'green' }]}
            onPress={isStreaming ? stopStreaming : startStreaming}
          >
            <Text style={styles.buttonText}>{isStreaming ? "Stop Live" : "Start Live"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
            <Text style={styles.buttonText}>
              {cameraFront ? "Switch to Back Camera" : "Switch to Front Camera"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleMic}>
            <Text style={styles.buttonText}>{micOn ? "Mute Mic" : "Unmute Mic"}</Text>
          </TouchableOpacity>

          {/* Multiple reaction buttons */}
          <View style={{ flexDirection: 'row', marginTop: 5 }}>
            {['❤️','💖','🔥','👍'].map(emoji => (
              <TouchableOpacity key={emoji} style={[styles.controlButton, { marginHorizontal: 5 }]} onPress={() => addReaction(emoji)}>
                <Text style={styles.buttonText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Floating reactions */}
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


{/* Poll UI */}
<View style={{
  position: 'absolute',
  bottom: 200,
  left: 10,
  right: 10,
  backgroundColor: 'rgba(0,0,0,0.6)',
  padding: 10,
  borderRadius: 10
}}>
  <Text style={{color:'#fff', fontWeight:'bold'}}>
    {poll.question}
  </Text>

  {poll.options.map(option => (
    <TouchableOpacity
      key={option.id}
      onPress={() => votePoll(option.id)}
      style={{
        backgroundColor:'#333',
        padding:8,
        marginTop:5,
        borderRadius:5
      }}
    >
      <Text style={{color:'#fff'}}>
        {option.text} ({option.votes})
      </Text>
    </TouchableOpacity>
  ))}
</View>

      {/* Floating Chat */}
      <View style={styles.chatContainer}>
        <FlatList
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => <Text style={styles.chatMessage}>{item.text}</Text>}
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

<TouchableOpacity
  style={{
    position: 'absolute',
    right: 15,
    bottom: 120,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30
  }}
  onPress={shareStream}
>
  <Text>🔗</Text>
</TouchableOpacity>



{/* Dashboard Button */}
<TouchableOpacity
  onPress={() =>
    navigation.navigate('Dashboard', {
      startStreaming,
      stopStreaming,
      switchCamera,
      toggleMic
    })
  }
  style={{
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8
  }}
>
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Dashboard</Text>
</TouchableOpacity>



{floatingDonations.map(d => (
  <Animated.View
    key={d.id}
    style={{
      position: 'absolute',
      bottom: 220,
      alignSelf: 'center',
      transform: [
        {
          translateY: d.animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -150], // moves up 150px
          }),
        },
        {
          scale: d.animatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.8, 1.2, 1],
          }),
        },
      ],
      opacity: d.animatedValue.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1, 1, 0],
      }),
      backgroundColor: d.method === 'Daraja' ? '#FFA500' : '#6772E5',
      padding: 8,
      borderRadius: 12,
      minWidth: 120,
      alignItems: 'center',
    }}
  >
    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
      {d.method} Donation: {d.amount}
    </Text>
  </Animated.View>
))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  preview: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    alignItems: 'center',
  },
  buttons: {
    marginTop: 10,
    flexDirection: 'column',
    gap: 10,
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  viewerText: { color: 'white', fontSize: 16, marginBottom: 10 },

  chatContainer: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    maxHeight: 140,
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
    bottom: 220,
    alignSelf: 'center',
  },
});
