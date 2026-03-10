import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth } from '../firebaseConfig';
import database from '@react-native-firebase/database';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';

export default function AuthScreen() {

const [email,setEmail] = useState('');
const [username,setUsername] = useState('');
const [phone,setPhone] = useState('');
const [password,setPassword] = useState('');
const [accountType,setAccountType] = useState('Personal');
const [country,setCountry] = useState('');
const [gender,setGender] = useState('');
const [bio,setBio] = useState('');
const [photo,setPhoto] = useState(null);


/* PICK IMAGE FROM GALLERY */

const pickImage = async () => {

const result = await ImagePicker.launchImageLibraryAsync({
mediaTypes: ImagePicker.MediaTypeOptions.Images,
allowsEditing: true,
quality: 1
});

if(!result.canceled){
setPhoto(result.assets[0].uri);
}

};


/* TAKE PHOTO WITH CAMERA */

const takePhoto = async () => {

const result = await ImagePicker.launchCameraAsync({
allowsEditing:true,
quality:1
});

if(!result.canceled){
setPhoto(result.assets[0].uri);
}

};


/* REGISTER USER */

const registerUser = async () => {

try {

if(!username){
Alert.alert("Error","Username is required");
return;
}

const usernameRef = database().ref(`usernames/${username}`);

const snapshot = await usernameRef.once('value');

if(snapshot.exists()){
Alert.alert("Error","Username already taken");
return;
}

const userCredential = await auth.createUserWithEmailAndPassword(email,password);

const uid = userCredential.user.uid;


/* REGISTER USERNAME */

await usernameRef.set(uid);


/* UPLOAD PROFILE PHOTO */

let photoURL = '';

if(photo){

const filename = `profilePhotos/${uid}.jpg`;

const reference = storage().ref(filename);

await reference.putFile(photo);

photoURL = await reference.getDownloadURL();

}


/* SAVE USER DATA */

await database().ref(`users/${uid}`).set({
username,
email,
phone,
accountType,
country,
gender: accountType === 'Personal' ? gender : null,
bio,
photo: photoURL,
verified:false,
createdAt: Date.now()
});

Alert.alert("Success","Account created successfully");

} catch(err:any){

Alert.alert("Error",err.message)

}

};

return(

<View style={styles.container}>

<Text style={styles.title}>Create Account</Text>


{/* PROFILE PHOTO */}

<Text style={styles.label}>Profile Photo</Text>

{photo && (
<Image
source={{uri:photo}}
style={{width:100,height:100,borderRadius:50,alignSelf:'center',marginBottom:10}}
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
/>

<TextInput
placeholder="Username (unique)"
value={username}
onChangeText={setUsername}
style={styles.input}
/>

<TextInput
placeholder="Phone Number"
value={phone}
onChangeText={setPhone}
style={styles.input}
/>

<TextInput
placeholder="Password"
secureTextEntry
value={password}
onChangeText={setPassword}
style={styles.input}
/>

<Text style={styles.label}>Account Type</Text>

<Picker
selectedValue={accountType}
onValueChange={(itemValue)=>setAccountType(itemValue)}
>

<Picker.Item label="Personal Account" value="Personal"/>
<Picker.Item label="Forum Account" value="Forum"/>
<Picker.Item label="Institutional Account" value="Institutional"/>
<Picker.Item label="Ministerial Account" value="Ministerial"/>
<Picker.Item label="Organizational Account" value="Organizational"/>

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
onValueChange={(itemValue)=>setGender(itemValue)}
>

<Picker.Item label="Male" value="Male"/>
<Picker.Item label="Female" value="Female"/>

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

</View>

)

}

const styles = StyleSheet.create({

container:{
flex:1,
padding:20,
backgroundColor:'#fff'
},

title:{
fontSize:24,
fontWeight:'bold',
marginBottom:20
},

input:{
borderWidth:1,
borderColor:'#ddd',
padding:10,
marginBottom:10,
borderRadius:8
},

label:{
marginTop:10,
marginBottom:5
},

button:{
backgroundColor:'#007AFF',
padding:15,
borderRadius:8,
marginTop:10
},

buttonText:{
color:'#fff',
textAlign:'center',
fontWeight:'bold'
}

})
