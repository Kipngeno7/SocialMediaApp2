// src/services/moderationService.ts

import axios from 'axios';
import { supabase } from '../config/supabase'; // Adjust path based on your setup

export interface ModerationResult {
  allowed: boolean;
    reason?: string;
      safeSearch?: any; // optional for image results
      }

      // ==========================
      // Local text checks (hate/violence/spam)
      // ==========================
      const bannedWords = [
        "kill",
          "terrorist",
            "bomb",
              "rape",
                "suicide",
                  "racist",
                    "nazi",
                      "isis"
                      ];

                      const spamPatterns = [
                        "buy now",
                          "free money",
                            "click here",
                              "visit this link",
                                "work from home and earn"
                                ];

                                /**
                                 * Local moderation check
                                  */
                                  export function checkLocalModeration(text: string): ModerationResult {
                                    if (!text) return { allowed: true };

                                      const lowerText = text.toLowerCase();

                                        // Hate speech / violence detection
                                          for (const word of bannedWords) {
                                              if (lowerText.includes(word)) {
                                                    return {
                                                            allowed: false,
                                                                    reason: "Post blocked: harmful or violent language detected"
                                                                          };
                                                                              }
                                                                                }

                                                                                  // Spam detection
                                                                                    for (const pattern of spamPatterns) {
                                                                                        if (lowerText.includes(pattern)) {
                                                                                              return {
                                                                                                      allowed: false,
                                                                                                              reason: "Post blocked: spam detected"
                                                                                                                    };
                                                                                                                        }
                                                                                                                          }

                                                                                                                            return { allowed: true };
                                                                                                                            }

                                                                                                                            // ==========================
                                                                                                                            // AI / Google moderation
                                                                                                                            // ==========================
                                                                                                                            const API_KEY = "AIzaSyBENTn6_kNEPHh6coA7j2cljT5oi8glopk";

                                                                                                                            /**
                                                                                                                             * Helper function to log flagged content to Supabase
                                                                                                                              */
                                                                                                                              const logToSupabase = async (contentType: 'text' | 'image', preview: string, reason: string) => {
                                                                                                                                try {
                                                                                                                                    const { data: { user } } = await supabase.auth.getUser();
                                                                                                                                        
                                                                                                                                            await supabase
                                                                                                                                                  .from('moderation_logs')
                                                                                                                                                        .insert([
                                                                                                                                                                {
                                                                                                                                                                          user_id: user?.id || null,
                                                                                                                                                                                    content_type: contentType,
                                                                                                                                                                                              content_preview: preview.substring(0, 100), // Limit storage size
                                                                                                                                                                                                        reason: reason
                                                                                                                                                                                                                }
                                                                                                                                                                                                                      ]);
                                                                                                                                                                                                                        } catch (err) {
                                                                                                                                                                                                                            console.error("Failed to save moderation log to Supabase:", err);
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                              };

                                                                                                                                                                                                                              /**
                                                                                                                                                                                                                               * Async text moderation via AI
                                                                                                                                                                                                                                */
                                                                                                                                                                                                                                export const checkModeration = async (text: string): Promise<ModerationResult> => {
                                                                                                                                                                                                                                  // First do local check
                                                                                                                                                                                                                                    const localResult = checkLocalModeration(text);
                                                                                                                                                                                                                                      if (!localResult.allowed) {
                                                                                                                                                                                                                                          await logToSupabase('text', text, localResult.reason || "Local filter match");
                                                                                                                                                                                                                                              return localResult;
                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                  // Optional: extend with AI-based text moderation
                                                                                                                                                                                                                                                    const forbiddenWords = ["hate", "terrorism", "violence", "spam"];
                                                                                                                                                                                                                                                      const found = forbiddenWords.find(word => text.toLowerCase().includes(word));

                                                                                                                                                                                                                                                        const result = {
                                                                                                                                                                                                                                                            allowed: !found,
                                                                                                                                                                                                                                                                reason: found ? `Contains forbidden content: ${found}` : "",
                                                                                                                                                                                                                                                                  };

                                                                                                                                                                                                                                                                    if (!result.allowed) {
                                                                                                                                                                                                                                                                        await logToSupabase('text', text, result.reason);
                                                                                                                                                                                                                                                                          }

                                                                                                                                                                                                                                                                            return result;
                                                                                                                                                                                                                                                                            };

                                                                                                                                                                                                                                                                            /**
                                                                                                                                                                                                                                                                             * Async image moderation via Google Vision API
                                                                                                                                                                                                                                                                              */
                                                                                                                                                                                                                                                                              export const checkImageModeration = async (imageBase64: string): Promise<ModerationResult> => {
                                                                                                                                                                                                                                                                                try {
                                                                                                                                                                                                                                                                                    const response = await axios.post(
                                                                                                                                                                                                                                                                                          `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
                                                                                                                                                                                                                                                                                                {
                                                                                                                                                                                                                                                                                                        requests: [
                                                                                                                                                                                                                                                                                                                  {
                                                                                                                                                                                                                                                                                                                              image: { content: imageBase64 },
                                                                                                                                                                                                                                                                                                                                          features: [{ type: "SAFE_SEARCH_DETECTION" }],
                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                            ],
                                                                                                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                                                                                                      );

                                                                                                                                                                                                                                                                                                                                                                          const safeSearch = response.data.responses[0].safeSearchAnnotation;
                                                                                                                                                                                                                                                                                                                                                                              const allowed =
                                                                                                                                                                                                                                                                                                                                                                                    safeSearch.adult !== "LIKELY" &&
                                                                                                                                                                                                                                                                                                                                                                                          safeSearch.violence !== "LIKELY" &&
                                                                                                                                                                                                                                                                                                                                                                                                safeSearch.racy !== "LIKELY";

                                                                                                                                                                                                                                                                                                                                                                                                    let reason = "";
                                                                                                                                                                                                                                                                                                                                                                                                        if (!allowed) {
                                                                                                                                                                                                                                                                                                                                                                                                              reason = "Image contains restricted content";
                                                                                                                                                                                                                                                                                                                                                                                                                    await logToSupabase('image', 'Base64 Data String', reason);
                                                                                                                                                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                                                                                                                                                            return { allowed, reason, safeSearch };
                                                                                                                                                                                                                                                                                                                                                                                                                              } catch (err) {
                                                                                                                                                                                                                                                                                                                                                                                                                                  console.log("Image moderation error:", err);
                                                                                                                                                                                                                                                                                                                                                                                                                                      return { allowed: false, reason: "Moderation failed" };
                                                                                                                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                                                                                                        };
