// server/src/controllers/chatController.js
import { v4 as uuidv4 } from 'uuid';
import { conversationsContainer } from '../config/db.js';
import { getLLMResponse } from '../services/ragService.js'; // Le nom du fichier reste le même pour l'instant
                                                        // mais la fonction exportée est maintenant getLLMResponse

// getConversationHistory reste le même que dans la version "stable" avec chat simple.
export const getConversationHistory = async (req, res) => {
  const userId = req.user.id;
  const { conversationId: requestedConvId, all } = req.query; 

  try {
    let querySpec;
    let targetConversationId = requestedConvId;

    if (all === 'true') {
        querySpec = {
            query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp ASC",
            parameters: [{ name: "@userId", value: userId }]
        };
        const { resources: messages } = await conversationsContainer.items.query(querySpec).fetchAll();
        // Pour le mode 'all', on s'attend à ce que le frontend groupe les conversations.
        // Peut-être ne pas renvoyer de conversationId spécifique dans ce cas.
        return res.status(200).json({ messages, conversationId: null }); 
    }
    
    if (!targetConversationId) {
      const latestConvQuery = {
          query: "SELECT TOP 1 c.conversationId FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC",
          parameters: [{ name: "@userId", value: userId }]
      };
      const { resources: latestConvResults } = await conversationsContainer.items.query(latestConvQuery).fetchAll();
      if (latestConvResults.length > 0) {
          targetConversationId = latestConvResults[0].conversationId;
      }
    }

    if (targetConversationId) {
      querySpec = {
        query: "SELECT * FROM c WHERE c.userId = @userId AND c.conversationId = @conversationId ORDER BY c.timestamp ASC",
        parameters: [
          { name: "@userId", value: userId },
          { name: "@conversationId", value: targetConversationId }
        ]
      };
      const { resources: messages } = await conversationsContainer.items.query(querySpec).fetchAll();
      return res.status(200).json({ messages, conversationId: targetConversationId });
    } else {
      // Nouveau chat ou pas d'historique
      return res.status(200).json({ messages: [], conversationId: null });
    }

  } catch (error) {
    console.error("Erreur récupération historique des conversations:", error.message, error.stack);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'historique.' });
  }
};


export const sendMessage = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  let { message: userInputText, conversationId, metadata } = req.body;

  if (!userInputText || userInputText.trim() === "") {
    return res.status(400).json({ message: 'Le contenu du message ne peut pas être vide.' });
  }

  const currentTimestamp = new Date().toISOString();
  const currentOrNewConversationId = conversationId || uuidv4(); 

  const userMessageEntry = {
    id: uuidv4(),
    conversationId: currentOrNewConversationId,
    userId,
    userType: userRole,
    sender: 'user',
    text: userInputText,
    timestamp: currentTimestamp,
    metadata: metadata || {}
  };

  try {
    // 1. Sauvegarder le message de l'utilisateur
    const { resource: savedUserMessage } = await conversationsContainer.items.create(userMessageEntry);

    // 2. Récupérer l'historique de la conversation actuelle pour le contexte du LLM
    let chatHistoryForLLM = [];
    if (currentOrNewConversationId) { 
        const historyQuery = { // Récupérer les N derniers messages de cette conversation
            query: "SELECT TOP 10 c.sender, c.text FROM c WHERE c.userId = @userId AND c.conversationId = @conversationId AND c.timestamp < @currentTimestamp ORDER BY c.timestamp DESC",
            // 'TOP 10' et 'ORDER BY DESC' puis inverser côté client/js est une façon de prendre les plus récents.
            // Cosmos DB ne supporte pas 'LIMIT' directement de manière simple dans toutes les API pour le 'TAIL'.
            parameters: [
                { name: "@userId", value: userId },
                { name: "@conversationId", value: currentOrNewConversationId },
                { name: "@currentTimestamp", value: currentTimestamp } // Exclure le message actuel
            ]
        };
        const { resources: historyMessagesFromDb } = await conversationsContainer.items.query(historyQuery).fetchAll();
        chatHistoryForLLM = historyMessagesFromDb.reverse(); // Mettre dans l'ordre chronologique
    }
    
    // 3. Obtenir la réponse du LLM (maintenant sans RAG)
    const botResponseText = await getLLMResponse(userInputText, chatHistoryForLLM);

    // 4. Préparer et sauvegarder le message du bot
    let savedBotMessage = null;
    if (botResponseText && botResponseText.trim() !== "") { // Sauvegarder seulement si le bot a quelque chose à dire
        const botMessageEntry = {
            id: uuidv4(),
            conversationId: currentOrNewConversationId,
            userId, 
            userType: userRole, 
            sender: 'bot',
            text: botResponseText,
            timestamp: new Date().toISOString(), 
            metadata: metadata || {},
        };
        const { resource } = await conversationsContainer.items.create(botMessageEntry);
        savedBotMessage = resource;
    }

    // 5. Renvoyer
    res.status(201).json({
      conversationId: currentOrNewConversationId,
      userMessage: savedUserMessage, 
      botMessage: savedBotMessage   
    });

  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error.message, error.stack);
    res.status(500).json({ message: 'Erreur serveur lors de l\'envoi du message.' });
  }
};