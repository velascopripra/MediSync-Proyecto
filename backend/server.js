import dotenv from 'dotenv'; // <-- CAMBIO: Importa dotenv
dotenv.config({ path: './.env' });             // <-- CAMBIO: Llama a config() explícitamente
console.log('>>> Verificando SESSION_SECRET al inicio:', process.env.SESSION_SECRET);
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt'; // Para hashear
import mongoose from 'mongoose'; // Para MongoDB
import session from 'express-session'; // Para sesiones
import Paciente from './Models/paciente.js'; // Modelo Paciente (nombre en minúscula)
import Credenciales from './Models/credenciales.js'; // Modelo Credenciales (nombre en minúscula)

// --- Función de Conexión a BD ---
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
        console.error("Error: La variable de entorno MONGO_URI no está definida.");
        console.log("Asegúrate de tener un archivo .env en la carpeta backend con MONGO_URI=tu_cadena_de_conexion");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado exitosamente.');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

// --- Función Principal Asíncrona para Iniciar Todo ---
const startServer = async () => {
  await connectDB(); // Espera la conexión a la BD

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middlewares Principales
  app.use(cors()); // Habilita CORS
  app.use(express.json()); // Permite parsear cuerpos JSON

  // Configuración de express-session
  app.use(session({
    secret: process.env.SESSION_SECRET, // Usa el secreto de .env
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: 'auto',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // Ejemplo: 1 día
    }
  }));

  // --- Middleware de Autenticación ---
  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
      req.user = { // Adjuntamos info al request para uso posterior
        id: req.session.userId,
        username: req.session.username,
        rol: req.session.rol,
        credentialId: req.session.credentialId
      };
      console.log(`Middleware: Usuario autenticado ${req.user.username}`);
      return next(); // Continuar a la siguiente función/ruta
    } else {
      console.log('Middleware: Acceso denegado - No autenticado.');
      return res.status(401).json({ success: false, message: 'Acceso no autorizado.' });
    }
  };

  // --- Rutas (Endpoints) ---

  // Ruta de prueba
  app.get('/', (req, res) => {
    res.send('¡Hola desde el backend MediSync!');
  });

  // --- RUTAS PÚBLICAS (Autenticación / Recuperación) ---

  // RUTA PARA REGISTRO (Usando BD Real)
  app.post('/api/register', async (req, res) => {
    console.log('--- Register Request Start (Real DB) ---');
    const { email, username, password, name, lastName, secretQuestion, secretAnswer } = req.body;
    if (!email || !username || !password || !name || !lastName || !secretQuestion || !secretAnswer) { return res.status(400).json({ success: false, message: 'Faltan campos requeridos.' }); }
    try {
      const existingPaciente = await Paciente.findOne({ correo: email.toLowerCase() });
      const existingCredenciales = await Credenciales.findOne({ username: username.toLowerCase() });
      if (existingPaciente) { return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado.' }); }
      if (existingCredenciales) { return res.status(409).json({ success: false, message: 'El nombre de usuario ya está registrado.' }); }
      const newPaciente = new Paciente({ nombre: name, apellido: lastName, correo: email.toLowerCase() });
      const savedPaciente = await newPaciente.save();
      console.log('Paciente guardado:', savedPaciente._id);
      try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const hashedSecretAnswer = await bcrypt.hash(secretAnswer, saltRounds);
        const newCredenciales = new Credenciales({ username: username.toLowerCase(), contraseña: hashedPassword, rol: 'Paciente', preguntaSeguridad: secretQuestion, respuestaSeguridad: hashedSecretAnswer, usuario_id: savedPaciente._id });
        await newCredenciales.save();
        console.log('Credenciales guardadas para usuario:', savedPaciente._id);
        return res.status(201).json({ success: true, message: 'Usuario registrado exitosamente.', user: { id: savedPaciente._id, email: savedPaciente.correo, username: newCredenciales.username, name: savedPaciente.nombre, lastName: savedPaciente.apellido, rol: newCredenciales.rol } });
      } catch (credencialesError) {
        console.error('Error al guardar credenciales, intentando rollback de paciente:', credencialesError);
        await Paciente.findByIdAndDelete(savedPaciente._id).catch(delErr => console.error("Error en rollback paciente:", delErr));
        throw credencialesError;
      }
    } catch (error) {
      console.error('Error general durante el registro:', error);
      if (error.name === 'ValidationError') { return res.status(400).json({ success: false, message: 'Error de validación.', errors: error.errors }); }
      return res.status(500).json({ success: false, message: 'Error interno del servidor durante el registro.' });
    }
  });

  // RUTA PARA LOGIN (Usando BD Real y Sesiones)
  app.post('/api/login', async (req, res) => {
    console.log('--- Login Request Start (Real DB) ---');
    const { identifier, password } = req.body;
    if (!identifier || !password) { return res.status(400).json({ success: false, message: 'Identificador (email/username) y contraseña son requeridos.' }); }
    const MAX_LOGIN_ATTEMPTS = 5;
    try {
      let credenciales = null; const identifierLower = identifier.toLowerCase();
      credenciales = await Credenciales.findOne({ username: identifierLower });
      if (!credenciales) { const paciente = await Paciente.findOne({ correo: identifierLower }); if (paciente) { credenciales = await Credenciales.findOne({ usuario_id: paciente._id }); } }
      if (!credenciales) { console.log(`Login fallido: Identificador '${identifier}' no encontrado.`); return res.status(401).json({ success: false, message: 'Credenciales inválidas.' }); }
      if (credenciales.estadoCuenta === 'Bloqueada') { console.log(`Login fallido: Cuenta para '${identifier}' está bloqueada.`); return res.status(403).json({ success: false, message: 'La cuenta está bloqueada temporalmente.' }); }
      const isMatch = await bcrypt.compare(password, credenciales.contraseña);
      if (isMatch) {
        console.log(`Login exitoso para identificador: ${identifier}`);
        Credenciales.updateOne({ _id: credenciales._id }, { $set: { intentosFallidos: 0, ultimoAcceso: new Date() } }).exec().catch(err => console.error("Error actualizando credenciales post-login:", err));
        const paciente = await Paciente.findById(credenciales.usuario_id);
        // Crear Sesión
        req.session.userId = credenciales.usuario_id; req.session.credentialId = credenciales._id; req.session.username = credenciales.username; req.session.rol = credenciales.rol;
        console.log('Sesión creada/actualizada para userId:', req.session.userId);
        // Fin Crear Sesión
        return res.status(200).json({ success: true, message: 'Login exitoso.', user: { id: credenciales.usuario_id, email: paciente ? paciente.correo : null, username: credenciales.username, name: paciente ? paciente.nombre : null, lastName: paciente ? paciente.apellido : null, rol: credenciales.rol } });
      } else {
        console.log(`Login fallido: Contraseña incorrecta para identificador: ${identifier}`);
        credenciales.intentosFallidos += 1; let accountLocked = false;
        if (credenciales.intentosFallidos >= MAX_LOGIN_ATTEMPTS) { console.log(`Bloqueando cuenta para identificador: ${identifier}`); credenciales.estadoCuenta = 'Bloqueada'; accountLocked = true; }
        await credenciales.save();
        const message = accountLocked ? 'Credenciales inválidas. La cuenta ha sido bloqueada.' : 'Credenciales inválidas.';
        return res.status(401).json({ success: false, message: message });
      }
    } catch (error) {
      console.error('Error durante el login:', error); return res.status(500).json({ success: false, message: 'Error interno del servidor durante el login.' });
    }
  });

  // RUTAS PARA RECUPERACIÓN DE CONTRASEÑA (Usando BD Real)
  app.post('/api/forgot-password/validate-user', async (req, res) => {
     console.log('--- Validate User Request Start (Real DB) ---'); const { identifier } = req.body; if (!identifier) { return res.status(400).json({ success: false, message: 'Se requiere email o username.' }); } const identifierLower = identifier.toLowerCase(); console.log('Validando existencia para identificador:', identifierLower); try { let credenciales = await Credenciales.findOne({ username: identifierLower }); if (!credenciales) { const paciente = await Paciente.findOne({ correo: identifierLower }); if (paciente) { credenciales = await Credenciales.findOne({ usuario_id: paciente._id }); } } if (credenciales) { console.log(`Usuario encontrado para ${identifier}. ID de credenciales: ${credenciales._id}`); return res.status(200).json({ success: true, message: 'Usuario encontrado.', credentialId: credenciales._id }); } else { console.log(`Usuario NO encontrado para identificador: ${identifier}`); return res.status(404).json({ success: false, message: 'Si existe una cuenta asociada con ese identificador, se iniciará el proceso de recuperación.' }); } } catch (error) { console.error('Error en validate-user:', error); return res.status(500).json({ success: false, message: 'Error interno del servidor.' }); }
  });
  app.get('/api/forgot-password/get-question/:identifier', async (req, res) => {
     console.log('--- Get Secret Question Request Start (Real DB) ---'); const { identifier } = req.params; if (!identifier) { return res.status(400).json({ success: false, message: 'Identificador no proporcionado en la URL.' }); } const identifierLower = identifier.toLowerCase(); console.log('Obteniendo pregunta para el identificador:', identifierLower); try { let credenciales = await Credenciales.findOne({ username: identifierLower }); if (!credenciales) { const paciente = await Paciente.findOne({ correo: identifierLower }); if (paciente) { credenciales = await Credenciales.findOne({ usuario_id: paciente._id }); } } if (credenciales && credenciales.preguntaSeguridad) { console.log(`Pregunta encontrada para ${identifier}: ${credenciales.preguntaSeguridad}`); return res.status(200).json({ success: true, question: credenciales.preguntaSeguridad }); } else { console.log(`Usuario o pregunta no encontrados para identificador: ${identifier}`); return res.status(404).json({ success: false, message: 'No se pudo obtener la pregunta de seguridad para el identificador proporcionado.' }); } } catch (error) { console.error('Error en get-question:', error); return res.status(500).json({ success: false, message: 'Error interno del servidor.' }); }
  });
  app.post('/api/forgot-password/validate-answer', async (req, res) => {
      console.log('--- Validate Answer Request Start (Real DB) ---'); const { identifier, answer } = req.body; if (!identifier || !answer) { return res.status(400).json({ success: false, message: 'Se requiere identificador y respuesta.' }); } const identifierLower = identifier.toLowerCase(); console.log(`Validando respuesta para ${identifierLower}`); try { let credenciales = await Credenciales.findOne({ username: identifierLower }); if (!credenciales) { const paciente = await Paciente.findOne({ correo: identifierLower }); if (paciente) { credenciales = await Credenciales.findOne({ usuario_id: paciente._id }); } } if (!credenciales || !credenciales.respuestaSeguridad) { console.log(`Usuario o respuesta de seguridad no encontrados para ${identifier}`); return res.status(401).json({ success: false, message: 'Respuesta secreta incorrecta.' }); } const isMatch = await bcrypt.compare(answer, credenciales.respuestaSeguridad); if (isMatch) { console.log(`Respuesta secreta correcta para ${identifier}`); return res.status(200).json({ success: true, message: 'Respuesta correcta.', credentialId: credenciales._id }); } else { console.log(`Respuesta secreta incorrecta para ${identifier}`); return res.status(401).json({ success: false, message: 'Respuesta secreta incorrecta.' }); } } catch (error) { console.error('Error en validate-answer:', error); return res.status(500).json({ success: false, message: 'Error interno del servidor.' }); }
  });
  app.post('/api/forgot-password/reset-password', async (req, res) => {
    console.log('--- Reset Password Request Start (Real DB) ---'); const { credentialId, newPassword } = req.body; if (!credentialId || !newPassword) { return res.status(400).json({ success: false, message: 'Se requiere ID de credenciales y nueva contraseña.' }); } if (newPassword.length < 6) { return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' }); } console.log(`Intentando resetear contraseña para credentialId: ${credentialId}`); try { const credenciales = await Credenciales.findById(credentialId); if (!credenciales) { console.log(`Error: No se encontraron credenciales con ID ${credentialId}`); return res.status(400).json({ success: false, message: 'Solicitud inválida o el proceso ha expirado.' }); } const saltRounds = 10; const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds); credenciales.contraseña = hashedNewPassword; credenciales.intentosFallidos = 0; credenciales.estadoCuenta = 'Activa'; await credenciales.save(); console.log(`Contraseña actualizada y cuenta reactivada para credentialId: ${credentialId}`); return res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente.' }); } catch (error) { console.error('Error en reset-password:', error); if (error.kind === 'ObjectId') { return res.status(400).json({ success: false, message: 'ID de credenciales inválido.' }); } return res.status(500).json({ success: false, message: 'Error interno del servidor.' }); }
  });

  // --- RUTAS PROTEGIDAS (Requieren Autenticación) ---

  // Ejemplo: Obtener perfil del usuario logueado
  app.get('/api/profile/me', isAuthenticated, async (req, res) => {
      console.log(`Obteniendo perfil para userId: ${req.user.id}`);
      try {
          const paciente = await Paciente.findById(req.user.id).select('-__v');
          const credenciales = await Credenciales.findById(req.user.credentialId).select('username rol estadoCuenta ultimoAcceso');
          if (!paciente || !credenciales) { return res.status(404).json({ success: false, message: 'Usuario no encontrado.' }); }
          res.status(200).json({
              success: true,
              user: {
                  id: paciente._id, name: paciente.nombre, lastName: paciente.apellido, email: paciente.correo,
                  birthDate: paciente.fechaNacimiento, phone: paciente.telefono, username: credenciales.username, rol: credenciales.rol,
                  accountStatus: credenciales.estadoCuenta, lastLogin: credenciales.ultimoAcceso, createdAt: paciente.createdAt, updatedAt: paciente.updatedAt
              }
          });
      } catch(error) {
          console.error('Error obteniendo perfil:', error); res.status(500).json({ success: false, message: 'Error interno del servidor.' });
      }
  });

  // HU 1.2: Actualizar datos del Paciente logueado
  app.put('/api/profile/me', isAuthenticated, async (req, res) => {
    console.log('--- Update Profile Request Start ---');
    const userId = req.user.id; // ID del Paciente viene de la sesión
    const { name, lastName, telefono, fechaNacimiento } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.nombre = name;
    if (lastName !== undefined) updateData.apellido = lastName;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (fechaNacimiento !== undefined) updateData.fechaNacimiento = fechaNacimiento;
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ success: false, message: 'No se proporcionaron datos para actualizar.' }); }
    console.log(`Actualizando perfil para userId: ${userId} con datos:`, updateData);
    try {
      const updatedPaciente = await Paciente.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true }).select('-__v');
      if (!updatedPaciente) { return res.status(404).json({ success: false, message: 'Paciente no encontrado.' }); }
      console.log('Perfil actualizado exitosamente para userId:', userId);
      res.status(200).json({
        success: true, message: 'Perfil actualizado exitosamente.',
        user: { id: updatedPaciente._id, name: updatedPaciente.nombre, lastName: updatedPaciente.apellido, email: updatedPaciente.correo, birthDate: updatedPaciente.fechaNacimiento, phone: updatedPaciente.telefono }
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      if (error.name === 'ValidationError') { return res.status(400).json({ success: false, message: 'Error de validación al actualizar.', errors: error.errors }); }
      if (error.kind === 'ObjectId') { return res.status(400).json({ success: false, message: 'ID de usuario inválido.' }); }
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  });

  // HU 1.3: Eliminar cuenta del usuario logueado
  app.delete('/api/profile/me', isAuthenticated, async (req, res) => {
    console.log('--- Delete Account Request Start ---');
    const userId = req.user.id; // ID del Paciente
    const credentialId = req.user.credentialId; // ID de Credenciales
    console.log(`Intentando eliminar cuenta para userId: ${userId}, credentialId: ${credentialId}`);
    try {
      const deletedPaciente = await Paciente.findByIdAndDelete(userId);
      if (deletedPaciente) console.log(`Paciente eliminado con ID: ${userId}`); else console.log(`No se encontró paciente para eliminar con ID: ${userId}`);
      const deletedCredenciales = await Credenciales.findByIdAndDelete(credentialId);
      if (deletedCredenciales) console.log(`Credenciales eliminadas con ID: ${credentialId}`); else console.log(`No se encontraron credenciales para eliminar con ID: ${credentialId}`);

      req.session.destroy((err) => { // Destruir sesión
        if (err) {
          console.error('Error al destruir la sesión después de eliminar cuenta:', err);
          return res.status(200).json({ success: true, message: 'Cuenta eliminada, pero hubo un error al cerrar la sesión.' });
        } else {
          res.clearCookie('connect.sid'); // Limpiar cookie
          console.log(`Sesión destruida para usuario eliminado: ${req.user.username}`);
          return res.status(200).json({ success: true, message: 'Cuenta eliminada exitosamente y sesión cerrada.' });
        }
      });
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      if (error.kind === 'ObjectId') { return res.status(400).json({ success: false, message: 'ID de usuario inválido en la sesión.' }); }
      res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar la cuenta.' });
    }
  });

  // --- FIN RUTAS PROTEGIDAS ---

  // Iniciar el Servidor
  app.listen(PORT, () => {
    console.log(`Servidor MediSync corriendo en http://localhost:${PORT}`);
  });
};

// Ejecutamos la función principal para iniciar todo
startServer();