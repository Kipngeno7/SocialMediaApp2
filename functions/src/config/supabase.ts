import 'react-native-url-polyfill/auto'; // MUST be at the very top
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://jywoururkjaszyfrfqnd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-ABLfwp1OMA0J2WWf_77_A_09NtlfIy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
        storage: AsyncStorage,
                  autoRefreshToken: true,
                                persistSession: true,
                                                  detectSessionInUrl: false,
                                                                      },
                                                                                          });

                                                                                                              // Tells Supabase to refresh auth tokens when the app foregrounds
                                                                                                                                  AppState.addEventListener('change', (state) => {
                                                                                                                                                        if (state === 'active') {
                                                                                                                                                                                  supabase.auth.startAutoRefresh();
                                                                                                                                                                                                              } else {
                                                                                                                                                                                                                                              supabase.auth.stopAutoRefresh();
                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                  });
                                                                                                                                                                                                                                                                                                                                                    