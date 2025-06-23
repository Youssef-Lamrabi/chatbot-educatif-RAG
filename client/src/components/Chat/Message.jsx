import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr, arSA } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { User, Bot } from 'lucide-react'; // Icônes

const Message = ({ message, isUser }) => {
  const { t, i18n } = useTranslation();
  const { text, timestamp, sender } = message;
  
  const getDateLocale = () => {
    return i18n.language === 'ar' ? arSA : fr;
  };

  let formattedTimestamp = 'n/a';
  if (timestamp) {
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
      formattedTimestamp = format(date, 'p', { locale: getDateLocale() }); // 'p' pour l'heure courte localisée
    } catch (e) { console.warn("Erreur formatage timestamp:", timestamp, e); }
  }

  return (
    <div className={`flex mb-4 items-end ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center mr-2 sm:mr-3">
          <Bot size={18} className="text-gray-300" />
        </div>
      )}
      <div 
        className={`max-w-[70%] sm:max-w-[65%] p-3 sm:p-4 rounded-2xl shadow-md
                    ${isUser ? 'bg-blue-600 text-white rounded-br-lg' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'}`}
        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
      >
        <p className="text-sm leading-relaxed">{text}</p>
        <p className={`text-xs mt-1.5 ${isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'} ${isUser ? 'text-right' : 'text-left'}`}>
          {formattedTimestamp}
        </p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-600 flex items-center justify-center ml-2 sm:ml-3">
          <User size={18} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default Message;