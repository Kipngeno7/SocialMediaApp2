import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { unblockUser } from '../services/blockService';

export default function BlockedUsersScreen(){

const [blockedUsers,setBlockedUsers]=useState<any[]>([]);
const currentUserId = auth.currentUser?.uid;

useEffect(()=>{
fetchBlockedUsers();
},[]);

const fetchBlockedUsers = async () => {

const userDoc = await getDoc(doc(db,'users',currentUserId as string));
const data = userDoc.data();

setBlockedUsers(data?.blockedUsers || []);

};

return(
<View style={styles.container}>

<Text style={styles.title}>Blocked Users</Text>

<FlatList
data={blockedUsers}
keyExtractor={(item)=>item}
renderItem={({item}) => (

<View style={styles.row}>

<Text>{item}</Text>

<TouchableOpacity
onPress={async ()=>{
await unblockUser(currentUserId as string,item);
fetchBlockedUsers();
}}
>

<Text style={styles.unblock}>Unblock</Text>

</TouchableOpacity>

</View>

)}
/>

</View>
);
}

const styles = StyleSheet.create({

container:{flex:1,padding:20,backgroundColor:'#fff'},

title:{fontSize:22,fontWeight:'bold',marginBottom:20},

row:{
flexDirection:'row',
justifyContent:'space-between',
padding:15,
borderBottomWidth:1,
borderColor:'#eee'
},

unblock:{
color:'red',
fontWeight:'bold'
}

});
