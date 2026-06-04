import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateText } from '../services/translationService';

export default function CommentItem({ comment }: { comment: { text: string; user: string } }) {

  const [translated, setTranslated] = useState<string>("");

  useEffect(()=>{
    translateComment();
  },[]);

  const translateComment = async () => {

    const lang = await AsyncStorage.getItem('appLanguage');
    if(!lang) return;

    const result = await translateText(comment.text, lang);
    setTranslated(result);

  };

  return(

    <View style={{padding:10}}>

      <Text style={{fontWeight:"bold"}}>
        {comment.user}
      </Text>

      <Text>
        {translated || comment.text}
      </Text>

    </View>

  );

}
