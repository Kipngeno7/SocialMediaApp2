import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Types ---
export interface Post {
  id: string;
  user: { name: string; avatar?: string; isVerified?: boolean };
  text: string;
  category?: string;
  otherCategoryText?: string;
  mediaUris?: string[];
  audioUri?: string | null;
  pickedAudioUri?: string | null;
  likes?: number;
  liked?: boolean;
  comments?: any[];
  isLive?: boolean;
  liveStartTime?: number;
  rankScore: number; // Required for sorting
  createdAt: number;  
}

interface PostContextType {
  rankedPosts: Post[];
  addPost: (post: Omit<Post, "id" | "rankScore" | "createdAt">) => void;
  deletePost: (postId: string) => void;
  editPost: (postId: string, newText: string) => void;
  boostPostRanking: (postId: string, weight: number) => void;
  addComment: (postId: string, comment: any) => void;
  startLive: (postId: string) => void;
  stopLive: (postId: string) => void;
  isLoading: boolean;
}

const STORAGE_KEY = "@social_app_posts";
const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider = ({ children }: { children: React.ReactNode }) => {
  const [rankedPosts, setRankedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Persistence: Load posts on Startup
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const savedPosts = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedPosts) {
          setRankedPosts(JSON.parse(savedPosts));
        }
      } catch (e) {
        console.error("Failed to load posts", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, []);

  // 2. Persistence: Save posts whenever the list changes
  useEffect(() => {
    const savePosts = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rankedPosts));
      } catch (e) {
        console.error("Failed to save posts", e);
      }
    };
    if (!isLoading) savePosts();
  }, [rankedPosts, isLoading]);

  // 3. Ranking Logic: Sort posts by rankScore (Highest first), then by date
  const sortedPosts = useMemo(() => {
    return [...rankedPosts].sort((a, b) => {
      if (b.rankScore !== a.rankScore) {
        return (b.rankScore || 0) - (a.rankScore || 0);
      }
      return b.createdAt - a.createdAt;
    });
  }, [rankedPosts]);

  // 4. Optimized Actions (useCallback prevents child components from re-rendering)
  const addPost = useCallback((post: Omit<Post, "id" | "rankScore" | "createdAt">) => {
    const newPost: Post = { 
      ...post, 
      id: Date.now().toString(), 
      rankScore: 0, 
      createdAt: Date.now(),
      comments: [] 
    };
    setRankedPosts(prev => [newPost, ...prev]);
  }, []);

  const deletePost = useCallback((postId: string) => {
    setRankedPosts(prev => prev.filter(post => post.id !== postId));
  }, []);

  const editPost = useCallback((postId: string, newText: string) => {
    setRankedPosts(prev => prev.map(post => (post.id === postId ? { ...post, text: newText } : post)));
  }, []);

  const boostPostRanking = useCallback((postId: string, weight: number) => {
    setRankedPosts(prev =>
      prev.map(post => (post.id === postId ? { ...post, rankScore: (post.rankScore || 0) + weight } : post))
    );
  }, []);

  const addComment = useCallback((postId: string, comment: any) => {
    setRankedPosts(prev =>
      prev.map(post => (post.id === postId ? { ...post, comments: [...(post.comments || []), comment] } : post))
    );
  }, []);

  const startLive = useCallback((postId: string) => {
    setRankedPosts(prev => prev.map(p => p.id === postId ? { ...p, isLive: true, liveStartTime: Date.now() } : p));
  }, []);

  const stopLive = useCallback((postId: string) => {
    setRankedPosts(prev => prev.map(p => p.id === postId ? { ...p, isLive: false } : p));
  }, []);

  // 5. Memoize the Provider Value
  const value = useMemo(() => ({
    rankedPosts: sortedPosts,
    addPost,
    deletePost,
    editPost,
    boostPostRanking,
    addComment,
    startLive,
    stopLive,
    isLoading
  }), [sortedPosts, addPost, deletePost, editPost, boostPostRanking, addComment, startLive, stopLive, isLoading]);

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (!context) throw new Error("usePosts must be used within a PostProvider");
  return context;
};
