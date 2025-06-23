import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationAR from './locales/ar/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  ar: {
    translation: translationAR,
  },
};

i18n
  .use(LanguageDetector) // Détecte la langue du navigateur
  .use(initReactI18next) // Passe i18n instance à react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Langue par défaut si la détection échoue ou si la langue n'est pas supportée
    debug: process.env.NODE_ENV === 'development', // Active les logs en mode développement
    interpolation: {
      escapeValue: false, // React s'occupe déjà de l'échappement XSS
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;