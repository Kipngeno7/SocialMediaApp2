// src/services/moderationService.ts

import axios from 'axios';

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
 * Async text moderation via AI
 */
export const checkModeration = async (text: string): Promise<ModerationResult> => {
  // First do local check
  const localResult = checkLocalModeration(text);
  if (!localResult.allowed) return localResult;

  // Optional: extend with AI-based text moderation
  const forbiddenWords = ["hate", "terrorism", "violence", "spam"];
  const found = forbiddenWords.find(word => text.toLowerCase().includes(word));

  return {
    allowed: !found,
    reason: found ? `Contains forbidden content: ${found}` : "",
  };
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
    if (!allowed) reason = "Image contains restricted content";

    return { allowed, reason, safeSearch };
  } catch (err) {
    console.log("Image moderation error:", err);
    return { allowed: false, reason: "Moderation failed" };
  }
};
