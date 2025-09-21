import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/layout/Layout"
import AuthPage from "./pages/AuthPage"
import Home from "./pages/Home"
import GastosPage from "./pages/GastosPage"
import ImportarPage from "./pages/ImportarPage"
import ChatPage from "./pages/ChatPage"
import ReportesPage from "./pages/ReportesPage"
import IntegracionesPage from "./pages/IntegracionesPage"
import ObjetivosPage from "./pages/ObjetivosPage"
import ConfiguracionPage from "./pages/ConfiguracionPage"

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="gastos" element={<GastosPage />} />
            <Route path="importar" element={<ImportarPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="integraciones" element={<IntegracionesPage />} />
            <Route path="objetivos" element={<ObjetivosPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
