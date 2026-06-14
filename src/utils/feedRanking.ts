// feedRanking.ts
import { supabase } from "../config/supabase";

/**
 * Normalizes timestamps from both Firebase (numbers) and Supabase (ISO Strings)
  * Kept for fallback/hybrid clientside tracking if needed.
   */
   const parseTimestamp = (createdAt: any): number => {
     if (!createdAt) return Date.now();
       if (typeof createdAt === 'number') return createdAt; 
         if (createdAt.seconds) return createdAt.seconds * 1000; 
           return new Date(createdAt).getTime(); 
           };

           export const calculateTimeDecay = (createdAt: any) => {
             const timeMs = parseTimestamp(createdAt);
               const hoursOld = (Date.now() - timeMs) / (1000 * 60 * 60);
                 return Math.exp(-0.05 * hoursOld); 
                 };

                 export const calculateTrendingBoost = (post: any) => {
                   const reactions = post.likes || post.likes_count || 0;
                     const comments = post.comments?.length || post.comments_count || 0;
                       const shares = post.shares || post.shares_count || 0;
                         const watchTime = post.watchTime || post.watch_time || 0;

                           return reactions * 2 + comments * 3 + shares * 4 + watchTime * 0.5;
                           };

                           export const calculateVerifiedBoost = (post: any) => {
                             const isVerified = post.user?.isVerified || post.profiles?.is_verified || post.is_verified || false;
                               return isVerified ? 20 : 0;
                               };

                               export const calculateAIScore = (post: any) => {
                                 const textContent = post.text || post.content || "";
                                   return textContent.length > 200 ? 5 : 0;
                                   };

                                   // NEW: Client-side personalized calculation helper
                                   export const calculatePersonalizedBoost = (post: any, userInterests: string[]) => {
                                     if (!post.tags || !userInterests) return 0;
                                       const hasMatch = post.tags.some((tag: string) => userInterests.includes(tag));
                                         return hasMatch ? 15 : 0;
                                         };

                                         export const calculateFinalScore = (post: any, userInterests: string[] = []) => {
                                           const baseScore = post.rankScore || post.rank_score || 0;

                                             const trending = calculateTrendingBoost(post);
                                               const verified = calculateVerifiedBoost(post);
                                                 const ai = calculateAIScore(post);
                                                   const personalization = calculatePersonalizedBoost(post, userInterests);
                                                     const decay = calculateTimeDecay(post.created_at || post.createdAt);

                                                       return (baseScore + trending + verified + ai + personalization) * decay;
                                                       };

                                                       /**
                                                        * UPGRADED: Fetches highly optimized, personalized ranked feed straight from Supabase engine.
                                                         * @param userInterests Array of tags the current user prefers (e.g. ['tech', 'gaming'])
                                                          * @param limitCount Number of posts to retrieve
                                                           */
                                                           export const getRankedSupabaseFeed = async (userInterests: string[] = [], limitCount = 20) => {
                                                             try {
                                                                 // Invoke the PostgreSQL function securely database-side
                                                                     const { data: rankedPosts, error } = await supabase.rpc('get_ranked_personalized_feed', {
                                                                           current_user_interests: userInterests,
                                                                                 limit_count: limitCount
                                                                                     });

                                                                                         if (error) throw error;
                                                                                             return rankedPosts || [];

                                                                                               } catch (error) {
                                                                                                   console.log("Error generating database-side ranked feed:", error);
                                                                                                       return [];
                                                                                                         }
                                                                                                         };
