// src/screens/SettingsScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebaseConfig';
import database from '@react-native-firebase/database';

export default function SettingsScreen() {

  const navigation = useNavigation();
  const [showTerms, setShowTerms] = useState(false);

  /* VERIFICATION REQUEST FUNCTION */

  const requestVerification = async () => {

    try{

      const uid = auth.currentUser?.uid;

      await database().ref('verificationRequests').push({
        uid,
        status:'pending',
        createdAt: Date.now()
      });

      Alert.alert("Verification request submitted");

    }catch(error){
      Alert.alert("Error","Could not submit request");
    }

  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Original Settings Items */}

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('PrivacySettings')}
      >
        <Text style={styles.text}>Privacy</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('BlockedUsers')}
      >
        <Text style={styles.text}>Blocked Users</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('LanguageSettings')}
      >
        <Text style={styles.text}>Language</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('HelpCenter')}
      >
        <Text style={styles.text}>Help / Support</Text>
      </TouchableOpacity>


      {/* --- NEW UPGRADES --- */}

      {/* Request Verification Button */}

      <TouchableOpacity style={styles.button} onPress={requestVerification}>
        <Text style={styles.buttonText}>Request Verification</Text>
      </TouchableOpacity>


      {/* Toggle Terms & Services */}

      <TouchableOpacity
        style={styles.item}
        onPress={() => setShowTerms(!showTerms)}
      >
        <Text style={styles.text}>Terms & Services</Text>
      </TouchableOpacity>


      {/* Show Terms content inline */}

      {showTerms && (
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            1. Be respectful to all users.{'\n'}
            2. No harassment or hate speech.{'\n'}
            3. No spamming or advertising without permission.{'\n'}
            4. Content must comply with local laws.{'\n'}
            5. All payments and donations are final.{'\n'}
            6. The platform can suspend accounts violating rules.{'\n'}
            7. Use your real profile name for donations.{'\n'}
            8. Cookies are used for app functionality and analytics.
          </Text>
        </View>
      )}


      {/* Cookie Consent Info */}

      <View style={styles.item}>
        <Text style={styles.text}>
          This app uses essential cookies to improve your experience.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:'#fff',
    padding:20
  },

  title:{
    fontSize:24,
    fontWeight:'bold',
    marginBottom:20
  },

  item:{
    padding:15,
    borderBottomWidth:1,
    borderColor:'#eee',
    marginBottom:5
  },

  text:{
    fontSize:16,
    color:'#333'
  },

  termsContainer:{
    backgroundColor:'#f9f9f9',
    padding:15,
    borderRadius:8,
    marginVertical:10
  },

  termsText:{
    fontSize:14,
    color:'#555',
    lineHeight:20
  },

  button:{
    backgroundColor:'#007AFF',
    padding:15,
    borderRadius:8,
    marginTop:10,
    marginBottom:10
  },

  buttonText:{
    color:'#fff',
    textAlign:'center',
    fontWeight:'bold'
  }

});
