import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { auth } from '../firebaseConfig';
import { subscribeToNotifications } from '../services/notificationListener';
import { followUser } from '../services/followService';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = subscribeToNotifications(
      auth.currentUser.uid,
      setNotifications
    );

    return () => unsubscribe();
  }, []);

  const handleFollowBack = async (fromUserId: string) => {
    if (!auth.currentUser) return;
    await followUser(auth.currentUser.uid, fromUserId);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 15 }}>
            {item.type === 'follow' && (
              <>
                <Text>{item.fromUserId} started following you</Text>
                <Button
                  title="Follow Back"
                  onPress={() => handleFollowBack(item.fromUserId)}
                />
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}
