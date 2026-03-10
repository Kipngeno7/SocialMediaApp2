// src/screens/StreamerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import database from '@react-native-firebase/database';
import axios from 'axios';

const PLAYBACK_ID = "d6a90j5g3fg656l9"; // Your Livepeer playback ID
const LIVEPEER_API_KEY = "daf34171-2a73-4db5-98bd-1431474417ef"; // Your API key

export default function StreamerDashboard() {
  const [viewerCount, setViewerCount] = useState(0);
  const [totalReactions, setTotalReactions] = useState(0);
  const [poll, setPoll] = useState<any>(null); // Will sync from Firebase

  // Step 1 — Fetch live viewer count every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`https://livepeer.studio/api/stream/${PLAYBACK_ID}/stats`, {
          headers: { Authorization: `Bearer ${LIVEPEER_API_KEY}` },
        });
        setViewerCount(res.data?.viewers || 0);
      } catch (err) {
        console.log("Error fetching viewer count:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Step 2 — Listen for total reactions in real-time
  useEffect(() => {
    const reactionRef = database().ref(`liveReactions`);
    const listener = reactionRef.on('value', snapshot => {
      const data = snapshot.val();
      if (!data) return;
      const count = Object.values(data).filter((r: any) => r).length;
      setTotalReactions(count);
    });

    return () => reactionRef.off('value', listener);
  }, []);

  // Step 3 — Listen for poll updates in real-time
  useEffect(() => {
    const pollRef = database().ref(`livePolls/${PLAYBACK_ID}`);
    const listener = pollRef.on('value', snapshot => {
      const data = snapshot.val();
      if (!data) return;
      const options = Object.keys(data).map(key => ({
        id: key,
        votes: data[key]
      }));
      setPoll(options);
    });

    return () => pollRef.off('value', listener);
  }, []);

  // Step 4 — Render dashboard UI
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Streamer Dashboard</Text>
      <Text style={styles.stat}>👁️ Viewers: {viewerCount}</Text>
      <Text style={styles.stat}>❤️ Total Reactions: {totalReactions}</Text>

      {poll && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.heading}>Poll Results</Text>
          {poll.map(option => (
            <Text key={option.id} style={styles.stat}>
              Option {option.id}: {option.votes} votes
            </Text>
          ))}
        </View>
      )}

      {/* Stream controls (optional) */}
      <View style={{ marginTop: 30 }}>
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Start/Stop Stream')}>
          <Text style={styles.buttonText}>Start / Stop Stream</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Switch Camera')}>
          <Text style={styles.buttonText}>Switch Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Mute / Unmute Mic')}>
          <Text style={styles.buttonText}>Mute / Unmute Mic</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Step 5 — Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#111' },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  stat: { fontSize: 16, color: '#fff', marginVertical: 2 },
  button: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8, marginVertical: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
