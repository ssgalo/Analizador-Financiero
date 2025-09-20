import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./components/layout/Layout"
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
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="gastos" element={<GastosPage />} />
          <Route path="importar" element={<ImportarPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="integraciones" element={<IntegracionesPage />} />
          <Route path="objetivos" element={<ObjetivosPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
