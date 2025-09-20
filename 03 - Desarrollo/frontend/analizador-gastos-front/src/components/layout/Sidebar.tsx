import { NavLink } from "react-router-dom"
import {
  Home,
  Receipt,
  Upload,
  MessageSquare,
  BarChart3,
  Settings,
  CreditCard,
  Target,
  DollarSign,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Mis Gastos", href: "/gastos", icon: Receipt },
  { name: "Importar", href: "/importar", icon: Upload },
  { name: "Chat IA", href: "/chat", icon: MessageSquare },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
  { name: "Integraciones", href: "/integraciones", icon: CreditCard },
  { name: "Objetivos", href: "/objetivos", icon: Target },
  { name: "Configuración", href: "/configuracion", icon: Settings },
]

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-teal rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Analizador Financiero</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const IconComponent = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-teal/10 text-teal border border-teal/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <IconComponent className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Juan Pérez</p>
            <p className="text-xs text-gray-500 truncate">juan@mail.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}