import 'react-native-url-polyfill/auto'; // MUST be at the very top
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://jywoururkjaszyfrfqnd.supabase.co';

// WARNING: Ensure this is your real Supabase Anon Key from your Supabase Dashboard API Settings (starts with eyJhbGci)
const supabaseAnonKey = 'sb_publishable_-ABLfwp1OMA0J2WWf_77_A_09NtlfIy'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
      storage: AsyncStorage,
          autoRefreshToken: true,
              persistSession: true,
                  detectSessionInUrl: false,
                    },
                    });

                    // Correct modern event listener registration for React Native
                    AppState.addEventListener('change', (nextAppState) => {
                      if (nextAppState === 'active') {
                          supabase.auth.startAutoRefresh();
                            } else {
                                supabase.auth.stopAutoRefresh();
                                  }
                                  });
                                  
                                                                                                                                                                                                                                                                                                                                                    