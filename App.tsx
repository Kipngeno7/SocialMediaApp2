// App.tsx
import React from 'react';
import 'react-native-url-polyfill/auto';

import { Text, ScrollView } from 'react-native';

import './src/i18n/i18n';
import AppNavigator from './src/navigation/AppNavigator';

type StateType = {
  error: any;
};

export default class App extends React.Component<{}, StateType> {

  constructor(props: {}) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, info: any) {
    console.log("CRASH ERROR:", error);
    console.log("ERROR INFO:", info);
  }

  render() {

    // 🔴 If app crashes → show error on screen
    if (this.state.error) {
      return (
        <ScrollView
          style={{
            flex: 1,
            padding: 20,
            backgroundColor: "white"
          }}
        >
          <Text
            style={{
              fontSize: 20,
              color: "red",
              marginBottom: 20
            }}
          >
            App Crash Detected
          </Text>

          <Text selectable>
            {String(this.state.error)}
          </Text>
        </ScrollView>
      );
    }

    // ✅ NORMAL APP LOAD (NO NavigationContainer here)
    return <AppNavigator />;
  }
}
