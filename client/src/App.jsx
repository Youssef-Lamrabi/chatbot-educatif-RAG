import React from 'react';
import { Routes, Route, Navigate, Outlet, Link } from 'react-router-dom'; // Ajoutez Link
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage'; // Importez la nouvelle page
import useAuth from './hooks/useAuth';
import Spinner from './components/UI/Spinner';
import LanguageSwitcher from './components/UI/LanguageSwitcher'; // Pour le sélecteur global
import { useTranslation } from 'react-i18next';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-800 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <Link to="/" className="text-xl font-bold hover:text-gray-300">Chatbot Éducatif</Link>
        <nav className="flex items-center space-x-4">
          {user && user.role === 'admin' && (
            <Link to="/dashboard" className="hover:text-gray-300">{t('dashboard.title')}</Link>
          )}
          <LanguageSwitcher />
          {user && (
            <button onClick={logout} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-sm">
              {t('common.logout')}
            </button>
          )}
        </nav>
      </header>
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};


const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /><p className="ml-2">Chargement...</p></div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <MainLayout><Outlet /></MainLayout>; // Enveloppe avec MainLayout
};

const AuthLayout = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
    if (isAuthenticated) return <Navigate to="/" replace />;
    return <Outlet />; // AuthPage gère son propre layout complet
};

function App() {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} /> 
        {/* Ajoutez ici d'autres routes protégées qui utiliseront MainLayout */}
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/auth" element={<AuthPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;