import React, { useState, useEffect, useCallback } from 'react';
import ChatWindow from './ChatWindow';
import ConversationList from './ConversationList';
import api from '../../lib/api';
import useAuth from '../../hooks/useAuth';
import Spinner from '../UI/Spinner';
import { useTranslation } from 'react-i18next';

const ChatInterface = () => {
  const { t } = useTranslation();
  const [allMessages, setAllMessages] = useState([]);
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  const fetchAllConversations = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoadingHistory(false);
      return;
    }
    setIsLoadingHistory(true);
    setError(null);
    try {
      const response = await api.get('/chat/history?all=true');
      const fetchedMessages = response.data.messages || [];
      setAllMessages(fetchedMessages);

      if (fetchedMessages.length > 0) {
        const conversationIds = [...new Set(fetchedMessages.map(msg => msg.conversationId))];
        const latestConvId = fetchedMessages.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.conversationId;
        
        if (latestConvId) {
            setActiveConversationId(latestConvId);
            setCurrentChatMessages(fetchedMessages.filter(msg => msg.conversationId === latestConvId));
        } else if (conversationIds.length > 0) {
            setActiveConversationId(conversationIds[0]);
            setCurrentChatMessages(fetchedMessages.filter(msg => msg.conversationId === conversationIds[0]));
        } else {
            setActiveConversationId(null);
            setCurrentChatMessages([]);
        }
      } else {
        setActiveConversationId(null);
        setCurrentChatMessages([]);
      }
    } catch (err) {
      console.error("Erreur chargement historique:", err);
      setError(t('chat.loadHistoryError'));
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isAuthenticated, user, t]);

  useEffect(() => {
    fetchAllConversations();
  }, [fetchAllConversations]);

  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    setCurrentChatMessages(allMessages.filter(msg => msg.conversationId === conversationId));
  };

  const handleCreateNewChat = () => {
    setActiveConversationId(null);
    setCurrentChatMessages([]);
  };

  const handleMessageSent = (userMsg, botMsg, newConvId) => {
    const updatedAllMessages = [...allMessages, userMsg, botMsg];
    setAllMessages(updatedAllMessages);
    
    if (activeConversationId === null && newConvId) {
        setActiveConversationId(newConvId);
        setCurrentChatMessages([userMsg, botMsg]);
    } else if (newConvId === activeConversationId) {
        setCurrentChatMessages(prev => [...prev, userMsg, botMsg]);
    } else if (newConvId && newConvId !== activeConversationId) {
        fetchAllConversations();
    }
  };

  if (isLoadingHistory) {
    return <div className="flex justify-center items-center h-full"><Spinner size="lg" /><p className="ml-3">{t('chat.loadingHistory')}</p></div>;
  }
  if (error) {
    return <div className="p-4 text-center text-red-500 bg-red-100">{error}</div>;
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem))]">
      <ConversationList
        conversations={allMessages}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onCreateNewChat={handleCreateNewChat}
      />
      <div className="flex-grow flex flex-col bg-gray-100 dark:bg-gray-900">
        <ChatWindow
          key={activeConversationId || 'new-chat'}
          initialMessages={currentChatMessages}
          conversationId={activeConversationId}
          onMessageSent={handleMessageSent}
          className="text-black" // Ajout pour forcer le texte en noir
        />
      </div>
    </div>
  );
};

export default ChatInterface;