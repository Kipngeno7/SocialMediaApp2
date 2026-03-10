// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import './src/i18n/i18n';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
