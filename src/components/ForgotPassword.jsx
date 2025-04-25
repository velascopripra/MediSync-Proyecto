import React from "react";
import "../index.css";

export default function ForgotPassword() {
  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Panel izquierdo */}
        <div className="login-left">
          <h1>Recuperar contraseña</h1>
          <p className="welcome-text">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña</p>

          <input type="email" placeholder="Correo electrónico" className="input" />
          <button className="btn-login">Enviar enlace</button>

          <div className="signup-link">
            ¿Recordaste tu contraseña? <a href="/login">Inicia sesión</a>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="login-right">
          <div className="login-right-buttons">
            <a href="/register" className="btn-text">Registrarse</a>
            <a href="#" className="btn-outline">Ayuda</a>
          </div>
          <div className="login-right-text">
            <h2>Recupera tu acceso a MediSync</h2>
            <p>
              Restablece tu contraseña fácilmente y vuelve a gestionar tus citas, recetas e historial médico con nuestra plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
