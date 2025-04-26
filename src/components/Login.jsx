import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import "../index.css"; // Estilos compartidos

export default function Login() {
  // Estado para el identificador (puede ser email o username)
  const [identifier, setIdentifier] = useState("");
  // Estado para la contraseña
  const [password, setPassword] = useState("");
  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  // Estado para mensajes de error
  const [error, setError] = useState("");
  // Estado para indicar carga
  const [loading, setLoading] = useState(false);

  // Hook para navegación
  const navigate = useNavigate();

  // Manejador del envío del formulario
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevenir recarga de página
    setError(""); // Limpiar errores previos
    setLoading(true); // Iniciar estado de carga

    try {
      // Llamada a la API de login del backend
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // *** IMPORTANTE: Incluir credenciales para manejo de cookies/sesión ***
        credentials: 'include',
        // Enviar identificador y contraseña
        body: JSON.stringify({ identifier: identifier, password: password }),
      });

      // Parsear la respuesta JSON
      const data = await response.json();

      // Si la respuesta fue exitosa (status 200-299) Y el backend confirma éxito
      if (response.ok && data.success) {
        console.log("Login exitoso, redirigiendo al perfil...");
        // Aquí podrías guardar data.user en un estado global (Context, Zustand, etc.) si lo necesitas
        navigate("/profile"); // Redirigir a la página de perfil
      } else {
        // Si hubo un error (4xx, 5xx) o el backend indica success: false
        // Mostrar el mensaje de error específico del backend
        setError(data.message || `Error ${response.status}: No se pudo iniciar sesión.`);
        console.error("Error de login:", data.message || `Status ${response.status}`);
      }
    } catch (err) {
      // Error de red o al intentar conectar con el servidor
      console.error("Error de conexión en login:", err);
      setError("No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.");
    } finally {
      // Se ejecuta siempre, al finalizar el try o el catch
      setLoading(false); // Finalizar estado de carga
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Panel izquierdo: Formulario */}
        <div className="login-left">
          <h1>¡Bienveni@!</h1>
          <p className="welcome-text">Accede a tu cuenta para gestionar tus citas médicas</p>

          {/* Input para Identificador (Email o Username) */}
          <input
            type="text" // Cambiado a text para permitir username
            placeholder="Correo electrónico o nombre de usuario"
            className="input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)} // Actualiza estado identifier
            disabled={loading} // Deshabilitado mientras carga
            required // Campo obligatorio
          />

          {/* Input para Contraseña */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            {/* Icono para mostrar/ocultar contraseña */}
            <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </span>
          </div>

          {/* Muestra mensaje de error si existe */}
          {error && <p style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</p>}

          {/* Enlace a Recuperar Contraseña */}
          <div className="forgot-password">
            <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
          </div>

          {/* Botón de Iniciar Sesión */}
          <button className="btn-login" onClick={handleSubmit} disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>

          {/* Enlace a Registro */}
          <div className="signup-link">
            ¿No tienes una cuenta? <a href="/register">Regístrate</a>
          </div>
        </div>

        {/* Panel derecho: Informativo/Decorativo */}
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
