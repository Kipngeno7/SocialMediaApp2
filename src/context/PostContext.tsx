import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
// 👇 IMPORT YOUR SUPABASE CLIENT
import { supabase } from "../config/supabase";

// --- Types ---
export interface Post {
  id: string;
    userId: string;
      title: string;
        text: string; // Maps to content in database
          mediaUrl: string | null;
            mediaType: 'image' | 'video' | null;
              likesCount: number;
                commentsCount: number;
                  country: string;
                    rankScore: number; 
                      createdAt: number; // 🌟 UPDATED: Changed from string to number
                        // Local/UI extensions (optional defaults)
                          user?: { name: string; avatar?: string; isVerified?: boolean };
                          }

                          interface PostContextType {
                            rankedPosts: Post[];
                              fetchPosts: () => Promise<void>;
                                deletePost: (postId: string) => Promise<void>;
                                  boostPostRanking: (postId: string, weight: number) => void;
                                    isLoading: boolean;
                                    editPost: (postId: string, newText: string) => void;
                                      startLive: (postId: string) => void;
                                        stopLive: (postId: string) => void;
                                          addComment: (postId: string, userId: string, commentText: string) => Promise<void>;
                                            toggleLike: (postId: string, currentLikes: number) => Promise<void>;
                                            
                                    }

                                    const PostContext = createContext<PostContextType | undefined>(undefined);

                                    export const PostProvider = ({ children }: { children: React.ReactNode }) => {
                                      const [rankedPosts, setRankedPosts] = useState<Post[]>([]);
                                        const [isLoading, setIsLoading] = useState(true);

                                          // 1. Fetch posts from Supabase
                                            const fetchPosts = useCallback(async () => {
                                                try {
                                                      setIsLoading(true);
                                                            const { data, error } = await supabase
                                                                    .from("posts")
                                                                            .select("*")
                                                                                    .order("created_at", { ascending: false });

                                                                                          if (error) throw error;

                                                                                                if (data) {
                                                                                                        // Map database fields to application UI structure
                                                                                                                const mappedPosts: Post[] = data.map((item: any) => ({
                                                                                                                          id: item.id.toString(),
                                                                                                                                    userId: item.user_id,
                                                                                                                                              title: item.title,
                                                                                                                                                        text: item.content,
                                                                                                                                                                  mediaUrl: item.media_url,
                                                                                                                                                                            mediaType: item.media_type,
                                                                                                                                                                                      likesCount: item.likes_count || 0,
                                                                                                                                                                                                commentsCount: item.comments_count || 0,
                                                                                                                                                                                                          country: item.country,
                                                                                                                                                                                                                    rankScore: item.rank_score || 0,
                                                                                                                                                                                                                              createdAt: new Date(item.created_at).getTime(), // 🌟 FIXED: Outputs standard numeric timestamp
                                                                                                                                                                                                                                        user: { name: "User " + item.user_id.slice(0, 4), isVerified: false } // Placeholder until user profiles match
                                                                                                                                                                                                                                                }));
                                                                                                                                                                                                                                                        setRankedPosts(mappedPosts);
                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                  } catch (e) {
                                                                                                                                                                                                                                                                        console.error("Failed to fetch posts from Supabase:", e);
                                                                                                                                                                                                                                                                            } finally {
                                                                                                                                                                                                                                                                                  setIsLoading(false);
                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                        }, []);

                                                                                                                                                                                                                                                                                          // 2. Real-time Setup: Listen for any new posts, deletions, or updates
                                                                                                                                                                                                                                                                                            useEffect(() => {
                                                                                                                                                                                                                                                                                                fetchPosts();

                                                                                                                                                                                                                                                                                                    const channel = supabase
                                                                                                                                                                                                                                                                                                          .channel("public-posts-changes")
                                                                                                                                                                                                                                                                                                                .on(
                                                                                                                                                                                                                                                                                                                        "postgres_changes",
                                                                                                                                                                                                                                                                                                                                { event: "*", schema: "public", table: "posts" },
                                                                                                                                                                                                                                                                                                                                        () => {
                                                                                                                                                                                                                                                                                                                                                  // Re-fetch everything cleanly on any change event
                                                                                                                                                                                                                                                                                                                                                            fetchPosts();
                                                                                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                                                                                          )
                                                                                                                                                                                                                                                                                                                                                                                .subscribe();

                                                                                                                                                                                                                                                                                                                                                                                    return () => {
                                                                                                                                                                                                                                                                                                                                                                                          supabase.removeChannel(channel);
                                                                                                                                                                                                                                                                                                                                                                                              };
                                                                                                                                                                                                                                                                                                                                                                                                }, [fetchPosts]);

                                                                                                                                                                                                                                                                                                                                                                                                  // 3. Ranking Logic: Sort posts by rankScore (Highest first), then by date
                                                                                                                                                                                                                                                                                                                                                                                                    const sortedPosts = useMemo(() => {
                                                                                                                                                                                                                                                                                                                                                                                                        return [...rankedPosts].sort((a, b) => {
                                                                                                                                                                                                                                                                                                                                                                                                              if (b.rankScore !== a.rankScore) {
                                                                                                                                                                                                                                                                                                                                                                                                                      return (b.rankScore || 0) - (a.rankScore || 0);
                                                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                                                                  return b.createdAt - a.createdAt; // 🌟 FIXED: Simple direct number subtraction
                                                                                                                                                                                                                                                                                                                                                                                                                                      });
                                                                                                                                                                                                                                                                                                                                                                                                                                        }, [rankedPosts]);

                                                                                                                                                                                                                                                                                                                                                                                                                                          // 4. Delete Post from Supabase
                                                                                                                                                                                                                                                                                                                                                                                                                                            const deletePost = useCallback(async (postId: string) => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                try {
                                                                                                                                                                                                                                                                                                                                                                                                                                                      const { error } = await supabase
                                                                                                                                                                                                                                                                                                                                                                                                                                                              .from("posts")
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      .delete()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              .eq("id", postId);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    if (error) throw error;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        } catch (e) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              console.error("Error deleting post from Supabase:", e);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    }, []);

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      // 5. Local Ranking Boost (Can be hooked up to RPC/DB increments later)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        const boostPostRanking = useCallback((postId: string, weight: number) => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            setRankedPosts(prev =>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  prev.map(post => (post.id === postId ? { ...post, rankScore: (post.rankScore || 0) + weight } : post))
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        }, []);

  const editPost = useCallback((postId: string, newText: string) => {
      setRankedPosts(prev =>
            prev.map(post => (post.id === postId ? { ...post, text: newText } : post))
                );
  }, []);

  const startLive = useCallback((postId: string) => {
      console.log(`Start live for post ${postId}`);
  }, []);

  const stopLive = useCallback((postId: string) => {
      console.log(`Stop live for post ${postId}`);
  }, []);
  // 💬 Add Comment to Supabase
    const addComment = useCallback(async (postId: string, userId: string, commentText: string) => {
        try {
              // 1. Insert into comments table
                    const { error: commentError } = await supabase
                            .from("comments")
                                    .insert([{ post_id: parseInt(postId), user_id: userId, content: commentText }]);

                                          if (commentError) throw commentError;

                                                // 2. Increment comments counter on the post row
                                                      const { error: postError } = await supabase
                                                              .rpc("increment_comments_count", { row_id: parseInt(postId) });

                                                                    if (postError) console.error("RPC increment failed, trying manual update:", postError.message);
                                                                        } catch (e) {
                                                                              console.error("Error adding comment to Supabase:", e);
                                                                                  }
                                                                                    }, []);

                                                                                      // ❤️ Toggle Like / Increment Like Count in Supabase
                                                                                        const toggleLike = useCallback(async (postId: string, currentLikes: number) => {
                                                                                            try {
                                                                                                  const { error } = await supabase
                                                                                                          .from("posts")
                                                                                                                  .update({ likes_count: currentLikes + 1 })
                                                                                                                          .eq("id", postId);

                                                                                                                                if (error) throw error;
                                                                                                                                    } catch (e) {
                                                                                                                                          console.error("Error updating like count in Supabase:", e);
                                                                                                                                              }
                                                                                                                                                }, []);
                                                                                                                                                
  // Provider Value Configuration
    // Provider Value Configuration
    const value = useMemo(() => ({
      rankedPosts: sortedPosts,
      fetchPosts,
      deletePost,
      boostPostRanking,
      isLoading,
      editPost,
      startLive,
      stopLive,
      addComment,
      toggleLike,
    }), [
      sortedPosts,
      fetchPosts,
      deletePost,
      boostPostRanking,
      isLoading,
      editPost,
      startLive,
      stopLive,
      addComment,
      toggleLike,
    ]);

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

  
    
    
            
                    
                
                    
                
                        
                          

                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                