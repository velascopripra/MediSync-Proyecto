import React from "react";
import "../index.css";

export default function Profile() {
  return (
    <div className="page-container">
      <h2>Mi perfil</h2>
      <input type="email" placeholder="Correo electrónico" />
      <input type="text" placeholder="Nombre de usuario" />

      <div className="profile-buttons">
        <button className="btn-primary">Actualizar</button>
        <button className="btn-danger">Eliminar cuenta</button>
      </div>

      <div className="form-link">
        ¿No tienes una cuenta? <a href="/register">Regístrate</a>
      </div>
    </div>
  );
}
