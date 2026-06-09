import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
      const [phone, setPhone] = useState('');
        const [password, setPassword] = useState('');
          const [accountType, setAccountType] = useState('Personal');
            const [country, setCountry] = useState('');
              const [gender, setGender] = useState('');
                const [bio, setBio] = useState('');
                  const [photo, setPhoto] = useState<string | null>(null);

                    /* PICK IMAGE FROM GALLERY */
                      const pickImage = async () => {
                          const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                      allowsEditing: true,
                                            quality: 1
                                                });

                                                    if (!result.canceled) {
                                                          setPhoto(result.assets[0].uri);
                                                              }
                                                                };

                                                                  /* TAKE PHOTO WITH CAMERA */
                                                                    const takePhoto = async () => {
                                                                        const result = await ImagePicker.launchCameraAsync({
                                                                              allowsEditing: true,
                                                                                    quality: 1
                                                                                        });

                                                                                            if (!result.canceled) {
                                                                                                  setPhoto(result.assets[0].uri);
                                                                                                      }
                                                                                                        };

                                                                                                          /* VALIDATE PASSWORD RULES */
                                                                                                            const isPasswordValid = (pass: string) => {
                                                                                                                // 1. Must include at least 2 numbers: (?=(?:.*[0-9]){2,})
                                                                                                                    // 2. Must include at least 1 special character: (?=.*[!@#$%^&*(),.?":{}|<>])
                                                                                                                        // 3. Must include at least 1 uppercase and 1 lowercase letter: (?=.*[a-z])(?=.*[A-Z])
                                                                                                                            // 4. Characters must be between 8 and 16 characters long: .{8,16}$
                                                                                                                                const passwordRegex = /^(?=(?:.*[0-9]){2,})(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-z])(?=.*[A-Z]).{8,16}$/;
                                                                                                                                    return passwordRegex.test(pass);
                                                                                                                                      };

                                                                                                                                        /* REGISTER USER */
                                                                                                                                          const registerUser = async () => {
    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = email.trim();

      if (!cleanUsername) {
        Alert.alert("Error", "Username is required");
        return;
      }

      if (!isPasswordValid(password)) {
        Alert.alert(
          "Weak Password",
          "Your password must meet the following requirements:\n" +
            "• Between 8 and 16 characters long\n" +
            "• At least 2 numeric digits\n" +
            "• At least 1 special character\n" +
            "• At least 1 uppercase and 1 lowercase letter"
        );
        return;
      }

      const usernameRef = database().ref(`usernames/${cleanUsername}`);
      const snapshot = await usernameRef.once('value');

      if (snapshot.exists()) {
        Alert.alert("Error", "Username already taken");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = userCredential.user.uid;

      await usernameRef.set(uid);

      let photoURL = '';
      if (photo) {
        const filename = `profilePhotos/${uid}.jpg`;
        const reference = storage().ref(filename);
        await reference.putFile(photo);
        photoURL = await reference.getDownloadURL();
      }

      await database().ref(`users/${uid}`).set({
        username: cleanUsername,
        email: cleanEmail,
        phone,
        accountType,
        country,
        gender: accountType === 'Personal' ? gender : null,
        bio,
        photo: photoURL,
        verified: false,
        createdAt: Date.now(),
      });

      Alert.alert("Success", "Account created successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.label}>Profile Photo</Text>
      {photo && (
        <Image
          source={{ uri: photo }}
          style={{ width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 10 }}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Choose Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Username (unique)"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        keyboardType="phone-pad"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Account Type</Text>
      <Picker
        selectedValue={accountType}
        onValueChange={(itemValue) => setAccountType(itemValue)}
      >
        <Picker.Item label="Personal Account" value="Personal" />
        <Picker.Item label="Forum Account" value="Forum" />
        <Picker.Item label="Institutional Account" value="Institutional" />
        <Picker.Item label="Ministerial Account" value="Ministerial" />
        <Picker.Item label="Organizational Account" value="Organizational" />
      </Picker>
      <TextInput
        placeholder="Country of residence"
        value={country}
        onChangeText={setCountry}
        style={styles.input}
      />
      {accountType === 'Personal' && (
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
        </Picker>
      )}
      <TextInput
        placeholder="Bio / Description (Optional)"
        value={bio}
        onChangeText={setBio}
        style={styles.input}
      />
      <TouchableOpacity style={styles.button} onPress={registerUser}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});