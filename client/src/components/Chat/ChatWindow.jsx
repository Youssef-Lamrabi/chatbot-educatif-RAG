import React, { useState, useEffect, useRef } from 'react';
import Message from './Message';
import Input from './Input';
import api from '../../lib/api';
import useAuth from '../../hooks/useAuth';
import Spinner from '../UI/Spinner';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false); // Pour l'indicateur de chargement de l'envoi
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const messagesEndRef = useRef(null); // Pour le défilement automatique

  // Fonction pour faire défiler vers le bas de la fenêtre de chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]); // Appeler à chaque mise à jour des messages

  // Charger l'historique des conversations au montage du composant ou si l'utilisateur change
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isAuthenticated || !user) { // S'assurer que l'utilisateur est authentifié et chargé
        setIsHistoryLoading(false);
        setMessages([]); // Vider les messages si pas d'utilisateur
        setCurrentConversationId(null);
        return;
      }
      setIsHistoryLoading(true);
      setError(null);
      try {
        // L'API backend renvoie { messages: [], conversationId: '...' }
        // Si pas de query param 'conversationId', le backend renvoie la plus récente ou une liste vide.
        const response = await api.get('/chat/history');
        setMessages(response.data.messages || []);
        setCurrentConversationId(response.data.conversationId);
      } catch (err) {
        console.error("Erreur lors du chargement de l'historique:", err);
        setError('Erreur lors du chargement de l\'historique. Veuillez réessayer.');
        setMessages([]);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [isAuthenticated, user]); // Dépend de isAuthenticated et user pour re-fetch si l'état d'auth change

  const handleSendMessage = async (text) => {
    if (!text.trim() || !isAuthenticated) return;

    const tempUserMessageId = `temp-user-${Date.now()}`;
    const userMessageForUI = {
      id: tempUserMessageId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
      conversationId: currentConversationId || 'new', // Pour l'affichage optimiste
      userId: user._id
    };
    setMessages(prevMessages => [...prevMessages, userMessageForUI]);
    setIsSending(true);
    setError(null);

    try {
      const payload = {
        message: text,
        conversationId: currentConversationId, // Sera null pour la 1ère question d'une nouvelle session
        // metadata: { class: '4eme', subject: 'Maths' } // Exemple de métadonnées à ajouter si besoin
      };
      const response = await api.post('/chat/send', payload);
      
      const { userMessage: savedUserMessage, botMessage, conversationId: updatedConvId } = response.data;

      setCurrentConversationId(updatedConvId);

      // Mettre à jour les messages: remplacer le message temporaire par celui de la DB et ajouter la réponse du bot
      setMessages(prevMessages => [
        ...prevMessages.filter(m => m.id !== tempUserMessageId),
        savedUserMessage,
        botMessage
      ]);

    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
      const errorMessage = err.response?.data?.message || 'Erreur réseau ou serveur indisponible.';
      setError(errorMessage);
      // Optionnel: Garder le message utilisateur en UI mais indiquer l'échec, ou le retirer
      setMessages(prevMessages => prevMessages.filter(m => m.id !== tempUserMessageId));
      // Ajouter un message d'erreur du bot dans le chat
      const errorBotMessage = {
        id: `error-bot-${Date.now()}`,
        sender: 'bot',
        text: `Désolé, une erreur est survenue: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        conversationId: currentConversationId,
        userId: user._id // Pour la cohérence, même si c'est un message d'erreur client
      };
      setMessages(prevMessages => [...prevMessages, errorBotMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Affichage pendant le chargement de l'historique
  if (isHistoryLoading) {
    return <div className="flex justify-center items-center h-full p-8"><Spinner size="lg" /> <p className="ml-4 text-gray-600">Chargement de l'historique...</p></div>;
  }
  
  // Si l'utilisateur n'est pas authentifié (après le chargement initial)
  if (!isAuthenticated) {
     return <div className="p-8 text-center text-gray-600">Veuillez vous <a href="/auth" className="text-blue-600 hover:underline">connecter</a> pour utiliser le chat.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      <header className="p-3 sm:p-4 bg-blue-600 text-white shadow-md flex-shrink-0">
        <h1 className="text-lg sm:text-xl font-semibold">Chatbot Éducatif</h1>
        {user && <p className="text-xs sm:text-sm">Utilisateur: {user.username} <span className="opacity-70">({user.role})</span></p>}
        {currentConversationId && <p className="text-xs opacity-70">Session: {currentConversationId.substring(0,8)}...</p>}
      </header>
      
      <div className="flex-grow p-3 sm:p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && !isSending && (
            <div className="text-center text-gray-500 italic mt-8">Aucun message dans cette conversation. Commencez à discuter !</div>
        )}
        {messages.map((msg) => (
          <Message 
            key={msg.id || `msg-${msg.timestamp}-${msg.sender}`} // Utiliser msg.id de Cosmos DB
            message={msg} 
            isUser={msg.sender === 'user'} 
          />
        ))}
        <div ref={messagesEndRef} /> {/* Élément vide pour le défilement */}
      </div>

      {error && <div className="p-2 text-center text-red-600 bg-red-100 text-sm flex-shrink-0">{error}</div>}
      
      <Input onSendMessage={handleSendMessage} isLoading={isSending} />
    </div>
  );
};

export default ChatWindow;