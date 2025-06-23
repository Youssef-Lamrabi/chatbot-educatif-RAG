import dotenv from 'dotenv';
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers"; // Pour obtenir directement le texte

dotenv.config();

// Configuration du LLM Mistral AI
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL_NAME = process.env.MISTRAL_MODEL_NAME || "mistral-small-latest";

let llm; // Instance du LLM
let chatChain; // Chaîne LangChain pour le chat

if (!MISTRAL_API_KEY) {
  console.error(
    "ERREUR CRITIQUE : La variable d'environnement MISTRAL_API_KEY n'est pas définie ! Le LLM ne fonctionnera pas."
  );
  // En l'absence de clé, vous pourriez vouloir créer un llm factice pour que l'app ne plante pas
  // ou simplement laisser llm undefined et getLLMResponse renverra une erreur.
} else {
  try {
    llm = new ChatMistralAI({
      apiKey: MISTRAL_API_KEY,
      modelName: MISTRAL_MODEL_NAME,
      temperature: 0.7, // Ajustez la créativité. 0 pour plus déterministe, >1 pour plus créatif.
      // maxTokens: 500, // Limite optionnelle sur la longueur de la réponse
    });
    console.log(
      `LLM configuré pour utiliser le modèle Mistral AI API : ${MISTRAL_MODEL_NAME}`
    );

    // Créer un prompt simple pour le chat
    // Vous pouvez l'adapter pour donner des instructions spécifiques au bot
    const chatPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "Tu es un assistant conversationnel amical et serviable. Réponds aux questions de l'utilisateur de manière claire et concise. Si la question est en arabe, essaie de répondre en arabe.",
      ],
      new MessagesPlaceholder("chat_history"), // Pour l'historique de la conversation
      ["human", "{input}"], // L'input de l'utilisateur
    ]);

    // Créer une chaîne simple : prompt -> llm -> parser de sortie
    chatChain = chatPrompt.pipe(llm).pipe(new StringOutputParser());
    console.log("Chaîne de chat simple initialisée.");

  } catch (error) {
    console.error("Erreur lors de l'initialisation du LLM Mistral AI :", error);
    // llm et chatChain resteront undefined
  }
}

/**
 * Obtient une réponse du LLM Mistral basé sur l'input et l'historique du chat.
 * PAS DE RAG ICI.
 */
export async function getLLMResponse(userInput, // Renommé pour plus de clarté
                                            chatHistory = []) {
  if (!llm || !chatChain) {
    console.error(
      "getLLMResponse: LLM ou chatChain non initialisé. Vérifiez la clé API Mistral et la configuration."
    );
    return "Désolé, je ne suis pas disponible pour le moment P(le service de langage n'est pas configuré).";
  }

  // Formatter l'historique pour LangChain
  const formattedHistory = chatHistory.map((msg) => {
    if (msg.sender === "user" || msg.role === "user") return new HumanMessage(msg.text || msg.content);
    if (msg.sender === "bot" || msg.role === "assistant" || msg.role === "ai") return new AIMessage(msg.text || msg.content);
    return new HumanMessage(String(msg.text || msg.content)); // Fallback en cas de format inconnu
  }).filter(Boolean); // Retirer les entrées null/undefined

  console.log(
    "Appel du LLM Mistral avec l'input:",
    userInput.substring(0, 100) + "...",
    "et l'historique:",
    formattedHistory.map(m => `${m.constructor.name}: ${m.content.substring(0,50)}...  `)
  );

  try {
    const response = await chatChain.invoke({
      chat_history: formattedHistory,
      input: userInput,
    });
    console.log("Réponse obtenue du LLM Mistral:", response ? response.substring(0,100) + "..." : "[Réponse vide]");
    return response || "Je n'ai pas de réponse pour cela pour le moment."; // Réponse par défaut si le LLM renvoie vide
  } catch (error) {
    console.error("Erreur lors de l'appel au LLM Mistral:", error);
    if (error.message && error.message.includes("401")) {
      return "Il semble y avoir un problème d'authentification avec le service Mistral. Vérifiez votre clé API.";
    }
    // Vous pourriez vouloir vérifier d'autres codes d'erreur spécifiques à l'API Mistral ici
    // Par exemple, les erreurs de quota (souvent 429 Too Many Requests)
    if (error.response && error.response.status === 429) {
        return "Limite de requêtes atteinte pour l'API Mistral. Veuillez réessayer plus tard.";
    }
    return "Désolé, j'ai rencontré un problème technique en essayant de vous répondre.";
  }
}

// La fonction prepareAndSaveVectorStore n'est plus nécessaire ici.
// Si vous avez un script "prepare-rag" dans package.json, vous pouvez le supprimer ou le commenter.
// La logique de --prepare-rag-now à la fin de ce fichier peut également être supprimée.