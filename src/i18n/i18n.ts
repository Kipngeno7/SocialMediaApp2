import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      welcome: "Welcome",
      settings: "Settings",
      language: "Language",
      privacy: "Privacy",
      help: "Help Center",
      block: "Block",
      unblock: "Unblock",
      report: "Report",
      search: "Search",
      post: "Post",
      comment: "Comment",
      message: "Message"
    }
  },

  es: {
    translation: {
      welcome: "Bienvenido",
      settings: "Configuración",
      language: "Idioma",
      privacy: "Privacidad",
      help: "Centro de ayuda",
      block: "Bloquear",
      unblock: "Desbloquear",
      report: "Reportar",
      search: "Buscar",
      post: "Publicar",
      comment: "Comentario",
      message: "Mensaje"
    }
  },

  fr: {
    translation: {
      welcome: "Bienvenue",
      settings: "Paramètres",
      language: "Langue",
      privacy: "Confidentialité",
      help: "Centre d'aide",
      block: "Bloquer",
      unblock: "Débloquer",
      report: "Signaler",
      search: "Rechercher",
      post: "Publier",
      comment: "Commentaire",
      message: "Message"
    }
  },

  sw: {
    translation: {
      welcome: "Karibu",
      settings: "Mipangilio",
      language: "Lugha",
      privacy: "Faragha",
      help: "Kituo cha Msaada",
      block: "Zuia",
      unblock: "Ondoa Zuio",
      report: "Ripoti",
      search: "Tafuta",
      post: "Chapisha",
      comment: "Maoni",
      message: "Ujumbe"
    }
  }
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: any) => {
    const lang = await AsyncStorage.getItem('appLanguage');
    callback(lang || 'en');
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    await AsyncStorage.setItem('appLanguage', lang);
  }
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    resources,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
