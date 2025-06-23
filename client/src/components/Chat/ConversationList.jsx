import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquarePlus, Trash2 } from 'lucide-react';

const ConversationList = ({ conversations, activeConversationId, onSelectConversation, onCreateNewChat, onDeleteConversation }) => {
  const { t } = useTranslation();

  // Grouper les messages par conversationId pour obtenir une liste de conversations uniques
  const uniqueConversations = conversations.reduce((acc, msg) => {
    if (!acc[msg.conversationId]) {
      acc[msg.conversationId] = {
        id: msg.conversationId,
        lastMessage: msg, // Ou vous pourriez vouloir le premier message, ou un titre
        timestamp: new Date(msg.timestamp) // Pour le tri
      };
    } else {
      // Mettre à jour avec le message le plus récent si nécessaire
      if (new Date(msg.timestamp) > acc[msg.conversationId].timestamp) {
        acc[msg.conversationId].lastMessage = msg;
        acc[msg.conversationId].timestamp = new Date(msg.timestamp);
      }
    }
    return acc;
  }, {});

  const sortedConversations = Object.values(uniqueConversations).sort((a,b) => b.timestamp - a.timestamp);


  return (
    <div className="w-full md:w-1/4 lg:w-1/5 bg-gray-800 text-gray-200 p-4 flex flex-col h-full border-r border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('chat.conversationsTitle')}</h2>
        <button 
          onClick={onCreateNewChat} 
          className="p-2 hover:bg-gray-700 rounded-full"
          title={t('chat.newChat')}
        >
          <MessageSquarePlus size={20} />
        </button>
      </div>
      <div className="overflow-y-auto flex-grow">
        {sortedConversations.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-4">Aucune conversation.</p>
        )}
        {sortedConversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`p-3 my-1 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors flex justify-between items-center
                        ${conv.id === activeConversationId ? 'bg-gray-700 border-l-4 border-blue-500' : 'bg-gray-800'}`}
          >
            <div className="truncate">
              <p className="text-sm font-medium truncate">
                {conv.lastMessage.text.substring(0, 25)}{conv.lastMessage.text.length > 25 ? '...' : ''}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {/* Optionnel: Bouton de suppression
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
              className="p-1 text-gray-400 hover:text-red-500"
              title="Supprimer la conversation"
            >
              <Trash2 size={16} />
            </button>
            */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;