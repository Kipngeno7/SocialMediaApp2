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
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import PostCard from '../components/PostCard';
import { getUserById, getUserPosts } from '../services/userService';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import SkeletonContent from 'react-native-skeleton-content';
import { blockUser, unblockUser, checkIfBlocked } from '../services/blockServ';
import { useTranslation } from 'react-i18next';

// <-- Step 1: Import upgraded social functions
import { 
  getFollowers, 
  getFollowing, 
  followUser, 
  unfollowUser 
} from '../firebase/social';
import database from '@react-native-firebase/database';

type UserProfileRouteProp = RouteProp<{ UserProfile: { userId: string } }, 'UserProfile'>;

export default function UserProfileScreen() {
  const route = useRoute<UserProfileRouteProp>();
  const { userId } = route.params;
  const { t } = useTranslation();

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Followers / Following lists
  const [followers, setFollowers] = useState<{ [key: string]: boolean }>({});
  const [following, setFollowing] = useState<{ [key: string]: boolean }>({});

  const currentUserId = auth.currentUser?.uid;
  const navigation = useNavigation();

  useEffect(() => {
    let followersListener: any;
    let followingListener: any;

    const fetchData = async () => {
      setLoading(true);

      // Profile data and posts
      const userData = await getUserById(userId);
      const userPosts = await getUserPosts(userId);
      setUser(userData);
      setPosts(userPosts);
      setLoading(false);

      // <-- Setup real-time listeners
      followersListener = database()
        .ref(`followers/${userId}`)
        .on('value', snapshot => {
          const data = snapshot.val() || {};
          setFollowers(data);
        });

      followingListener = database()
        .ref(`following/${userId}`)
        .on('value', snapshot => {
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

    // <-- Cleanup listeners on unmount
    return () => {
      if (followersListener) database().ref(`followers/${userId}`).off('value', followersListener);
      if (followingListener) database().ref(`following/${userId}`).off('value', followingListener);
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
      <ScrollView style={styles.container}>
        <SkeletonContent
          containerStyle={{ flex: 1 }}
          isLoading={true}
          layout={[
            { key: 'avatar', width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
            { key: 'name', width: 120, height: 20, borderRadius: 4, marginBottom: 6 },
            { key: 'username', width: 100, height: 16, borderRadius: 4, marginBottom: 12 },
            { key: 'button', width: 100, height: 35, borderRadius: 20, marginBottom: 10 },
            { key: 'stats', width: 150, height: 14, borderRadius: 4, marginBottom: 10 },
            { key: 'post1', width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
            { key: 'post2', width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
          ]}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: user?.avatar || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{user?.name || user?.username}</Text>
        <Text style={styles.username}>@{user?.username}</Text>

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
            {followLoading ? '...' : isFollowing ? t('unfollow') : t('follow')}
          </Text>
        </TouchableOpacity>

        {/* Block / Unblock Button */}
        <TouchableOpacity
          style={{
            paddingVertical: 6,
            paddingHorizontal: 20,
            borderRadius: 20,
            backgroundColor: '#ff3b30',
            marginBottom: 10,
          }}
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

        {/* Message Button */}
        <Button
          title={t('message')}
          onPress={() => navigation.navigate('Chat', { otherUserId: userId })}
        />

        {/* Stats */}
        <Text style={styles.stats}>
          {Object.keys(followers).length} {t('followers')} | {Object.keys(following).length} {t('following')}
        </Text>

        {/* Followers / Following Lists */}
        <Text style={styles.sectionTitle}>Followers ({Object.keys(followers).length})</Text>
        <FlatList
          data={Object.keys(followers)}
          keyExtractor={(item) => item}
          renderItem={({ item }) => <Text style={styles.userItem}>{item}</Text>}
          scrollEnabled={false}
        />

        <Text style={styles.sectionTitle}>Following ({Object.keys(following).length})</Text>
        <FlatList
          data={Object.keys(following)}
          keyExtractor={(item) => item}
          renderItem={({ item }) => <Text style={styles.userItem}>{item}</Text>}
          scrollEnabled={false}
        />
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
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  name: { fontSize: 20, fontWeight: 'bold' },
  username: { fontSize: 16, color: 'gray', marginBottom: 10 },
  followButton: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 20, marginBottom: 10 },
  followButtonText: { fontWeight: 'bold', fontSize: 16 },
  stats: { marginTop: 10, fontSize: 14, color: '#555' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  userItem: { fontSize: 16, paddingVertical: 5, borderBottomWidth: 0.5, borderColor: '#ccc' },
  noPosts: { textAlign: 'center', color: '#888', marginVertical: 20 },
});
