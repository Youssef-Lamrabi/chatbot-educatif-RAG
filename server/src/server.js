import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js'; // Fonction pour initialiser la connexion à Cosmos DB
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Charger les variables d'environnement du fichier .env
dotenv.config();

// Initialiser la connexion à la base de données Cosmos DB
connectDB();

const app = express();

// Activer CORS (Cross-Origin Resource Sharing) pour autoriser les requêtes depuis le frontend
app.use(cors()); 

// Middlewares pour parser le corps des requêtes
app.use(express.json()); // Pour parser les requêtes JSON (application/json)
app.use(express.urlencoded({ extended: false })); // Pour parser les requêtes URL-encoded (application/x-www-form-urlencoded)

// Route de test simple
app.get('/', (req, res) => {
  res.send('API du Chatbot Éducatif est en cours d\'exécution...');
});

// Monter les routeurs
app.use('/api/auth', authRoutes); // Routes pour l'authentification sous /api/auth
app.use('/api/chat', chatRoutes); // Routes pour le chat sous /api/chat

// Gestionnaire d'erreurs global simple (optionnel mais bonne pratique)
app.use((err, req, res, next) => {
  console.error("Erreur non gérée:", err.stack);
  res.status(500).send('Quelque chose s\'est mal passé sur le serveur!');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Serveur backend démarré sur le port ${PORT}`));