import React, { useState } from 'react';
import Button from '../UI/Button';
import { SendHorizontal } from 'lucide-react'; // Icône d'envoi

const Input = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text.trim());
      setText(''); // Réinitialiser le champ après l'envoi
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-gray-200 bg-white sticky bottom-0">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Posez votre question ici..."
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          disabled={isLoading}
          aria-label="Champ de saisie du message"
        />
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isLoading || !text.trim()}
          isLoading={isLoading}
          className="h-[46px] w-[46px] sm:h-auto sm:w-auto sm:px-4 flex items-center justify-center"
          aria-label="Envoyer le message"
        >
          {!isLoading && <SendHorizontal size={20} />}
        </Button>
      </div>
    </form>
  );
};

export default Input;