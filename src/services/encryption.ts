// src/services/encryption.ts
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique secret key per chat
 * Typically store this key in Firestore per chat, NOT hardcoded
 */
export const generateChatKey = (): string => {
  return uuidv4(); // returns a unique UUID to use as a secret key
};

/**
 * Encrypt a message with a specific key
 * @param text message to encrypt
 * @param secretKey unique key for this chat
 */
export const encryptMessage = (text: string, secretKey: string): string => {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
};

/**
 * Decrypt a message with a specific key
 * @param ciphertext encrypted text
 * @param secretKey unique key for this chat
 */
export const decryptMessage = (ciphertext: string, secretKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
