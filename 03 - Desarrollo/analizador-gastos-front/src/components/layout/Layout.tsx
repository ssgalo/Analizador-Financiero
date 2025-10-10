import React from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-6">
          {children}
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout