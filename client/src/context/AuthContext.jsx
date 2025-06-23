import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api'; // Utilise l'instance axios configurée

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Pour gérer l'état de chargement initial

  // Vérifier si un utilisateur est déjà connecté au chargement de l'application
  const verifyAuth = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Pas besoin de remettre le header ici, l'intercepteur axios s'en charge
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error("Échec de la vérification de l'authentification:", error);
        localStorage.removeItem('authToken'); // Token invalide ou expiré
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('authToken', response.data.token);
      // L'intercepteur axios s'occupera d'ajouter le token aux futures requêtes
      // Re-vérifier l'utilisateur pour s'assurer que tout est à jour
      await verifyAuth(); // Met à jour l'état user et loading
      return response.data; // Renvoyer les données pour une redirection potentielle
    } catch (error) {
      setLoading(false);
      throw error; // Renvoyer l'erreur pour la gérer dans le composant AuthPage
    }
  };

  const register = async (username, password, role) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { username, password, role });
      localStorage.setItem('authToken', response.data.token);
      await verifyAuth();
      return response.data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    // L'intercepteur axios ne trouvera plus de token
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {!loading && children} {/* Affiche les enfants seulement quand le chargement initial est terminé */}
    </AuthContext.Provider>
  );
};

export default AuthContext;