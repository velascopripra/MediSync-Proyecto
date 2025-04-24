import React from "react";
import "./Navbar.css";

export default function Navbar({ toggleSidebar, isSidebarOpen }) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <img src="/favicon.png" alt="Logo" className="logo" />
      </div>

      <h1 className="navbar-title">MiCuenta</h1>

      <div className="navbar-right">
        <button className="menu-button" onClick={toggleSidebar}>
          {isSidebarOpen ? "✖" : "☰"}
        </button>
      </div>
    </header>
  );
}
