import axios from 'axios';

const API_KEY = "AIzaSyBENTn6_kNEPHh6coA7j2cljT5oi8glopk"; // <-- your key

export const translateText = async (text: string, targetLanguage: string) => {
  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      {},
      {
        params: {
          q: text,
          target: targetLanguage,
          key: API_KEY,
        },
      }
    );
    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.log("Translation error:", error);
    return text;
  }
};
