import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/UI/Spinner';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr, arSA } from 'date-fns/locale'; // Importer les locales pour date-fns

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user?.role !== 'admin') {
        setError(t('dashboard.noAccess'));
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/dashboard-users');
        setDashboardData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur chargement données dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, t]);

  const getDateLocale = () => {
    return i18n.language === 'ar' ? arSA : fr;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /><p className="ml-3">{t('common.loading')}</p></div>;
  if (error) return <div className="p-8 text-center text-red-600 bg-red-100">{error}</div>;
  if (!dashboardData || user?.role !== 'admin') return <div className="p-8 text-center">{t('dashboard.noAccess')}</div>;


  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t('dashboard.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('dashboard.totalUsers')}</h2>
          <p className="text-4xl font-bold text-blue-600">{dashboardData.totalUsers}</p>
        </div>
        {/* Ajoutez d'autres tuiles de statistiques ici si nécessaire */}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('dashboard.usersList')}</h2>
        {dashboardData.usersList && dashboardData.usersList.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.usernameHeader')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.roleHeader')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dashboard.joinedHeader')}</th>
                {/* Ajoutez l'email si vous le récupérez et voulez l'afficher */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.usersList.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(u.createdAt), 'PPpp', { locale: getDateLocale() })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">Aucun utilisateur à afficher.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;