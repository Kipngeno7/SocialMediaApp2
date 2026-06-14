// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, ScrollView, FlatList, Text, StyleSheet } from 'react-native';
import PeopleYouMayFollow from '../components/PeopleYouMayFollow';
import { auth } from '../firebaseConfig';
import {supabase} from'../config/supabase';
import { subscribeToPosts, subscribeToPostUpdates } from '../services/postService';
import { subscribeToNotifications } from '../services/notificationService';
interface Post {
    id: string;
      title: string;
        content: string;
          likesCount: number;
            commentsCount: number;
            }



export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Subscribe to feed posts and per-post updates
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribeAllPosts = subscribeToPosts((newPosts) => {
      setPosts(newPosts);

      // Subscribe to updates for each post individually (likes/comments)
      newPosts.forEach((post) => {
        subscribeToPostUpdates(post.id, (updatedPost) => {
          setPosts((prevPosts) =>
            prevPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
          );
        });
      });
    });

    return () => unsubscribeAllPosts();
  }, [auth.currentUser]);

  // Subscribe to notifications
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribeNotifs = subscribeToNotifications(auth.currentUser.uid, setNotifications);
    return () => unsubscribeNotifs();
  }, [auth.currentUser]);

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      {/* Notifications banner */}
      {notifications.length > 0 && (
        <View style={styles.notifBanner}>
          <Text style={styles.notifText}>
            {notifications[0].type === 'follow'
              ? `${notifications[0].username} started following you`
              : `New post: ${notifications[0].title}`}
          </Text>
        </View>
      )}

      {/* Horizontal follow suggestions */}
      <PeopleYouMayFollow />

      {/* Real-time feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text>{item.content}</Text>
            <Text style={styles.metaText}>
              {item.likesCount} Likes • {item.commentsCount} Comments
            </Text>
          </View>
        )}
        scrollEnabled={false} // Scroll handled by ScrollView
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  notifBanner: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  notifText: {
    fontWeight: 'bold',
  },
  postCard: {
    marginVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  postTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metaText: {
    marginTop: 5,
    fontSize: 12,
    color: 'gray',
  },
});
