import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import PeopleYouMayFollow from '../components/PeopleYouMayFollow';
import { auth } from '../firebaseConfig';
import { subscribeToNotifications } from '../services/notificationService';

export default function HomeScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);

    // Subscribe to notifications only
      useEffect(() => {
          if (!auth.currentUser) return;

              const unsubscribeNotifs = subscribeToNotifications(auth.currentUser.uid, setNotifications);
                  return () => unsubscribeNotifs();
                    }, [auth.currentUser]);

                      return (
                          <ScrollView style={{ flex: 1, padding: 20 }}>
                                {/* Notifications banner */}
                                      {notifications.length > 0 && (
                                              <View style={styles.notifBanner}>
                                                        <Text style={styles.notifText}>
                                                                    {notifications[0].type === 'follow'
                                                                                  ? `${notifications[0].username} started following you`
                                                                                                : `New notification`}
                                                                                                          </Text>
                                                                                                                  </View>
                                                                                                                        )}

                                                                                                                              {/* Horizontal follow suggestions */}
                                                                                                                                    <PeopleYouMayFollow />
                                                                                                                                        </ScrollView>
                                                                                                                                          );
                                                                                                                                          }

                                                                                                                                          const styles = StyleSheet.create({
                                                                                                                                            notifBanner: {
                                                                                                                                                padding: 10,
                                                                                                                                                    backgroundColor: '#f0f0f0',
                                                                                                                                                        borderRadius: 8,
                                                                                                                                                            marginBottom: 20,
                                                                                                                                                              },
                                                                                                                                                                notifText: {
                                                                                                                                                                    fontWeight: 'bold',
                                                                                                                                                                      },
                                                                                                                                                                      });
                                                                                                                                                                      
