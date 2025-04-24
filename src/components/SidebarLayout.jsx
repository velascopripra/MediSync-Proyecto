import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import "./SidebarLayout.css";

export default function SidebarLayout() {
  const [open, setOpen] = useState(false);

  const toggleSidebar = () => setOpen(!open);

  return (
    <div className="layout">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={open} />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "open" : "closed"}`}>
        <h2 className="logo">MiCuenta</h2>
        <nav>
          <ul>
            <li><Link to="/login">Iniciar Sesión</Link></li>
            <li><Link to="/register">Registrarse</Link></li>
            <li><Link to="/forgot-password">Recuperar Contraseña</Link></li>
            <li><Link to="/profile">Perfil</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal con espacio para navbar */}
      <main className={`content ${open ? "shifted" : ""}`}>
        <div style={{ paddingTop: "80px" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
