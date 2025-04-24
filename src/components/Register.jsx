import React from "react";
import "../index.css";

export default function Register() {
  return (
    <div className="page-container">
      <h2>Crear cuenta</h2>
      <input type="text" placeholder="Nombre de usuario" />
      <input type="email" placeholder="Correo electrónico" />
      <input type="password" placeholder="Contraseña" />
      <button className="btn-primary">Registrarse</button>

      <div className="form-link">
        ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
      </div>
    </div>
  );
}
