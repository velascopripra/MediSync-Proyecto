import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "../index.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        navigate("/profile");
      } else {
        setError(data.message || "Error al intentar iniciar sesión. Intenta de nuevo.");
      }
    } catch (err) {
      setLoading(false);
      setError("No se pudo conectar con el servidor. Verifica tu conexión.");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Panel izquierdo */}
        <div className="login-left">
          <h1>¡Bienveni@!</h1>
          <p className="welcome-text">Accede a tu cuenta para gestionar tus citas médicas</p>

          <input
            type="email"
            placeholder="Correo electrónico"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </span>
          </div>

          {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

          <div className="forgot-password">
            <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
          </div>

          <button className="btn-login" onClick={handleSubmit} disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>

          <div className="signup-link">
            ¿No tienes una cuenta? <a href="/register">Regístrate</a>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="login-right">
          <div className="login-right-buttons">
            <a href="/register" className="btn-text">Registrarse</a>
            <a href="#" className="btn-outline">Ayuda</a>
          </div>
          <div className="login-right-text">
            <h2>Gestión eficiente de citas médicas con MediSync</h2>
            <p>
              MediSync centraliza la administración de citas en la Red de Clínicas Salud Total. 
              Simplifica la programación, mejora la atención y optimiza cada proceso con tecnología avanzada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
