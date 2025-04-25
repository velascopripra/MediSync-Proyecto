import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Importar Link y useNavigate
import "../index.css"; // Asegúrate que tus estilos estén bien aquí

export default function Register() {
  // --- Estados para cada campo del formulario ---
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Para confirmar contraseña
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");

  // --- Estados para UI/Errores ---
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Para mensaje de éxito
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // Hook para navegación

  // --- Manejador de envío ---
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevenir recarga
    setError(""); // Limpiar errores
    setSuccess(""); // Limpiar éxito
    setLoading(true);

    // Validación básica en frontend
    if (!name || !lastName || !email || !username || !password || !confirmPassword || !secretQuestion || !secretAnswer) {
      setError("Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    // Datos a enviar al backend
    const registrationData = {
      name,
      lastName,
      email,
      username,
      password,
      secretQuestion,
      secretAnswer
    };

    console.log("Enviando datos de registro:", registrationData);

    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        console.log("Registro exitoso:", data);
        setSuccess("¡Registro exitoso! Ahora puedes iniciar sesión.");
        // Opcional: Redirigir a login después de un tiempo o al hacer clic
        setTimeout(() => {
            navigate('/login');
        }, 2000); // Redirige a login después de 2 segundos
      } else {
        // Manejar errores del backend (ej. email/username ya existen, validación)
        console.error("Error en registro:", data.message || "Error desconocido");
        setError(data.message || "Error durante el registro.");
      }

    } catch (err) {
      // Error de red
      setLoading(false);
      console.error("Error de conexión:", err);
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    }
  };

  // --- Renderizado del Componente ---
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