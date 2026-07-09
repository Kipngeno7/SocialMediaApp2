// App.tsx
import React, { useEffect } from 'react';
import 'react-native-url-polyfill/auto';
import { Text, ScrollView, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import './src/i18n/i18n';
import { supabase } from './src/config/supabase'; // Updated to point to Supabase Client
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/services/pushService';

// ==========================================
// 1. CRASH CATCHER (ERROR BOUNDARY)
// ==========================================
type StateType = { error: any };

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, StateType> {
  constructor(props: { children: React.ReactNode }) {
      super(props);
          this.state = { error: null };
            }

              static getDerivedStateFromError(error: any) {
                  return { error };
                    }

                      componentDidCatch(error: any, info: any) {
                          console.log("CRASH ERROR DETECTED:", error);
                              console.log("ERROR INFO:", info);
                                }

                                  render() {
                                      if (this.state.error) {
                                            return (
                                                    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "white", marginTop: 40 }}>
                                                              <Text style={{ fontSize: 24, fontWeight: 'bold', color: "red", marginBottom: 20 }}>
                                                                          App Crash Detected
                                                                                    </Text>
                                                                                              <Text selectable style={{ fontFamily: 'monospace', color: '#333' }}>
                                                                                                          {String(this.state.error.stack || this.state.error)}
                                                                                                                    </Text>
                                                                                                                            </ScrollView>
                                                                                                                                  );
                                                                                                                                      }
                                                                                                                                          return this.props.children;
                                                                                                                                            }
                                                                                                                                            }

                                                                                                                                            // ==========================================
                                                                                                                                            // 2. MAIN APP CONTENT
                                                                                                                                            // ==========================================
                                                                                                                                            export default function App() {
                                                                                                                                              useEffect(() => {
                                                                                                                                                  const registerPush = async () => {
                                                                                                                                                        // 1. Check if a user session already exists in Supabase
                                                                                                                                                              const { data: { session } } = await supabase.auth.getSession();
                                                                                                                                                                    
                                                                                                                                                                          if (session?.user) {
                                                                                                                                                                                  await registerForPushNotifications();
                                                                                                                                                                                        } else {
                                                                                                                                                                                                // 2. Otherwise, set up an active auth state change listener for Supabase
                                                                                                                                                                                                        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
                                                                                                                                                                                                                  if (currentSession?.user) {
                                                                                                                                                                                                                              await registerForPushNotifications();
                                                                                                                                                                                                                                          subscription.unsubscribe(); // Stop listening once registration succeeds
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                      };

                                                                                                                                                                                                                                                                          registerPush();
                                                                                                                                                                                                                                                                            }, []);

                                                                                                                                                                                                                                                                              return (
                                                                                                                                                                                                                                                                                  <ErrorBoundary>
                                                                                                                                                                                                                                                                                        <NavigationContainer>
                                                                                                                                                                                                                                                                                                <AppNavigator />
                                                                                                                                                                                                                                                                                                      </NavigationContainer>
                                                                                                                                                                                                                                                                                                          </ErrorBoundary>
                                                                                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                            
                                

                            
                        
                                    
                                        
                                                    
                                                                        
                                                                    
                                                                                                                                          
                                                                                                                                              
                                                                                                                                                    
                                                                                                                                                                
                                                                                                                                                                  
                                                                                                                                                                              
                                                                                                                                                                                        
                                                                                                                                                                                                  
                                                                                                                                                                                                                  
                                                                                                                                                                                                                        
                                                                                                                                                                                                                                  
                                                                                                                                                                                                              

                                                                                                                                                                                                                    
                                                                                                                                                                                                                                  

                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                        