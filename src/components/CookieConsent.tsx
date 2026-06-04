import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const accepted = await AsyncStorage.getItem('cookiesAccepted');
      if (!accepted) setVisible(true);
    })();
  }, []);

  const acceptCookies = async () => {
    await AsyncStorage.setItem('cookiesAccepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#333',
      padding: 15
    }}>
      <Text style={{ color: 'white', fontSize: 14 }}>
        This app uses essential cookies for functionality and monetization.
      </Text>
      <TouchableOpacity onPress={acceptCookies} style={{ marginTop: 10, backgroundColor: '#FFA500', padding: 10, borderRadius: 5 }}>
        <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Accept</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
