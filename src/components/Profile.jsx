import React from "react";
import "../index.css";

export default function Profile() {
  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Panel izquierdo */}
        <div className="login-left">
          <h1>Mi perfil</h1>
          <p className="welcome-text">Actualiza tu información personal o elimina tu cuenta si lo deseas</p>

          <input type="email" placeholder="Correo electrónico" className="input" />
          <input type="text" placeholder="Nombre de usuario" className="input" />

          <div className="profile-buttons">
            <button className="btn-login">Actualizar</button>
            <button className="btn-danger">Eliminar cuenta</button>
          </div>

          <div className="signup-link">
            ¿No tienes una cuenta? <a href="/register">Regístrate</a>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="login-right">
          <div className="login-right-buttons">
            <a href="/" className="btn-text">Inicio</a>
            <a href="#" className="btn-outline">Cerrar sesión</a>
          </div>
          <div className="login-right-text">
            <h2>Gestiona tu perfil en MediSync</h2>
            <p>
              Mantén tu información actualizada para recibir una mejor atención y tener acceso rápido a tus citas y datos médicos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
