import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuth } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import SessionExpiredNotification from './components/auth/SessionExpiredNotification';

// Páginas
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Home from './pages/Home';
import GastosPage from './pages/GastosPage';
import IngresosPage from './pages/IngresosPage';
import ObjetivosPage from './pages/ObjetivosPage';
import ReportesPage from './pages/ReportesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import ChatPage from './pages/ChatPage';
import ImportarPage from './pages/ImportarPage';
import AcercaDePage from './pages/AcercaDePage';
import MasOpcionesPage from './pages/MasOpcionesPage';

// Estilos
import './App.css';

const App: React.FC = () => {
  // Inicializar autenticación al cargar la app (solo una vez)
  useEffect(() => {
    console.log('🚀 Inicializando aplicación...'); // Debug
    initializeAuth();
  }, []); // Sin dependencias para que solo se ejecute una vez

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rutas públicas - Login/Register/Reset */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/gastos" element={
            <ProtectedRoute>
              <Layout>
                <GastosPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/ingresos" element={
            <ProtectedRoute>
              <Layout>
                <IngresosPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/objetivos" element={
            <ProtectedRoute>
              <Layout>
                <ObjetivosPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/reportes" element={
            <ProtectedRoute>
              <Layout>
                <ReportesPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          } />
          

          
          <Route path="/importar" element={
            <ProtectedRoute>
              <Layout>
                <ImportarPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/mas-opciones" element={
            <ProtectedRoute>
              <Layout>
                <MasOpcionesPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/configuracion" element={
            <ProtectedRoute>
              <Layout>
                <ConfiguracionPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/acerca-de" element={
            <ProtectedRoute>
              <Layout>
                <AcercaDePage />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Ruta de redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Notificación global de sesión expirada */}
        <SessionExpiredNotification />
      </div>
    </Router>
  );
};

export default App;
