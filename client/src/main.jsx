import React, { Suspense } from 'react'; // Ajoutez Suspense
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import './i18n'; // Importez la configuration i18n
import Spinner from './components/UI/Spinner.jsx'; // Pour le fallback de Suspense

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Spinner size="lg"/></div>}> {/* Fallback pour le chargement des traductions */}
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </Suspense>
  </React.StrictMode>,
);