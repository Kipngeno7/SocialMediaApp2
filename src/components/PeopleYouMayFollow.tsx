// src/components/PeopleYouMayFollow.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Button, StyleSheet } from 'react-native';
import { getFollowSuggestions } from '../services/suggestionService';
import { followUser, checkIfFollowing, unfollowUser } from '../services/followService';
import { auth } from '../firebaseConfig';

export default function PeopleYouMayFollow() {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const fetchSuggestions = async () => {
    if (!auth.currentUser) return;
    const data = await getFollowSuggestions(auth.currentUser.uid);
    setSuggestions(data);
  };

  useEffect(() => {
    fetchSuggestions();

    // Optionally: refresh every 30s for real-time-like updates
    const interval = setInterval(fetchSuggestions, 30000);
    return () => clearInterval(interval);
  }, [auth.currentUser]);

  const handleFollowToggle = async (userId: string) => {
    if (!auth.currentUser) return;
    const isFollowing = await checkIfFollowing(auth.currentUser.uid, userId);

    if (isFollowing) {
      await unfollowUser(auth.currentUser.uid, userId);
    } else {
      await followUser(auth.currentUser.uid, userId);
    }

    fetchSuggestions(); // update after action
  };

  return (
    <View style={{ marginVertical: 10 }}>
      <Text style={styles.title}>People you may follow</Text>
      <FlatList
        data={suggestions}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
            <Text style={styles.username}>{item.username}</Text>
            <Button
              title="Follow"
              onPress={() => handleFollowToggle(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: 'bold', marginBottom: 5, fontSize: 16 },
  card: {
    width: 120,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginBottom: 5 },
  username: { fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
});
