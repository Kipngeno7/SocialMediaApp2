// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import PeopleYouMayFollow from '../components/PeopleYouMayFollow';
import PostCard from '../components/PostCard';
import { connectSocket, subscribeToNewPosts } from '../services/socketService';
import {
  subscribeToPosts,
  subscribeToCountryTrending,
  subscribeToGlobalTrending,
} from '../services/postService';
import { subscribeToNotifications } from '../services/notificationListener';
import { auth } from '../firebaseConfig';
import { useTranslation } from 'react-i18next'; // <-- Added for translations

export default function HomeScreen() {
  const { t } = useTranslation(); // <-- i18next hook

  const [posts, setPosts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [countryTrending, setCountryTrending] = useState<any[]>([]);
  const [globalTrending, setGlobalTrending] = useState<any[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // --- Swipe-to-refresh & load-more states ---
  const [refreshing, setRefreshing] = useState(false);
  const [feedLimit, setFeedLimit] = useState(10); // main feed
  const [trendingLimit, setTrendingLimit] = useState(10); // trending posts

  // --- Helper: Convert ISO country code to flag emoji ---
  const countryFlag = (countryCode: string) =>
    countryCode
      ? countryCode
          .toUpperCase()
          .replace(/./g, (char) =>
            String.fromCodePoint(127397 + char.charCodeAt(0))
          )
      : '';

  // --- WebSocket subscription for new posts ---
  useEffect(() => {
    if (!auth.currentUser) return;

    connectSocket(auth.currentUser.uid);

    subscribeToNewPosts((newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });
  }, [auth.currentUser]);

  // --- Firestore subscription for main feed (media-enabled) ---
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = subscribeToPosts(setPosts, feedLimit);
    return () => unsubscribe();
  }, [auth.currentUser, feedLimit]);

  // --- Notifications subscription ---
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = subscribeToNotifications(auth.currentUser.uid, setNotifications);
    return () => unsubscribe();
  }, [auth.currentUser]);

  // --- Get user location for country trending ---
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync(location.coords);
        if (geo.length > 0) {
          setUserCountry(geo[0].country || null);
        }
      } catch (e) {
        console.log("Location permission error:", e);
      }
    })();
  }, []);

  // --- Subscribe to trending posts ---
  useEffect(() => {
    if (!userCountry) return;

    const unsubscribeCountry = subscribeToCountryTrending(userCountry, setCountryTrending, trendingLimit);
    const unsubscribeGlobal = subscribeToGlobalTrending(setGlobalTrending, trendingLimit);

    return () => {
      unsubscribeCountry();
      unsubscribeGlobal();
    };
  }, [userCountry, trendingLimit]);

  // --- Swipe-to-refresh handler ---
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      // Refresh trending posts
      if (userCountry) {
        const unsubscribeCountry = subscribeToCountryTrending(userCountry, setCountryTrending, trendingLimit);
        const unsubscribeGlobal = subscribeToGlobalTrending(setGlobalTrending, trendingLimit);
        unsubscribeCountry();
        unsubscribeGlobal();
      }

      // Refresh main feed
      const unsubscribeFeed = subscribeToPosts(setPosts, feedLimit);
      unsubscribeFeed();

    } catch (err) {
      console.log("Error refreshing:", err);
    }

    setRefreshing(false);
  }, [userCountry, feedLimit, trendingLimit]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Horizontal follow suggestions */}
      <PeopleYouMayFollow />

      {/* Country Trending Section */}
      {userCountry && countryTrending.length > 0 && (
        <View style={styles.trendingSection}>
          <Text style={styles.trendingHeader}>
            {countryFlag(userCountry)} {t('trending_in')} {userCountry}
          </Text>
          {countryTrending.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <Text
            style={styles.loadMore}
            onPress={() => setTrendingLimit((prev) => prev + 10)}
          >
            {t('load_more_country_trending')}
          </Text>
        </View>
      )}

      {/* Global Trending Section */}
      {globalTrending.length > 0 && (
        <View style={styles.trendingSection}>
          <Text style={styles.trendingHeader}>{t('trending_worldwide')}</Text>
          {globalTrending.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <Text
            style={styles.loadMore}
            onPress={() => setTrendingLimit((prev) => prev + 10)}
          >
            {t('load_more_global_trending')}
          </Text>
        </View>
      )}

      {/* Main real-time feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        scrollEnabled={false} // Scroll handled by ScrollView
        style={{ marginTop: 20 }}
        onEndReached={() => setFeedLimit((prev) => prev + 10)}
        onEndReachedThreshold={0.5}
      />

      {/* Notifications */}
      {notifications.length > 0 && (
        <View style={styles.notifications}>
          <Text>{notifications.length} {t('new_notifications')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  trendingSection: {
    marginVertical: 15,
  },
  trendingHeader: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  notifications: {
    padding: 10,
    backgroundColor: '#fef3c7',
    marginVertical: 10,
    borderRadius: 8,
  },
  loadMore: {
    color: 'blue',
    marginTop: 10,
    marginBottom: 10,
  },
});
