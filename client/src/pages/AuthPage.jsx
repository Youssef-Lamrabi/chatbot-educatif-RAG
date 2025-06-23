import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/UI/LanguageSwitcher';

const AuthPage = () => {
  const { t } = useTranslation();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLoginMode) {
        await login(username, password);
      } else {
        await register(username, password, role);
      }
      navigate('/');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || t('login.errorMessage');
      if (errorMessage.includes("Nom d'utilisateur ou mot de passe incorrect")) {
          setError(t('login.errorMessage'));
      } else {
          setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-600 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-black mb-8">
          {isLoginMode ? t('login.title') : t('signup.title')}
        </h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-1" htmlFor="username">
              {t('login.usernameLabel')}
            </label>
            <input
              type="text" 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" // Ajout de text-black ici
              required 
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1" htmlFor="password">
              {t('login.passwordLabel')}
            </label>
            <input
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" // Ajout de text-black ici
              required 
              autoComplete={isLoginMode ? "current-password" : "new-password"}
            />
          </div>
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-black mb-1" htmlFor="role">
                {t('signup.roleLabel')}
              </label>
              <select
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black" // Ajout de text-black ici
              >
                <option value="student">{t('signup.student')}</option>
                <option value="teacher">{t('signup.teacher')}</option>
                <option value="admin">{t('signup.admin')}</option>
              </select>
            </div>
          )}
          <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={isLoading}>
            {isLoginMode ? t('login.loginButton') : t('signup.signupButton')}
          </Button>
        </form>
        <p className="text-center text-sm text-black mt-8">
          <button
            onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
            className="font-medium text-blue-600 hover:text-blue-500 hover:underline" 
            type="button"
          >
            {isLoginMode ? t('login.noAccount') : t('signup.haveAccount')}
          </button>
        </p>
      </Card>
    </div>
  );
};

export default AuthPage;