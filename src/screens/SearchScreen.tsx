// src/screens/SearchScreen.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from "expo-router/react-navigation";

import { auth } from '../firebaseConfig';
import {supabase} from '../config/supabase';
import PostCard from '../components/PostCard';
import { searchPosts, searchUsers } from '../services/searchService';


// --- i18next hook import ---
import { useTranslation } from 'react-i18next';

export default function SearchScreen() {
  const navigation = useNavigation(); //  ^|^e Navigation initialized

  const [query, setQuery] = useState('');
  const [postResults, setPostResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- initialize translation hook ---
  const { t } = useTranslation();

  const handleSearch = async (text: string) => {
    setQuery(text);

    if (text.trim().length < 2) {
      setPostResults([]);
      setUserResults([]);
      return;
    }

    setLoading(true);
    try {
      const posts = await searchPosts(text);

      const users = await searchUsers(text, auth.currentUser?.uid as string);

      setPostResults(posts);
      setUserResults(users);
    } catch (err) {
      console.log('Search error:', err);
    }
    setLoading(false);
  };

  //  ^|^e Updated renderUserItem to navigate to ChatScreen
  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => (navigation as any).navigate('Chat', { otherUserId: item.id })}
      
    >
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/40' }}
        style={styles.userAvatar}
      />
      <Text style={styles.userName}>{item.name || item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={t('search_placeholder')}
        value={query}
        onChangeText={handleSearch}
        style={styles.input}
      />

      {/* Skeleton Loader while fetching */}
      {loading && (
        <SkeletonContent
          containerStyle={{ flex: 1 }}
          isLoading={loading}
          layout={[
            // Skeleton for users
            { key: 'user1', width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
            { key: 'user2', width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
            // Skeleton for posts
            { key: 'post1', width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
            { key: 'post2', width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
          ]}
        />
      )}

      {!loading && postResults.length === 0 && userResults.length === 0 && query.trim().length > 0 && (
        <Text style={styles.noResults}>{t('no_results')}</Text>
      )}

      {/* Users Section */}
      {!loading && userResults.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('users')}</Text>
          <FlatList
            data={userResults}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            style={{ marginBottom: 20 }}
          />
        </>
      )}

      {/* Posts Section */}
      {!loading && postResults.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('posts')}</Text>
          <FlatList
            data={postResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PostCard post={item} />}
            style={{ marginTop: 10 }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 12, fontSize: 16 },
  noResults: { marginTop: 20, textAlign: 'center', color: '#888' },
  sectionTitle: { fontWeight: 'bold', fontSize: 18, marginVertical: 10, color: '#333' },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  userAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
});
