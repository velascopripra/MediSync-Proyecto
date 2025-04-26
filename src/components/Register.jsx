import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"; // Icons for password visibility
import "../index.css"; // Import shared styles

// Componente funcional para el registro de usuarios
export default function Register() {
  // Hook para la navegación programática
  const navigate = useNavigate();

  // Estado para manejar los datos del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    username: "",
    correo: "",
    password: "",
    confirmPassword: "", // Campo adicional para confirmar contraseña
    preguntaSeguridad: "",
    respuestaSeguridad: "",
  });

  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado para mensajes de error
  const [error, setError] = useState("");
  // Estado para mensajes de éxito
  const [success, setSuccess] = useState("");
  // Estado para indicar si la petición está en curso
  const [loading, setLoading] = useState(false);

  // Manejador para cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Actualiza el estado del formulario
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Limpia errores al empezar a escribir de nuevo
    setError("");
    setSuccess("");
  };

  // Manejador para el envío del formulario
  const handleSubmit = async (event) => {
    event.preventDefault(); // Previene el comportamiento por defecto del formulario
    setError(""); // Limpia errores previos
    setSuccess(""); // Limpia mensajes de éxito previos

    // Validación básica: verificar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return; // Detiene el envío si no coinciden
    }

    // Validación básica: longitud mínima de contraseña
    if (formData.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
    }


    setLoading(true); // Indica que la petición ha comenzado

    try {
      // Realiza la petición POST al endpoint de registro del backend
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Envía los datos del formulario (excluyendo confirmPassword)
        body: JSON.stringify({
          nombre: formData.nombre,
          username: formData.username,
          correo: formData.correo,
          password: formData.password,
          preguntaSeguridad: formData.preguntaSeguridad,
          respuestaSeguridad: formData.respuestaSeguridad,
        }),
      });

      // Parsea la respuesta JSON
      const data = await response.json();

      // Si la respuesta es exitosa (status 2xx) y el backend confirma success: true
      if (response.ok && data.success) {
        setSuccess("¡Registro exitoso! Redirigiendo al login...");
        // Espera un momento para que el usuario vea el mensaje y luego redirige
        setTimeout(() => {
          navigate("/login"); // Redirige a la página de login
        }, 2000); // Espera 2 segundos
      } else {
        // Si hay un error (status 4xx, 5xx o success: false)
        setError(data.message || "Error en el registro. Intenta de nuevo.");
      }
    } catch (err) {
      // Error de red o al conectar con el servidor
      console.error("Error de conexión:", err);
      setError("No se pudo conectar con el servidor. Verifica tu conexión.");
    } finally {
      // Se ejecuta siempre, tanto en éxito como en error
      setLoading(false); // Indica que la petición ha terminado
    }
  };

  return (
    // Contenedor principal con estilos definidos en index.css
    <div className="login-wrapper">
      <div className="login-container">
        {/* Panel izquierdo: Formulario de Registro */}
        <div className="login-left">
          <h1>Crear Cuenta</h1>
          <p className="welcome-text">Ingresa tus datos para registrarte en MediSync</p>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            {/* Campo Nombre */}
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              className="input"
              value={formData.nombre}
              onChange={handleChange}
              required // Campo obligatorio
              disabled={loading} // Deshabilita mientras carga
            />

            {/* Campo Username */}
            <input
              type="text"
              name="username"
              placeholder="Nombre de usuario"
              className="input"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />

            {/* Campo Correo Electrónico */}
            <input
              type="email"
              name="correo"
              placeholder="Correo electrónico"
              className="input"
              value={formData.correo}
              onChange={handleChange}
              required
              disabled={loading}
            />

            {/* Campo Contraseña */}
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña (mín. 6 caracteres)"
                className="input"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6" // Validación HTML5
                disabled={loading}
              />
              {/* Botón para mostrar/ocultar contraseña */}
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </span>
            </div>

             {/* Campo Confirmar Contraseña */}
             <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                className="input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
                disabled={loading}
              />
              {/* Botón para mostrar/ocultar contraseña */}
              <span
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </span>
            </div>

            {/* Campo Pregunta de Seguridad */}
            <input
              type="text"
              name="preguntaSeguridad"
              placeholder="Pregunta de seguridad (ej: nombre de mascota)"
              className="input"
              value={formData.preguntaSeguridad}
              onChange={handleChange}
              required
              disabled={loading}
            />

            {/* Campo Respuesta de Seguridad */}
            <input
              type="password" // Usar password para ocultar la respuesta
              name="respuestaSeguridad"
              placeholder="Respuesta de seguridad"
              className="input"
              value={formData.respuestaSeguridad}
              onChange={handleChange}
              required
              disabled={loading}
            />

            {/* Muestra mensajes de error */}
            {error && <p style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</p>}
            {/* Muestra mensajes de éxito */}
            {success && <p style={{ color: 'green', marginBottom: '10px', textAlign: 'center' }}>{success}</p>}


            {/* Botón de Registro */}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>

          {/* Enlace para ir a Iniciar Sesión */}
          <div className="signup-link">
            ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
          </div>
        </div>

        {/* Panel derecho: Decorativo o informativo */}
        <div className="login-right">
          <div className="login-right-buttons">
            <a href="/login" className="btn-text">Iniciar Sesión</a>
            <a href="#" className="btn-outline">Ayuda</a> {/* Enlace de ayuda genérico */}
          </div>
          <div className="login-right-text">
            <h2>Únete a MediSync</h2>
            <p>
              Regístrate para acceder a la gestión de tus citas médicas, historial y mucho más en la Red de Clínicas Salud Total.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
