import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { usersContainer } from '../config/db.js'; // Accès au conteneur Users de Cosmos DB

dotenv.config();

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Extrait le token de l'en-tête
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifie la validité du token

      // Récupère l'utilisateur depuis Cosmos DB en utilisant l'ID du token
      // Le deuxième argument 'decoded.id' est la valeur de la clé de partition ('/id')
      const { resource: userFromDb } = await usersContainer.item(decoded.id, decoded.id).read();

      if (!userFromDb) {
          // Si l'utilisateur n'est pas trouvé dans la DB (ex: supprimé après émission du token)
          return res.status(401).json({ message: 'Non autorisé, utilisateur non trouvé dans la base de données' });
      }
      
      // Exclut le mot de passe des informations de l'utilisateur avant de l'attacher à la requête
      const { password, ...userData } = userFromDb;
      req.user = userData; // Attache les données utilisateur à l'objet req pour usage ultérieur

      next(); // Passe au prochain middleware ou à la route
    } catch (error) {
      console.error("Erreur du middleware d'authentification:", error.message);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Non autorisé, token invalide ou expiré' });
      } 
      if (error.code === 404) { // Code d'erreur de Cosmos DB si l'item n'est pas trouvé
        return res.status(401).json({ message: 'Non autorisé, utilisateur non trouvé dans la base de données (détail middleware)' });
      }
      // Pour toute autre erreur (ex: problème de connexion à la DB pendant le .read())
      return res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'authentification' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, pas de token fourni' });
  }
};

export { protect };