import React from "react";
import "../index.css";

export default function ForgotPassword() {
  return (
    <div className="page-container">
      <h2>Recuperar contraseña</h2>
      <input type="email" placeholder="Correo electrónico" />
      <button className="btn-primary">Enviar enlace</button>

      <div className="form-link">
        ¿Recordaste tu contraseña? <a href="/login">Inicia sesión</a>
      </div>
    </div>
  );
}
