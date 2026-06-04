// src/components/PostCard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { subscribeToPostUpdates } from '../services/postService';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
const postService: any = require('../services/postService');
import { translateText } from '../services/translationService';

interface PostCardProps {
  post: any;
}

export default function PostCard({ post }: PostCardProps) {
  const [currentPost, setCurrentPost] = useState(post);
  const [translatedText, setTranslatedText] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToPostUpdates(post.id, setCurrentPost);
    return () => unsubscribe();
  }, [post.id]);

  // Auto-translate post text
  useEffect(() => {
    translatePost();
  }, []);

  const translatePost = async () => {
    const lang = await AsyncStorage.getItem('appLanguage');
    if (!lang) return;

    const translated = await translateText(post.text, lang);
    setTranslatedText(translated);
  };

  const handleLike = () => {
    if (!auth.currentUser) return;
    postService.toggleLikePost(post.id, auth.currentUser.uid);
  };

  const handleComment = () => {
    if (!auth.currentUser) return;
    const comment = prompt('Write a comment:'); // simple prompt for demo
    if (comment) postService.addCommentToPost(post.id, auth.currentUser.uid, comment);
  };

  return (
    <View style={styles.card}>

      {/* Header with avatar */}
      <View style={styles.header}>
        <Image
          source={{ uri: currentPost.userAvatar || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{currentPost.username || currentPost.userId}</Text>
      </View>

      {/* Post text with translation */}
      <Text style={styles.title}>{currentPost.title}</Text>
      <Text style={styles.postText}>
        {showOriginal ? currentPost.content : translatedText || currentPost.content}
      </Text>

      {/* Toggle translation */}
      <TouchableOpacity onPress={() => setShowOriginal(!showOriginal)}>
        <Text style={styles.translateBtn}>
          {showOriginal ? "See Translation" : "See Original"}
        </Text>
      </TouchableOpacity>

      {/* Render media if available */}
      {currentPost.mediaUrl && (
        currentPost.mediaType === 'image' ? (
          <Image
            source={{ uri: currentPost.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        ) : currentPost.mediaType === 'video' ? (
          <Video
            source={{ uri: currentPost.mediaUrl }}
            style={styles.media}
            useNativeControls
            resizeMode={'contain' as ResizeMode}
          />
        ) : null
      )}

      <Text style={styles.meta}>
        {currentPost.likesCount} Likes  ^ {currentPost.commentsCount} Comments
      </Text>

      <View style={styles.buttons}>
        <Button title="Like" onPress={handleLike} />
        <Button title="Comment" onPress={handleComment} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  postText: {
    fontSize: 16,
  },
  translateBtn: {
    color: '#007AFF',
    marginTop: 10,
  },
  media: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
  },
  meta: {
    marginVertical: 5,
    fontSize: 12,
    color: 'gray',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
