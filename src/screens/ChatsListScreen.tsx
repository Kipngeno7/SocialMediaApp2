// src/screens/ChatsListScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Mock data for testing - you can connect this to Firebase later!
const MOCK_CHATS = [
  { id: 'user_1', name: 'Kipngeno Tuei', lastMessage: 'Hey, are you free later?', time: '10:42 AM' },
    { id: 'user_2', name: 'Donald Xi Trump', lastMessage: 'The live stream was awesome!', time: 'Yesterday' },
    ];

    export default function ChatsListScreen({ navigation }: any) {
      return (
          <View style={styles.container}>
                <FlatList
                        data={MOCK_CHATS}
                                keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => (
                                                  <TouchableOpacity 
                                                              style={styles.chatItem}
                                                                          onPress={() => navigation.navigate('Chat', { otherUserId: item.id })}
                                                                                    >
                                                                                                <View style={styles.avatar}>
                                                                                                              <Ionicons name="person" size={24} color="#666" />
                                                                                                                          </View>
                                                                                                                                      <View style={styles.chatInfo}>
                                                                                                                                                    <View style={styles.headerRow}>
                                                                                                                                                                    <Text style={styles.name}>{item.name}</Text>
                                                                                                                                                                                    <Text style={styles.time}>{item.time}</Text>
                                                                                                                                                                                                  </View>
                                                                                                                                                                                                                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                                                                                                                                                                                                                            </View>
                                                                                                                                                                                                                                      </TouchableOpacity>
                                                                                                                                                                                                                                              )}
                                                                                                                                                                                                                                                    />
                                                                                                                                                                                                                                                        </View>
                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                          }

                                                                                                                                                                                                                                                          const styles = StyleSheet.create({
                                                                                                                                                                                                                                                            container: { flex: 1, backgroundColor: '#fff' },
                                                                                                                                                                                                                                                              chatItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
                                                                                                                                                                                                                                                                avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
                                                                                                                                                                                                                                                                  chatInfo: { flex: 1 },
                                                                                                                                                                                                                                                                    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
                                                                                                                                                                                                                                                                      name: { fontSize: 16, fontWeight: 'bold' },
                                                                                                                                                                                                                                                                        time: { fontSize: 12, color: '#999' },
                                                                                                                                                                                                                                                                          lastMessage: { fontSize: 14, color: '#666' }
                                                                                                                                                                                                                                                                          });
                                                                                                                                                                                                                                                                          