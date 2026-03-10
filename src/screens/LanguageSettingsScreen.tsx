import React, { useState, useEffect } from 'react';
import {
View,
Text,
FlatList,
TouchableOpacity,
StyleSheet
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';

const languages = [

'English',
'English (UK)',
'Español',
'Español (Latinoamérica)',
'Français',
'Français (Canada)',
'Deutsch',
'Italiano',
'Português (Brasil)',
'Português (Portugal)',
'Nederlands',
'Svenska',
'Norsk (Bokmål)',
'Dansk',
'Suomi',
'Polski',
'Čeština',
'Slovenčina',
'Slovenščina',
'Hrvatski',
'Magyar',
'Română',
'Български',
'Русский',
'Українська',
'Беларуская',
'Српски',
'Македонски',
'Ελληνικά',
'Türkçe',
'العربية',
'עברית',
'فارسی',
'اردو',
'हिन्दी',
'বাংলা',
'ਪੰਜਾਬੀ',
'ગુજરાતી',
'தமிழ்',
'తెలుగు',
'ಕನ್ನಡ',
'മലയാളം',
'සිංහල',
'नेपाली',
'ไทย',
'Tiếng Việt',
'Bahasa Indonesia',
'Bahasa Melayu',
'Filipino',
'中文 (简体)',
'中文 (繁體)',
'日本語',
'한국어',
'Монгол',
'ქართული',
'Հայերեն',
'አማርኛ',
'Af Soomaali',
'Kiswahili',
'Kinyarwanda',
'Kirundi',
'Igbo',
'Yorùbá',
'Hausa',
'Zulu',
'Xhosa',
'Afrikaans',
'Malagasy',
'Shona',
'Sesotho',
'Setswana',
'Chichewa',
'Bemba',
'Luganda',
'Tigrinya',
'Oromo',
'Kazakh',
'Uzbek',
'Kyrgyz',
'Tajik',
'Azerbaijani',
'Albanian',
'Bosanski',
'Català',
'Eesti',
'Latviešu',
'Lietuvių',
'Galego',
'Basque',
'Icelandic',
'Irish'

];

export default function LanguageSettingsScreen(){

const { t } = useTranslation();

const [selected,setSelected]=useState('English');

useEffect(()=>{
loadLanguage();
},[]);

const loadLanguage = async ()=>{
const lang = await AsyncStorage.getItem('appLanguage');
if(lang){
setSelected(lang);
}
};

const changeLanguage = async (language:string)=>{

setSelected(language);

let code = 'en';

if(language.includes('Español')) code='es';
if(language.includes('Français')) code='fr';
if(language.includes('Swahili') || language.includes('Kiswahili')) code='sw';
if(language.includes('العربية')) code='ar';
if(language.includes('中文')) code='zh';
if(language.includes('Русский')) code='ru';
if(language.includes('日本語')) code='ja';
if(language.includes('Deutsch')) code='de';

await AsyncStorage.setItem('appLanguage',code);

i18n.changeLanguage(code);

};

return(

<View style={styles.container}>

<Text style={styles.title}>{t('language')}</Text>

<FlatList
data={languages}
keyExtractor={(item)=>item}
renderItem={({item}) => (

<TouchableOpacity
style={styles.row}
onPress={()=>changeLanguage(item)}
>

<Text>{item}</Text>

{selected===item && <Text>✓</Text>}

</TouchableOpacity>

)}
/>

</View>

);

}

const styles=StyleSheet.create({

container:{
flex:1,
padding:20
},

title:{
fontSize:22,
fontWeight:'bold',
marginBottom:20
},

row:{
flexDirection:'row',
justifyContent:'space-between',
padding:15,
borderBottomWidth:1,
borderColor:'#eee'
}

});
