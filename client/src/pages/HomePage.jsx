import React from 'react';
// Retirer le bouton de déconnexion d'ici, il est dans MainLayout
// import useAuth from '../hooks/useAuth';
// import Button from '../components/UI/Button';
// import { LogOut } from 'lucide-react';
import ChatInterface from '../components/Chat/ChatInterface'; // Nouveau composant principal pour le chat

const HomePage = () => {
  // const { user, logout } = useAuth(); // Plus besoin ici si géré par MainLayout

  return (
    // h-screen et flex-col sont maintenant gérés par MainLayout et ChatInterface
    <ChatInterface />
  );
};

export default HomePage;