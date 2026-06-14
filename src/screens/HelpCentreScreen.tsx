import React from 'react';
import { View, Text } from 'react-native';
import {supabase} from '../config/supabase';

export default function HelpCentreScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Help Centre</Text>
    </View>
  );
}
