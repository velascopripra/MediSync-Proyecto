import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Importar para navegar
import "../index.css";

export default function Login() {
  // --- Estados ---
  const [email, setEmail] = useState(""); // Estado para el campo email
  const [password, setPassword] = useState(""); // Estado para el campo contraseña
  const [error, setError] = useState(""); // Estado para mensajes de error
  const [loading, setLoading] = useState(false); // Estado para indicar carga (opcional)

  const navigate = useNavigate(); // Hook para la navegación

  // --- Manejador de envío del formulario ---
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevenir recarga de la página
    setError(""); // Limpiar errores previos
    setLoading(true); // Indicar que estamos procesando

    console.log("Enviando datos:", { email, password });

    try {
      // --- Llamada a la API del Backend ---
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST', // Usamos el método POST
        headers: {
          'Content-Type': 'application/json', // ¡Muy importante indicar que enviamos JSON!
        },
        body: JSON.stringify({ email, password }), // Convertimos los datos a string JSON
      });

      // Parsear la respuesta JSON del backend
      const data = await response.json();
      setLoading(false); // Termina la carga

      // --- Manejar la respuesta ---
      if (response.ok && data.success) {
        // ¡Login Exitoso!
        console.log("Login exitoso:", data);
        // Aquí podrías guardar datos del usuario o un token si el backend lo devolviera
        // Navegar a la página de perfil (o a donde necesites)
        navigate('/profile');
      } else {
        // Login Fallido o error del servidor
        console.error("Error en login:", data.message || "Error desconocido");
        setError(data.message || "Error al intentar iniciar sesión. Intenta de nuevo.");
      }
    } catch (err) {
      // Error de red o al intentar conectar con el backend
      setLoading(false); // Termina la carga
      console.error("Error de conexión:", err);
      setError("No se pudo conectar con el servidor. Verifica tu conexión.");
    }
  };

  // --- Renderizado del Componente ---
  return (
    <div className="page-container">
      <h2>Iniciar sesión</h2>
      {/* Asociamos los inputs con el estado usando value y onChange */}
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading} // Deshabilitar mientras carga (opcional)
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading} // Deshabilitar mientras carga (opcional)
      />
      {/* Mostrar mensaje de error si existe */}
      {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}
      {/* Llamamos a handleSubmit al hacer click en el botón */}
      <button
        className="btn-primary"
        onClick={handleSubmit} // Usamos onClick aquí, o podrías envolver todo en <form onSubmit={handleSubmit}>
        disabled={loading} // Deshabilitar mientras carga (opcional)
      >
        {loading ? "Entrando..." : "Entrar"} {/* Cambiar texto del botón (opcional) */}
      </button>

      <div className="form-link">
        ¿Olvidaste tu contraseña? <a href="/forgot-password">Recupérala aquí</a>
      </div>
      <div className="form-link">
        ¿No tienes una cuenta? <a href="/register">Regístrate</a>
      </div>
    </div>
  );
}