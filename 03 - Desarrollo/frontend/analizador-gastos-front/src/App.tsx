import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeAuth } from './stores/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Páginas
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import GastosPage from './pages/GastosPage';
import ObjetivosPage from './pages/ObjetivosPage';
import ReportesPage from './pages/ReportesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import ChatPage from './pages/ChatPage';
import ImportarPage from './pages/ImportarPage';
import IntegracionesPage from './pages/IntegracionesPage';

// Estilos
import './App.css';

const App: React.FC = () => {
  // Inicializar autenticación al cargar la app
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta pública - Login/Register */}
          <Route path="/auth" element={<AuthPage />} />
          
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
          
          <Route path="/integraciones" element={
            <ProtectedRoute>
              <Layout>
                <IntegracionesPage />
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
          
          {/* Ruta de redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
