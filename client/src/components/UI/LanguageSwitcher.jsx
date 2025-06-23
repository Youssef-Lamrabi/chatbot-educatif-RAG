import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react'; // Icône optionnelle

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Déterminer la direction du texte en fonction de la langue
  useEffect(() => {
    document.body.dir = i18n.dir();
  }, [i18n, i18n.language]);


  return (
    <div className="relative">
      <button 
        id="dropdownLanguageButton" 
        data-dropdown-toggle="dropdownLanguage" 
        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-900 dark:text-white rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white" 
        type="button"
        onClick={() => document.getElementById('dropdownLanguage').classList.toggle('hidden')} // Simple toggle pour l'exemple
      >
        <Globe size={18} className="mr-2" />
        {i18n.language === 'ar' ? t('languages.arabic') : t('languages.english')}
      </button>
      {/* Dropdown menu */}
      <div id="dropdownLanguage" className="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 absolute right-0 mt-2 w-44">
        <ul className="py-2 font-medium" role="menu">
          <li>
            <button
              onClick={() => { changeLanguage('en'); document.getElementById('dropdownLanguage').classList.add('hidden'); }}
              className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'en' ? 'bg-gray-100 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white`}
              role="menuitem"
            >
              {t('languages.english')}
            </button>
          </li>
          <li>
            <button
              onClick={() => { changeLanguage('ar'); document.getElementById('dropdownLanguage').classList.add('hidden'); }}
              className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'ar' ? 'bg-gray-100 dark:bg-gray-600 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white`}
              role="menuitem"
            >
               {t('languages.arabic')}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Effet pour gérer la direction du texte (à mettre dans LanguageSwitcher ou App.jsx)
import { useEffect } from 'react'; // Assurez-vous que c'est importé

export default LanguageSwitcher;