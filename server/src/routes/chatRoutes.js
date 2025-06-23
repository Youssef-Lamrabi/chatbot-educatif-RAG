import express from 'express';
import { getConversationHistory, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js'; // Middleware pour protéger les routes

const router = express.Router();

// Appliquer le middleware 'protect' à toutes les routes de chat
// Seuls les utilisateurs authentifiés pourront y accéder
router.use(protect); 

router.get('/history', getConversationHistory); // Route pour obtenir l'historique du chat
router.post('/send', sendMessage);              // Route pour envoyer un message

export default router;