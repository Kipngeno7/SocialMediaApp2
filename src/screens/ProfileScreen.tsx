import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Button,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import PostCard from '../components/PostCard';
import { getUserById, getUserPosts } from '../services/userService';
import { auth } from '../firebaseConfig';
import { supabase } from '../config/supabase';

import { blockUser, unblockUser, checkIfBlocked } from '../services/blockService';
import { useTranslation } from 'react-i18next';

import {
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser
} from '../firebase/social';

import { getDatabase, ref, onValue, DataSnapshot, Unsubscribe } from 'firebase/database';

type RootStackParamList = {
  UserProfile: { userId: string };
  Chat: { otherUserId: string };
};

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

export default function ProfileScreen() {
  const route = useRoute<UserProfileRouteProp>();
  
  // FIXED: Safely check if route.params exists; otherwise fallback to your own logged-in UID
  const userId = route.params?.userId || auth.currentUser?.uid || '';

  const { t } = useTranslation();

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Followers / Following Lists
  const [followers, setFollowers] = useState<{ [key: string]: boolean }>({});
  const [following, setFollowing] = useState<{ [key: string]: boolean }>({});

  const currentUserId = auth.currentUser?.uid;
  const database = getDatabase();
  const navigation = useNavigation<any>();

  useEffect(() => {
    let unsubscribeFollowers: Unsubscribe | null = null;
    let unsubscribeFollowing: Unsubscribe | null = null;

    const fetchData = async () => {
      setLoading(true);
      
      // Profile data and posts
      const userData = await getUserById(userId);
      const userPostsResponse = await getUserPosts(userId);

      const userPosts = [
        ...(userPostsResponse.firebase ?? []),
        ...(userPostsResponse.supabase ?? []),
      ];

      setUser(userData);
      setPosts(userPosts);
      setLoading(false);

      const followersRef = ref(database, `followers/${userId}`);
      unsubscribeFollowers = onValue(followersRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val() || {};
        setFollowers(data);
      });

      const followingRef = ref(database, `following/${userId}`);
      unsubscribeFollowing = onValue(followingRef, (snapshot: DataSnapshot) => {
        const data = snapshot.val() || {};
        setFollowing(data);
      });
    };

    const checkBlock = async () => {
      if (!currentUserId) return;
      const result = await checkIfBlocked(currentUserId, userId);
      setIsBlocked(result.blocked);
    };

    fetchData();
    checkBlock();

    // Clean up listeners on unmount properly
    return () => {
      if (unsubscribeFollowers) (unsubscribeFollowers as Unsubscribe)();
      if (unsubscribeFollowing) (unsubscribeFollowing as Unsubscribe)();
    };
  }, [userId]);

  const isFollowing = !!followers[currentUserId || ''];

  const handleFollowToggle = async () => {
    if (!currentUserId) return;
    setFollowLoading(true);

    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }

    // Update profile info
    const updatedUser = await getUserById(userId);
    setUser(updatedUser);
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {/* 1. Profile Picture placeholder and user display names */}
        <Image
          source={{ uri: user?.photo || 'https://placeholder.com' }} // Changed avatar to photo
            style={styles.avatar}
            />
            <Text style={styles.name}>{user?.fullName || 'No Name'}</Text>      {/* Changed name to fullName */}
            <Text style={styles.username}>@{user?.username || 'username'}</Text>


        {/* 2. Follow, Message, and Block arranged in horizontal order */}
        <View style={styles.buttonRow}>
          {/* Follow Button */}
          <TouchableOpacity
            style={[
              styles.followButton,
              {
                backgroundColor: isFollowing ? '#fff' : '#007AFF',
                borderWidth: isFollowing ? 1 : 0,
                borderColor: '#007AFF',
              },
            ]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
          <Text
            style={[
                styles.followButtonText,
                    { color: isFollowing ? '#007AFF' : '#fff' },
                      ]}
                      >
                        {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                        </Text>
                        </TouchableOpacity>

                        {/* Message Button - Using TouchOpacity instead of Button to fix casing */}
                   <TouchableOpacity
                     style={styles.customMessageButton}
                       onPress={() => {
                           // If the userId from route parameters is empty, fall back safely
                               const targetUserId = route.params?.userId || userId;
                                   if (!targetUserId) {
                                         alert("Error: Cannot find this user's ID to start a chat.");
                                               return;
                                                   }
                                                       navigation.navigate('Chat', { otherUserId: targetUserId });
                                                         }}
                                                         >
                                                           <Text style={styles.messageButtonText}>Message</Text>
                                                           </TouchableOpacity>    

          {/* Block / Unblock Button */}
          <TouchableOpacity
            style={styles.blockButton}
            onPress={async () => {
              if (!currentUserId) return;
              if (isBlocked) {
                await unblockUser(currentUserId, userId);
                setIsBlocked(false);
              } else {
                await blockUser(currentUserId, userId);
                setIsBlocked(true);
              }
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {isBlocked ? t('unblock') : t('block')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Number of Followers | Number of Following line */}
        <Text style={styles.stats}>
          {Object.keys(followers).length} {t('followers')} | {Object.keys(following).length} {t('following')}
        </Text>

        {/* 4. Bio contents placed below parameters */}
        <Text style={styles.bio}>
            {user?.bio || 'No bio written yet.'}                               {/* Fallback string if bio is empty */}
            </Text>
            </View> 

    

      {/* User Posts */}
      <Text style={styles.sectionTitle}>{t('posts')}</Text>
      {posts.length === 0 && <Text style={styles.noPosts}>{t('no_posts')}</Text>}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 10 
  },
  name: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 2 
  },
  username: { 
    fontSize: 14, 
    color: 'gray', 
    marginBottom: 10 
  },
  
  // Custom layout components for elements row matching the specifications
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 10,
  },
  followButton: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
  },
  followButtonText: { 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  messageButtonWrapper: {
    marginRight: 10,
    justifyContent: 'center',
  },
  blockButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
  },
  customMessageButton: {
        backgroundColor: '#2196F3',
            paddingVertical: 8,
                paddingHorizontal: 18,
                    borderRadius: 20,
                        marginRight: 10,
                            justifyContent: 'center',
                                alignItems: 'center',
                                  },
                                    messageButtonText: {
                                        color: '#fff',
                                            fontWeight: 'bold',
                                                fontSize: 14,
                                                  },
  
  
  stats: { 
    fontSize: 15, 
    color: '#555', 
    marginVertical: 10, 
    fontWeight: '500' 
  },
  bio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 15,
    marginTop: 4,
  },
  
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginVertical: 10 
  },
  userItem: { 
    fontSize: 16, 
    paddingVertical: 5, 
    borderBottomWidth: 0.5, 
    borderColor: '#ccc' 
  },
  noPosts: { 
    textAlign: 'center', 
    color: '#888', 
    marginVertical: 20 
  },
});
