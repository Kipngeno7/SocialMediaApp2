import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image, ScrollView, Platform, ActivityIndicator } from 'react-native';
import {firebaseConfig} from '../firebaseConfig';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

// Web-safe configuration imports from your central config file
import { auth, db } from '../firebaseConfig';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
    createUserWithEmailAndPassword, 
      sendEmailVerification, 
        signInWithPhoneNumber, 
          PhoneAuthProvider, 
            signInWithCredential, 
            RecaptchaVerifier
            } from 'firebase/auth';
            import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';



import { getDatabase, ref as dbRef, get, set } from 'firebase/database';



export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
    const [identifier, setIdentifier] = useState(''); // Holds either email or phone
      const [isOtpSent, setIsOtpSent] = useState(false);
        const [loading, setLoading] = useState(false);

        const [otpCode, setOtpCode] = useState('');
          const recaptchaVerifier = React.useRef<any>(null);
            const [confirmResult, setConfirmResult] = useState<any>(null);
              const [pendingUserData, setPendingUserData] = useState<any>(null);



  const [password, setPassword] = useState('');
    const [securePassword, setSecurePassword] = useState(true);

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
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  /* TAKE PHOTO WITH CAMERA */
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Camera error:', error);
      if (Platform.OS === 'web') {
        alert('Camera is not available or supported on this browser context.');
      }
    }
  };

  /* VALIDATE PASSWORD RULES */
    /* VALIDATE INDIVIDUAL PASSWORD RULES */
      const hasLength = password.length >= 8 && password.length <= 16;
        const hasTwoNumbers = (password.match(/[0-9]/g) || []).length >= 2;
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);

              const isPasswordValid = () => {
                  return hasLength && hasTwoNumbers && hasSpecialChar && hasUpperAndLower;
                    };


  /* REGISTER USER */
    const registerUser = async () => {
          try {
          setLoading(true);
      // Cross-platform alert fallback
      const showAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
          alert(`${title}: ${message}`);
        } else {
          Alert.alert(title, message);
        }
      };

                const cleanUsername = username.trim();

                // Ensure username provided
                if (!cleanUsername) {
                  showAlert('Error', 'Username is required');
                  setLoading(false);
                  return;
                }

                const cleanIdentifier = identifier.trim();

                const isEmail = cleanIdentifier.includes('@');
                const isPhone = /^\+?[0-9]{10,15}$/.test(cleanIdentifier); // Validates pure numeric strings

                if (!cleanIdentifier) {
                  showAlert('Error', 'Email address or Phone number is required');
                  setLoading(false);
                  return;
                }

                if (!isEmail && !isPhone) {
                  showAlert('Error', 'Please enter a valid email address or phone number');
                  setLoading(false);
                  return;
                }
                                                                                              

            if (!isPasswordValid()) {

            
        showAlert(
          'Weak Password',
          'Your password must meet the following requirements:\n' +
            '• Between 8 and 16 characters long\n' +
            '• At least 2 numeric digits\n' +
            '• At least 1 special character\n' +
            '• At least 1 uppercase and 1 lowercase letter'
        );
        return;
      }

      // Check if username exists using web-safe SDK (use DB inline below)
      
      

      
    

      // Create Authentication user
      // Create Authentication user
             // Determine final registration email string for Firebase Auth engine
                   let targetEmail = '';
                         if (isEmail) {
                                 targetEmail = cleanIdentifier;
                                       } else if (isPhone) {
                                               // Formats a clean, syntactically valid fallback email for phone-only users
                                                       const pureDigits = cleanIdentifier.replace(/[^0-9]/g, '');
                                                               targetEmail = `phone_${pureDigits}@yourproject.internal`;
                                                                     }

                                                                           // Create Authentication user
                                                                                    // Create Authentication user with a sandbox safety timeout race guard
                                                                                          const authPromise = createUserWithEmailAndPassword(auth, targetEmail, password);
                                                                                                const timeoutPromise = new Promise<never>((_, reject) =>
                                                                                                        setTimeout(() => reject(new Error('Firebase authentication timed out. Check your config connection domain.')), 8000)
                                                                                                              );

                                                                                                                    const userCredential = await Promise.race([authPromise, timeoutPromise]);
                                                                                                                          const uid = userCredential.user.uid;
                                                                                                                            

      // Save username mapping
          const storage = getStorage();
                let photoURL = '';

                      if (isEmail) {
                              // --- EMAIL SIGN UP WORKFLOW ---
                                      const authPromise = createUserWithEmailAndPassword(auth, targetEmail, password);
                                              const timeoutPromise = new Promise<never>((_, reject) =>
                                                        setTimeout(() => reject(new Error('Firebase authentication timed out.')), 8000)
                                                                );
                                                                        const userCredential = await Promise.race([authPromise, timeoutPromise]);
                                                                                const uid = userCredential.user.uid;

                                                                                        if (photo) {
                                                                                                  try {
                                                                                                              const response = await fetch(photo);
                                                                                                                          const blob = await response.blob();
                                                                                                                                      const photoStorageLocation = storageRef(storage, `profilePhotos/${uid}.jpg`);
                                                                                                                                                  await uploadBytes(photoStorageLocation, blob);
                                                                                                                                                              photoURL = await getDownloadURL(photoStorageLocation);
                                                                                                                                                                        } catch (uploadError) {
                                                                                                                                                                                    console.log('Photo upload skipped or failed:', uploadError);
                                                                                                                                                                                              }
                                                                                                                                                                                                      }

                                                                                                                                                                                                              const userProfileLocation = dbRef(getDatabase(), `users/${uid}`);
                                                                                                                                                                                                                      await set(userProfileLocation, {
                                                                                                                                                                                                                                username: cleanUsername,
                                                                                                                                                                                                                                          email: cleanIdentifier,
                                                                                                                                                                                                                                                    phone: null,
                                                                                                                                                                                                                                                              accountType,
                                                                                                                                                                                                                                                                        country,
                                                                                                                                                                                                                                                                                  gender: accountType === 'Personal' ? gender : null,
                                                                                                                                                                                                                                                                                            bio,
                                                                                                                                                                                                                                                                                                      photo: photoURL,
                                                                                                                                                                                                                                                                                                                verified: false,
                                                                                                                                                                                                                                                                                                                          createdAt: Date.now(),
                                                                                                                                                                                                                                                                                                                                  });

                                                                                                                                                                                                                                                                                                                                          await sendEmailVerification(userCredential.user);
                                                                                                                                                                                                                                                                                                                                                  showAlert('Verification Sent', 'A verification link has been sent to your email address.');
                                                                                                                                                                                                                                                                                                                                                          setLoading(false);

                                                                                                                                                                                                                                                                                                                                } else if (isPhone) {
                                                                                                                                                                                                                                                                                                                                    // --- PHONE NUMBER WORKFLOW ---
                                                                                                                                                                                                                                                                                                                                      // Cache registration state fields locally first
                                                                                                                                                                                                                                                                                                                                        setPendingUserData({
                                                                                                                                                                                                                                                                                                                                            username: cleanUsername,
                                                                                                                                                                                                                                                                                                                                                phone: cleanIdentifier,
                                                                                                                                                                                                                                                                                                                                                    accountType,
                                                                                                                                                                                                                                                                                                                                                        country,
                                                                                                                                                                                                                                                                                                                                                            gender,
                                                                                                                                                                                                                                                                                                                                                                bio,
                                                                                                                                                                                                                                                                                                                                                                    rawPhotoUri: photo
                                                                                                                                                                                                                                                                                                                                                                      });

                                                                                                                                                                                                                                                                                                                                                                        // --- RECAPTCHA CORRECTION CODE ---
                                                                                                                                                                                                                                                                                                                                                                          let verifierInstance = recaptchaVerifier.current;

                                                                                                                                                                                                                                                                                                                                                                            // Fallback fallback if the Ref modal isn't ready or if running on Web browser context
                                                                                                                                                                                                                                                                                                                                                                              if (!verifierInstance) {
                                                                                                                                                                                                                                                                                                                                                                                  if (Platform.OS === 'web') {
                                                                                                                                                                                                                                                                                                                                                                                        // Dynamically instantiate standard web verifier on the window object
                                                                                                                                                                                                                                                                                                                                                                                              if (!(window as any).recaptchaVerifier) {
                                                                                                                                                                                                                                                                                                                                                                                                      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                                                                                                                                                                                                                                                                                                                                                                                                                size: 'invisible',
                                                                                                                                                                                                                                                                                                                                                                                                                          callback: () => {}
                                                                                                                                                                                                                                                                                                                                                                                                                                  });
                                                                                                                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                                                                                                              verifierInstance = (window as any).recaptchaVerifier;
                                                                                                                                                                                                                                                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                                                                                                                                                                                                                                                        // If native app and still null, notify user to try again
                                                                                                                                                                                                                                                                                                                                                                                                                                                              showAlert('Notice', 'Verification module is initializing. Please tap Register again.');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    setLoading(false);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          return;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  // Trigger real Firebase SMS verification token dispatch using verified instance
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    const confirmation = await signInWithPhoneNumber(auth, cleanIdentifier, verifierInstance);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      setConfirmResult(confirmation);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          setIsOtpSent(true);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            setLoading(false);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              showAlert('SMS Code Sent', `A code has been sent to ${cleanIdentifier}`);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                // --- END OF CORRECTION CODE ---
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      


  
      
      
    
          
          
                            
                                
                                          
                                                  
                                                        
                                                                
                                                                              
                                                                                
                                                                                  
                                                                                                                      

                                                                                                                                
                                                                                                                                          
                                                                                                                                      
                                                                                                                                                        
                                                                                                                                                    
                                                                                                                                                    
                                                                                                                                                                  
                                                                                                                                                                                      
                                                                                                                                                                                                  
                                                                                                                                                                                            
                                                                                                                                                                                                      
                                                                                                                                                                                                                  
                                                                                                                                                                                                                        
                                                                                                                                                                                                
                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                                            } catch (err) {
                                                                                                                                                                                                                                                                                                                  setLoading(false);
                                                                                                                                                                                                                                                                                                                        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
                                                                                                                                                                                                                                                                                                                              if (Platform.OS === 'web') {
                                                                                                                                                                                                                                                                                                                                      alert(`Error: ${errorMessage}`);
                                                                                                                                                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                                                                                                                                                    Alert.alert('Error', errorMessage);
                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                            }

    

  
            
            
                      
                                  
                                    
                                          
                                                      
                                                                        
                                                                    
                                                                          
                                                                                
                                                                                                
                                                                                                        
                                                                                                                          

                                                                                                                      
                                                                                                                        
                                                                                                                                                    
                                                                                                                                                
                                                                                                                                                          
                                                                                                                                                                
                                                                                                                                                                          
                                                                                                                                                                              
                                                                                                                                                                                            
                                                                                                                                                                                                        
                                                                                                                                                                                                            
                                                                                                                                                                                                                                  
                                                                                                                                                                                                                    

  return (
    <ScrollView contentContainerStyle={styles.container}>
            {isOtpSent ? (
                      <View style={styles.otpContainer}>
                                <Text style={styles.otpTitle}>Verify Your Account</Text>
                                          <Text style={styles.otpSubtitle}>
                                                      We sent a verification code to {identifier}. Please enter it below to activate your account.
                                                                </Text>
                                                                          
                                                                                    <TextInput
                                                                                                placeholder="Enter 6-Digit Code"
                                                                                                            value={otpCode}
                                                                                                                        onChangeText={setOtpCode}
                                                                                                                                    keyboardType="number-pad"
                                                                                                                                                            maxLength={6}
                                                                                                                                                                        textAlign="center"
                                                                                                                                                                                    style={[styles.input, styles.otpInput]}
                                                                                                                                                                                              />

    <TouchableOpacity 
      style={styles.button} 
        onPress={async () => {
            const showAlert = (title: string, message: string) => {
                  if (Platform.OS === 'web') alert(`${title}: ${message}`);
                        else Alert.alert(title, message);
                            };

                                if (otpCode.length === 6 && confirmResult) {
                                      try {
                                              setLoading(true);
                                                      // Verify code via Firebase Auth pool
                                                              const userCredential = await confirmResult.confirm(otpCode);
                                                                      const uid = userCredential.user.uid;

                                                                              // Process picture asset upload if present
                                                                                      let finalPhotoUrl = '';
                                                                                              if (pendingUserData?.rawPhotoUri) {
                                                                                                        try {
                                                                                                                    const response = await fetch(pendingUserData.rawPhotoUri);
                                                                                                                                const blob = await response.blob();
                                                                                                                                            const photoStorageLocation = storageRef(getStorage(), `profilePhotos/${uid}.jpg`);
                                                                                                                                                        await uploadBytes(photoStorageLocation, blob);
                                                                                                                                                                    finalPhotoUrl = await getDownloadURL(photoStorageLocation);
                                                                                                                                                                              } catch (err) {
                                                                                                                                                                                          console.log('OTP user photo upload failed:', err);
                                                                                                                                                                                                    }
                                                                                                                                                                                                            }

                                                                                                                                                                                                                    // Save phone user account safely inside the Database
                                                                                                                                                                                                                            const userProfileLocation = dbRef(getDatabase(), `users/${uid}`);
                                                                                                                                                                                                                                    await set(userProfileLocation, {
                                                                                                                                                                                                                                              username: pendingUserData?.username,
                                                                                                                                                                                                                                                        email: null,
                                                                                                                                                                                                                                                                  phone: pendingUserData?.phone,
                                                                                                                                                                                                                                                                            accountType: pendingUserData?.accountType,
                                                                                                                                                                                                                                                                                      country: pendingUserData?.country,
                                                                                                                                                                                                                                                                                                gender: pendingUserData?.accountType === 'Personal' ? pendingUserData?.gender : null,
                                                                                                                                                                                                                                                                                                          bio: pendingUserData?.bio,
                                                                                                                                                                                                                                                                                                                    photo: finalPhotoUrl,
                                                                                                                                                                                                                                                                                                                              verified: true, // Mark true directly since phone token checked out
                                                                                                                                                                                                                                                                                                                                        createdAt: Date.now(),
                                                                                                                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                                                                                                                        showAlert('Success', 'Account Verified & Profile Created!');
                                                                                                                                                                                                                                                                                                                                                                setIsOtpSent(false);
                                                                                                                                                                                                                                                                                                                                                                      } catch (err) {
                                                                                                                                                                                                                                                                                                                                                                              const errorMsg = err instanceof Error ? err.message : 'Invalid code entry.';
                                                                                                                                                                                                                                                                                                                                                                                      showAlert('Verification Failed', errorMsg);
                                                                                                                                                                                                                                                                                                                                                                                            } finally {
                                                                                                                                                                                                                                                                                                                                                                                                    setLoading(false);
                                                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                                                              } else {
                                                                                                                                                                                                                                                                                                                                                                                                                    showAlert('Error', 'Please enter a valid 6-digit verification code.');
                                                                                                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                                                                                                          }}
                                                                                                                                                                                                                                                                                                                                                                                                                          >
                                                                                                                                                                                                                                                                                                                                                                                                                            <Text style={styles.buttonText}>Confirm Code</Text>
                                                                                                                                                                                                                                                                                                                                                                                                                            </TouchableOpacity>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                          
                                                                                                                                                                                                          
                                                                                                                                                                                                                      
                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                <TouchableOpacity 
                                                                                                                                                                                                                                                                                                                                                                                                                            style={[styles.button, styles.cancelButton]} 
                                                                                                                                                                                                                                                                                                                                                                                                                                        onPress={() => setIsOtpSent(false)}
                                                                                                                                                                                                                                                                                                                                                                                                                                                  >
                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Text style={styles.cancelButtonText}>Back to Registration</Text>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </TouchableOpacity>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </View>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ) : (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <>

            
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
                    placeholder="Email address or Phone number"
                            value={identifier}
                                    onChangeText={setIdentifier}
                                            style={styles.input}
                                                    keyboardType="default"
                                                            autoCapitalize="none"
                                                                  />
                                                                        <TextInput
                                                                                placeholder="Username"
                                                                                        value={username}
                                                                                                onChangeText={setUsername}
                                                                                                        style={styles.input}
                                                                                                              />


      
            <View style={styles.passwordContainer}>
                      <TextInput
                                placeholder="Password"
                                          secureTextEntry={securePassword}
                                                    value={password}
                                                              onChangeText={setPassword}
                                                                        style={styles.passwordInput}
                                                                                  autoCapitalize="none"
                                                                                          />
                                                                                                  <TouchableOpacity 
                                                                                                            style={styles.toggleButton} 
                                                                                                                      onPress={() => setSecurePassword(!securePassword)}
                                                                                                                              >
                                                                                                                                        <Text style={styles.toggleText}>{securePassword ? "Show" : "Hide"}</Text>
                                                                                                                                                </TouchableOpacity>
                                                                                                                                                      </View>

    
            <View style={styles.rulesContainer}>
                      <Text style={hasLength ? styles.validRule : styles.invalidRule}>
                                {hasLength ? '✅' : '❌'} Between 8 and 16 characters long
                                        </Text>
                                                <Text style={hasTwoNumbers ? styles.validRule : styles.invalidRule}>
                                                          {hasTwoNumbers ? '✅' : '❌'} At least 2 numeric digits
                                                                  </Text>
                                                                          <Text style={hasSpecialChar ? styles.validRule : styles.invalidRule}>
                                                                                    {hasSpecialChar ? '✅' : '❌'} At least 1 special character
                                                                                            </Text>
                                                                                                    <Text style={hasUpperAndLower ? styles.validRule : styles.invalidRule}>
                                                                                                              {hasUpperAndLower ? '✅' : '❌'} At least 1 uppercase and 1 lowercase letter
                                                                                                                      </Text>
                                                                                                                            </View>  <Text style={styles.label}>Account Type</Text>
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
            <TouchableOpacity 
                    style={styles.button} 
                            onPress={registerUser}
                                    disabled={loading}
                                          >
                                                  {loading ? (
                                                            <ActivityIndicator color="#fff" />
                                                                    ) : (
                                                                              <Text style={styles.buttonText}>Register</Text>
                                                                                      )}
                                                                                            </TouchableOpacity>

                 </>
                   )}

                     {/* FIXED RECAPTCHA HOOKS FOR BOTH WEB AND MOBILE PLATFORMS */}
                       {Platform.OS !== 'web' ? (
                           <FirebaseRecaptchaVerifierModal
                                 ref={recaptchaVerifier}
                                       firebaseConfig={firebaseConfig}
                                             attemptInvisibleVerification={true}
                                                 />
                                                   ) : (
                                                       /* Standard web DOM anchor fallback element compatible with web builds */
                                                           <div id="recaptcha-container" style={{ width: 0, height: 0, opacity: 0 }} />
                                                             )}

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
              borderColor: '#ccc',
                  padding: 12,
                      marginBottom: 16,
                          borderRadius: 10,
                              fontSize: 15,
                                  backgroundColor: '#fafafa',
                                    },
                                      passwordContainer: {
                                          flexDirection: 'row',
                                              borderWidth: 1,
                                                  borderColor: '#ccc',
                                                      borderRadius: 10,
                                                          marginBottom: 16,
                                                              alignItems: 'center',
                                                                  backgroundColor: '#fafafa',
                                                                    },

    
    
                                      passwordInput: {
                                          flex: 1,
                                              padding: 10,
                                                },
                                                  toggleButton: {
                                                      paddingHorizontal: 15,
                                                          paddingVertical: 10,
                                                            },
                                                              toggleText: {
                                                                  color: '#007AFF',
                                                                      fontWeight: '600',
                                                                          fontSize: 14,
                                                                            },

    
  label: {
    marginTop: 10,
    marginBottom: 5,
  },
    rulesContainer: {
          paddingHorizontal: 5,
              marginBottom: 10,
                },
                  validRule: {
                      color: '#2e7d32',
                          fontSize: 13,
                              marginTop: 3,
                                },
                                  invalidRule: {
                                      color: '#d32f2f',
                                          fontSize: 13,
                                              marginTop: 3,
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
    otpContainer: {
          paddingVertical: 40,
              alignItems: 'stretch',
                },
                  otpTitle: {
                      fontSize: 22,
                          fontWeight: 'bold',
                              textAlign: 'center',
                                  marginBottom: 10,
                                      color: '#333',
                                        },
  otpSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  otpInput: {
    fontSize: 20,
    letterSpacing: 4,
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d32f2f',
    marginTop: 15,
  },
  cancelButtonText: {
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

// End of AuthScreen
