import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

export default function PrivacySettingsScreen(){

const [privateAccount,setPrivateAccount]=useState(false);
const [allowMessages,setAllowMessages]=useState(true);

return(

<View style={styles.container}>

<Text style={styles.title}>Privacy Settings</Text>

<View style={styles.row}>

<Text>Private Account</Text>

<Switch
value={privateAccount}
onValueChange={setPrivateAccount}
/>

</View>

<View style={styles.row}>

<Text>Allow Messages From Everyone</Text>

<Switch
value={allowMessages}
onValueChange={setAllowMessages}
/>

</View>

</View>

);

}

const styles=StyleSheet.create({

container:{flex:1,padding:20},

title:{fontSize:22,fontWeight:'bold',marginBottom:20},

row:{
flexDirection:'row',
justifyContent:'space-between',
paddingVertical:15
}

});
