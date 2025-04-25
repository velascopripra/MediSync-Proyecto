import React from "react";
import "../index.css";

export default function Register() {
  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Panel izquierdo */}
        <div className="login-left">
          <h1>¡Crea tu cuenta!</h1>
          <p className="welcome-text">Regístrate para gestionar tus citas médicas</p>

          <input type="text" placeholder="Nombre de usuario" className="input" />
          <input type="email" placeholder="Correo electrónico" className="input" />
          <input type="password" placeholder="Contraseña" className="input" />

          <button className="btn-login">Registrarse</button>

          <div className="signup-link">
            ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="login-right">
          <div className="login-right-buttons">
            <a href="/login" className="btn-text">Iniciar sesión</a>
            <a href="#" className="btn-outline">Ayuda</a>
          </div>
          <div className="login-right-text">
            <h2>Únete a MediSync</h2>
            <p>
              Optimiza tu experiencia médica. Gestiona tus citas, mantén tu historial
              y accede a servicios de salud con eficiencia y tecnología.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}