import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { usersContainer } from '../config/db.js'; // Accès au conteneur Users

dotenv.config();

// Fonction pour générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Le token expirera dans 30 jours
  });
};

// Contrôleur pour l'inscription d'un nouvel utilisateur
export const registerUser = async (req, res) => {
  const { username, password, role = 'student' } = req.body; // Role par défaut: 'student'

  if (!username || !password) {
    return res.status(400).json({ message: 'Veuillez renseigner tous les champs (nom d\'utilisateur et mot de passe).' });
  }

  try {
    // Vérifier si un utilisateur avec le même nom d'utilisateur (insensible à la casse) existe déjà
    const querySpec = {
      query: "SELECT * FROM c WHERE LOWER(c.username) = @username", // LOWER() pour l'insensibilité à la casse
      parameters: [{ name: "@username", value: username.toLowerCase() }]
    };
    const { resources: existingUsers } = await usersContainer.items.query(querySpec).fetchAll();

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris.' });
    }

    // Hasher le mot de passe avant de le stocker
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer le nouvel objet utilisateur pour Cosmos DB
    const newUser = {
      id: uuidv4(), // ID unique pour l'utilisateur, sera aussi la clé de partition
      username: username, // Stocker le nom d'utilisateur tel que fourni
      searchableUsername: username.toLowerCase(), // Champ pour la recherche insensible à la casse si besoin
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    // Enregistrer le nouvel utilisateur dans Cosmos DB
    const { resource: createdUser } = await usersContainer.items.create(newUser);

    if (createdUser) {
      res.status(201).json({
        _id: createdUser.id,
        username: createdUser.username,
        role: createdUser.role,
        token: generateToken(createdUser.id), // Renvoyer un token JWT pour connexion immédiate
      });
    } else {
      // Ce cas est peu probable car .create() lèverait une exception en cas d'échec
      res.status(400).json({ message: 'Données utilisateur invalides ou erreur lors de la création.' });
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription de l'utilisateur:", error.message, error.stack);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription. Veuillez réessayer.' });
  }
};

// Contrôleur pour la connexion d'un utilisateur existant
// ... (imports et generateToken restent les mêmes)

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe requis.' });
  }

  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE LOWER(c.username) = @username",
      parameters: [{ name: "@username", value: username.toLowerCase() }]
    };
    const { resources: users } = await usersContainer.items.query(querySpec).fetchAll();

    if (users.length === 0) {
      // Utilisateur non trouvé, mais on renvoie un message générique pour la sécurité
      return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
    }

    const user = users[0];

    if (await bcrypt.compare(password, user.password)) {
      res.json({
        _id: user.id,
        username: user.username, // Ou user.originalUsername si vous préférez
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      // Mot de passe incorrect pour un utilisateur trouvé
      return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
      // Alternative plus spécifique (mais moins sécurisée contre l'énumération d'utilisateurs):
      // return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }
  } catch (error) {
    console.error("Erreur connexion utilisateur:", error.message, error.stack);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion. Veuillez réessayer.' });
  }
};

// ... (registerUser et getMe restent les mêmes, sauf si vous voulez récupérer plus d'infos pour le dashboard)

// NOUVELLE ROUTE POUR LE DASHBOARD ADMIN
export const getUsersForDashboard = async (req, res) => {
  // S'assurer que seul un admin peut accéder à cette route (via le middleware protect qui met req.user)
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Réservé aux administrateurs.' });
  }

  try {
    // Récupérer tous les utilisateurs. Pour un grand nombre d'utilisateurs, la pagination serait nécessaire.
    // Sélectionner uniquement les champs nécessaires pour le dashboard.
    const querySpec = {
      query: "SELECT c.id, c.username, c.role, c.createdAt FROM c" // Ajoutez c.email si vous le stockez
    };
    const { resources: users } = await usersContainer.items.query(querySpec).fetchAll();
    
    res.status(200).json({
      totalUsers: users.length,
      usersList: users // Vous pourriez vouloir limiter les champs retournés ici pour la confidentialité
    });
  } catch (error) {
    console.error("Erreur récupération utilisateurs pour dashboard:", error.message, error.stack);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des données utilisateurs.' });
  }
};// Dans server/src/controllers/authController.js
// ... (autres imports en haut du fichier : bcrypt, jwt, uuid, dotenv, usersContainer)
// ... (fonction generateToken)
// ... (fonction registerUser)
// ... (fonction loginUser)

// ASSUREZ-VOUS QUE CETTE FONCTION EST PRÉSENTE ET EXPORTÉE CORRECTEMENT :
export const getMe = async (req, res) => {
  // req.user est déjà peuplé par le middleware 'protect'
  // et contient les données utilisateur sans le mot de passe.
  if (req.user) {
     res.status(200).json({
        _id: req.user.id, 
        username: req.user.username, // Ou req.user.originalUsername si c'est ce que vous préférez afficher
        role: req.user.role,
        // Ajoutez d'autres champs que vous voulez renvoyer si nécessaire
    });
  } else {
     // Ce cas ne devrait pas se produire si le middleware 'protect' a bien fonctionné
    console.error("getMe: req.user non trouvé dans le contrôleur alors que la route est protégée.");
    res.status(404).json({ message: "Informations utilisateur non trouvées dans la requête." });
  }
};

// ... (fonction getUsersForDashboard, assurez-vous qu'elle est aussi exportée avec `export const`)
// export const getUsersForDashboard = async (req, res) => { ... };