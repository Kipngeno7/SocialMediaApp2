// app/context/PostContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

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
  rankScore?: number;
createdAt?: number;  
}

interface PostContextType {
  rankedPosts: Post[];
  addPost: (post: Post) => void;
  boostPostRanking?: (postId: string, score: number) => void;
  editPost?: (postId: string, text: string) => void;
  deletePost?: (postId: string) => void;
  startLive?: (postId: string) => void;
  stopLive?: (postId: string) => void;
}
 
  addPost: (post: Omit<Post, "id">) => void;
  deletePost: (postId: string) => void;
  editPost: (postId: string, newText: string) => void;
  boostPostRanking: (postId: string, weight: number) => void;
  addComment?: (postId: string, comment: any) => void;
  refreshPosts?: () => void;
}

const PostContext = createContext<PostContextType | null>(null);

export const PostProvider = ({ children }: any) => {
  const [rankedPosts, setRankedPosts] = useState<Post[]>([]);
const addPost = (post: Post) => {
  setRankedPosts(prev => [
    {
      id: Date.now().toString(), // ensure unique id
      ...post,
      rankScore: 0,
      createdAt: Date.now(),
    },
    ...prev,
  ]);
};
     const addPost = (post: Omit<Post, "id">) => {
    const newPost: Post = { id: Date.now().toString(), ...post };
    setRankedPosts(prev => [newPost, ...prev]);
  };
 const deletePost = (postId: string) => {
    setRankedPosts(prev => prev.filter(post => post.id !== postId));
  };

  const editPost = (postId: string, newText: string) => {
    setRankedPosts(prev => prev.map(post => (post.id === postId ? { ...post, text: newText } : post)));
  };

  const boostPostRanking = (postId: string, weight: number) => {
    setRankedPosts(prev =>
      prev.map(post => (post.id === postId ? { ...post, rankScore: (post.rankScore || 0) + weight } : post))
    );
  };

  const addComment = (postId: string, comment: any) => {
    setRankedPosts(prev =>
      prev.map(post => (post.id === postId ? { ...post, comments: [...(post.comments || []), comment] } : post))
    );
  };

  return (
    <PostContext.Provider
  value={{
    rankedPosts,
    addPost,
    boostPostRanking,
    editPost,
    deletePost,
    startLive,
    stopLive,
  }}
>
      
        
     
        
       
       
    
        
    
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (!context) throw new Error("usePosts must be used within a PostProvider");
  return context;
};
