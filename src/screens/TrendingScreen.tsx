// src/screens/TrendingScreen.tsx
import React, { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { subscribeToCountryTrending, subscribeToGlobalTrending } from "../services/postService";
import PostCard from "../components/PostCard";
import { auth } from "../firebaseConfig";

// Helper: Convert ISO country code to emoji flag
const countryFlag = (countryCode: string) =>
  countryCode
    ? countryCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(127397 + char.charCodeAt(0))
        )
    : "";

export default function TrendingScreen() {
  const [countryPosts, setCountryPosts] = useState<any[]>([]);
  const [globalPosts, setGlobalPosts] = useState<any[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Determine user country: use stored profile info if exists
    const countryFromProfile = (auth.currentUser as any).country || null;
    setUserCountry(countryFromProfile);

    if (!countryFromProfile) return;

    const unsubscribeCountry = subscribeToCountryTrending(countryFromProfile, setCountryPosts);
    const unsubscribeGlobal = subscribeToGlobalTrending(setGlobalPosts);

    return () => {
      unsubscribeCountry();
      unsubscribeGlobal();
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      {userCountry && countryPosts.length > 0 && (
        <>
          <Text style={styles.trendingHeader}>
            {countryFlag(userCountry)} Trending in {userCountry}
          </Text>
          {countryPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </>
      )}

      {globalPosts.length > 0 && (
        <>
          <Text style={styles.trendingHeader}>🌍 Trending Worldwide</Text>
          {globalPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  trendingHeader: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
});
