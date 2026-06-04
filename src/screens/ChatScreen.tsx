// src/screens/ChatScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Button,
} from 'react-native';
import {
  sendMessage,
  subscribeToChat,
  editMessage,
  deleteMessage,
  getOrCreateChat,
} from '../services/chatService';
import { decryptMessage } from '../services/encryption';
import { auth, db } from '../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { doc, collection, updateDoc, onSnapshot, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next'; // <-- i18next import

interface ChatScreenProps {
  route: { params: { otherUserId: string } };
}

export default function ChatScreen({ route }: ChatScreenProps) {
  const { otherUserId } = route.params;
  const [chatId, setChatId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const currentUserId = auth.currentUser?.uid;

  const { t } = useTranslation(); // <-- initialize translation hook

  // Initialize chat & subscribe messages
  useEffect(() => {
    if (!currentUserId) return;
    const initChat = async () => {
      const id = await getOrCreateChat(currentUserId, otherUserId);
      setChatId(id);

      // Pagination - first 20 messages
      const q = query(
        collection(db, 'chats', id, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      setLastVisible(snap.docs[snap.docs.length - 1]);
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Subscribe to real-time updates
      subscribeToChat(id, (msgs) => setMessages(msgs));
    };
    initChat();
  }, [currentUserId, otherUserId]);

  // Typing indicator subscription
  useEffect(() => {
    if (!chatId || !currentUserId) return;
    const typingRef = collection(db, 'chats', chatId, 'typing');
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const usersTyping: string[] = [];
      snapshot.docs.forEach((doc) => {
        if (doc.id !== currentUserId && doc.data().typing) usersTyping.push(doc.id);
      });
      setTypingUsers(usersTyping);
    });
    return unsubscribe;
  }, [chatId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(
        chatId,
          currentUserId!,
            otherUserId,
              text,
                null,
                  null
                  );
    
        
    
    // Update typing status
    const typingRef = doc(db, 'chats', chatId, 'typing', currentUserId!);
    await updateDoc(typingRef, { typing: false });
  };

  

// Async helper to send media files
const handleSendMedia = async (uri: string, type: 'image' | 'video') => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    await sendMessage(
        chatId,
          currentUserId!,
            otherUserId,
              null,
                blob,
                  type
                  );
    
  } catch (err) {
    console.error('Error sending media:', err);
  }
};

// Updated handlePickImage function
const handlePickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 0.7,
  });

  if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];

        await handleSendMedia(
            asset.uri,
                asset.type === 'video' ? 'video' : 'image'
                  );
                  }
  
    
  


  // Audio recording
  


// Helper to send audio files
const handleSendAudio = async (uri: string) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    await sendMessage(
        chatId,
          currentUserId!,
            otherUserId,
              null,
                blob,
                  'audio'
                  );
  } catch (err) {
    console.error('Error sending audio:', err);
  }
};

// Audio recording
const startRecording = async () => {
  try {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const newRecording = new Audio.Recording();
    await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
    
    await newRecording.startAsync();
    setRecording(newRecording);
    setIsRecording(true);
  } catch (err) {
    console.log('Failed to start recording', err);
  }
};

const stopRecording = async () => {
  if (!recording) return;
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI()!;
    setIsRecording(false);
    setRecording(null);

    // Send audio using async wrapper
    await handleSendAudio(uri);
  } catch (err) {
    console.log('Stop recording error', err);
  }
};

const playAudio = async (uri: string) => {
  const { sound } = await Audio.Sound.createAsync({ uri });
  await sound.playAsync();
};

  // Edit/Delete message
  const handleEdit = async (msgId: string) => {
    const newText = prompt(t('edit') + ':'); // <-- translated prompt
    if (newText) await editMessage(chatId, msgId, newText);
  };

  const handleDelete = async (msgId: string) => {
    await deleteMessage(chatId, msgId);
  };

  // Pagination
  const fetchMoreMessages = async () => {
    if (!lastVisible) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      startAfter(lastVisible),
      limit(20)
    );
    const snap = await getDocs(q);
    setLastVisible(snap.docs[snap.docs.length - 1]);
    setMessages((prev) => [
      ...prev,
      ...snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Typing Indicator */}
      {typingUsers.length > 0 && <Text>{t('typing')}</Text>}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        onEndReached={fetchMoreMessages}
        onEndReachedThreshold={0.2}
        renderItem={({ item }) => {
          const decryptedText = item.text
            ? decryptMessage(item.text, chatId)
              : '';
          return (
            <View
              style={[styles.msgContainer, item.senderId === currentUserId ? styles.myMsg : styles.otherMsg]}
            >
              {item.deleted ? (
                <Text style={{ fontStyle: 'italic', color: 'gray' }}>{t('chat_empty')}</Text>
              ) : (
                <>
                  {item.text && (
                    <Text>
                      {decryptedText} {item.edited && '(' + t('edit') + ')'}{' '}
                      {item.readBy?.includes(otherUserId) ? ' ^|^s ^|^s' : ' ^|^s'}
                    </Text>
                  )}
                  {item.mediaUrl && item.mediaType !== 'audio' && (
                    <Image source={{ uri: item.mediaUrl }} style={styles.media} />
                  )}
                  {item.mediaType === 'audio' && item.mediaUrl && (
                    <Button title={t('play_audio')} onPress={() => playAudio(item.mediaUrl)} />
                  )}
                  <Text style={{ fontSize: 12, color: 'gray' }}>
                    {item.timestamp?.toDate ? dayjs(item.timestamp.toDate()).format('HH:mm') : ''}
                  </Text>
                  {item.senderId === currentUserId && (
                    <View style={styles.msgActions}>
                      <Button title={t('edit')} onPress={() => handleEdit(item.id)} />
                      <Button title={t('delete')} onPress={() => handleDelete(item.id)} />
                    </View>
                  )}
                </>
              )}
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          placeholder={t('type_message')}
          value={text}
          onChangeText={async (tVal) => {
            setText(tVal);
            if (chatId && currentUserId) {
              const typingRef = doc(db, 'chats', chatId, 'typing', currentUserId);
              await updateDoc(typingRef, { typing: tVal.length > 0 });
            }
          }}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
          <Text>{t('send')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickImage} style={styles.sendBtn}>
          <Text>+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.sendBtn}>
          <Text>{isRecording ? t('stop') : t('record')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  msgContainer: { padding: 10, borderRadius: 8, marginVertical: 4 },
  myMsg: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end' },
  otherMsg: { backgroundColor: '#EEE', alignSelf: 'flex-start' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, padding: 10, marginRight: 5 },
  sendBtn: { padding: 10, backgroundColor: '#007AFF', borderRadius: 20, justifyContent: 'center', marginHorizontal: 2 },
  media: { width: 150, height: 150, marginTop: 5, borderRadius: 8 },
  msgActions: { flexDirection: 'row', justifyContent: 'space-between' },
});
}