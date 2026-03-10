import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateText } from '../services/translationService';

export default function ChatBubble({ message }){

  const [translated,setTranslated]=useState("");

  useEffect(()=>{
    translateMessage();
  },[]);

  const translateMessage = async ()=>{

    const lang = await AsyncStorage.getItem('appLanguage');
    if(!lang) return;

    const result = await translateText(message.text,lang);

    setTranslated(result);

  };

  return(

    <View style={{padding:10}}>

      <Text>
        {translated || message.text}
      </Text>

    </View>

  );

}
