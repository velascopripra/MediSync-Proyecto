import dotenv from 'dotenv';
// Carga las variables de entorno desde .env al inicio
dotenv.config({ path: './.env' });
console.log('>>> SESSION_SECRET al inicio:', process.env.SESSION_SECRET); // Verifica que se cargue

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt'; // Para hashear contraseñas y respuestas
import mongoose from 'mongoose'; // Para interactuar con MongoDB
import session from 'express-session'; // Para manejar sesiones de usuario
import Paciente from './Models/paciente.js'; // Modelo Paciente actualizado v3
import Credenciales from './Models/credenciales.js'; // Modelo Credenciales

// --- Conexión a Base de Datos ---
const connectDB = async () => {
  try {
    // Verifica que la URI de MongoDB esté definida en las variables de entorno
    if (!process.env.MONGO_URI) {
        console.error("Error: MONGO_URI no está definida en el archivo .env.");
        process.exit(1); // Termina la aplicación si no hay URI
    }
    // Intenta conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado exitosamente.');
  } catch (error) {
    // Muestra error si la conexión falla y termina la aplicación
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

// --- Función Principal Asíncrona para Iniciar el Servidor ---
const startServer = async () => {
  // 1. Conectar a la base de datos ANTES de iniciar el servidor Express
  await connectDB();

  // 2. Crear la aplicación Express
  const app = express();
  const PORT = process.env.PORT || 3001; // Usa el puerto de .env o 3001 por defecto

  // 3. Middlewares Principales
  app.use(cors({ // Habilita CORS para permitir peticiones desde el frontend
      origin: 'http://localhost:5173', // Asegúrate que esta sea la URL de tu frontend
      credentials: true // Permite el envío de cookies de sesión
  }));
  app.use(express.json()); // Permite al servidor entender bodies de request en formato JSON

  // 4. Configuración de express-session
  // Verifica que SESSION_SECRET esté disponible antes de configurar la sesión
  if (!process.env.SESSION_SECRET) {
      console.error("Error: SESSION_SECRET no está definida en el archivo .env. La sesión no funcionará correctamente.");
      process.exit(1);
  }
  app.use(session({
    secret: process.env.SESSION_SECRET, // Clave secreta para firmar la cookie de sesión
    resave: false, // No guardar la sesión si no se modificó
    saveUninitialized: false, // No guardar sesiones nuevas vacías
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true en producción (HTTPS), 'auto' o false en desarrollo (HTTP)
      httpOnly: true, // La cookie no es accesible por JavaScript del lado del cliente
      maxAge: 1000 * 60 * 60 * 24, // Duración de la cookie (ej: 1 día en ms)
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax' // O 'none' si necesitas cross-site con secure:true
    }
  }));

  // --- Middleware de Autenticación ---
  // Verifica si el usuario tiene una sesión activa
  const isAuthenticated = (req, res, next) => {
    // Si existe la sesión y contiene userId, el usuario está autenticado
    if (req.session && req.session.userId) {
      // Adjunta información del usuario al objeto 'req' para fácil acceso en rutas protegidas
      req.user = {
        id: req.session.userId, // ID del Paciente (o Medico/Admin)
        username: req.session.username,
        rol: req.session.rol,
        credentialId: req.session.credentialId // ID del documento Credenciales
      };
      console.log(`Middleware: Usuario autenticado ${req.user.username} (ID: ${req.user.id}, CredID: ${req.user.credentialId})`);
      return next(); // Pasa al siguiente middleware o a la ruta
    } else {
      // Si no hay sesión o userId, devuelve error 401 (No autorizado)
      console.log('Middleware: Acceso denegado - No autenticado.');
      // Importante: Asegurarse que el frontend maneje este 401 (ej. redirigiendo a login)
      return res.status(401).json({ success: false, message: 'Acceso no autorizado. Por favor, inicia sesión.' });
    }
  };

  // --- Rutas (Endpoints) ---

  // Ruta de prueba básica
  app.get('/', (req, res) => {
    res.send('¡Hola desde el backend MediSync v3!');
  });

  // --- RUTAS PÚBLICAS (Autenticación / Recuperación) ---

  // RUTA PARA REGISTRO (Ajustada - Sin campos adicionales de HU 1.1)
  app.post('/api/register', async (req, res) => {
    console.log('--- Request /api/register ---');
    // Campos esenciales para crear la cuenta y las credenciales
    const { nombre, username, correo, password, preguntaSeguridad, respuestaSeguridad } = req.body;

    // Validación básica de campos requeridos
    if (!nombre || !username || !correo || !password || !preguntaSeguridad || !respuestaSeguridad) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos: nombre, username, correo, password, pregunta y respuesta de seguridad.' });
    }

    try {
      // Verifica si el correo o el username ya existen (case-insensitive)
      const correoLower = correo.toLowerCase();
      const usernameLower = username.toLowerCase();
      const existingPaciente = await Paciente.findOne({ correo: correoLower });
      const existingCredenciales = await Credenciales.findOne({ username: usernameLower });

      if (existingPaciente) {
        return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado.' }); // 409 Conflict
      }
      if (existingCredenciales) {
        return res.status(409).json({ success: false, message: 'El nombre de usuario ya está registrado.' }); // 409 Conflict
      }

      // 1. Crea el nuevo Paciente solo con nombre y correo
      const newPaciente = new Paciente({
          nombre: nombre,
          correo: correoLower,
          // apellido, fechaNacimiento, telefono, direccion se dejan como null/default
      });
      const savedPaciente = await newPaciente.save(); // Guarda el paciente en la BD
      console.log('Paciente guardado (datos básicos):', savedPaciente._id);

      // 2. Crea las Credenciales asociadas al Paciente
      try {
        const saltRounds = 10; // Factor de coste para bcrypt
        // Hashea la contraseña y la respuesta de seguridad
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const hashedSecretAnswer = await bcrypt.hash(respuestaSeguridad, saltRounds);

        const newCredenciales = new Credenciales({
          username: usernameLower,
          contraseña: hashedPassword, // Guarda la contraseña hasheada
          rol: 'Paciente', // Rol por defecto para nuevos registros
          preguntaSeguridad: preguntaSeguridad,
          respuestaSeguridad: hashedSecretAnswer, // Guarda la respuesta hasheada
          usuario_id: savedPaciente._id // Vincula con el _id del Paciente recién creado
          // estadoCuenta ('Activa') y intentosFallidos (0) usarán los defaults del schema
        });
        await newCredenciales.save(); // Guarda las credenciales en la BD
        console.log('Credenciales guardadas para usuario:', savedPaciente._id);

        // Respuesta exitosa
        return res.status(201).json({ // 201 Created
            success: true,
            message: 'Usuario registrado exitosamente.',
            // Devuelve info básica del usuario creado (sin datos sensibles)
            user: {
                id: savedPaciente._id,
                correo: savedPaciente.correo,
                username: newCredenciales.username,
                nombre: savedPaciente.nombre,
                rol: newCredenciales.rol
            }
        });

      } catch (credencialesError) {
        // Si falla guardar credenciales, intenta eliminar el paciente creado (rollback manual)
        console.error('Error al guardar credenciales, intentando rollback de paciente:', credencialesError);
        await Paciente.findByIdAndDelete(savedPaciente._id).catch(delErr => console.error("Error en rollback paciente:", delErr));
        // Lanza el error original para que sea capturado por el catch externo
        throw credencialesError;
      }
    } catch (error) {
      console.error('Error general durante el registro:', error); // Log general

      // Manejo específico para errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        // *** INICIO: Modificación para log detallado ***
        console.error('--- Detalles del Error de Validación ---');
        for (let field in error.errors) {
          console.error(`Campo: ${field}, Error: ${error.errors[field].message}`);
        }
        console.error('--------------------------------------');
        // *** FIN: Modificación para log detallado ***

        // Devuelve el error 400 con un mensaje genérico y los detalles (opcionalmente)
        return res.status(400).json({
             success: false,
             message: 'Error de validación. Por favor, revisa los campos.', // Mensaje más genérico para el frontend
             // errors: error.errors // Puedes decidir si enviar los detalles al frontend o no
            });
      }
      // Error genérico del servidor
      return res.status(500).json({ success: false, message: 'Error interno del servidor durante el registro.' });
    }
  });

  // RUTA PARA LOGIN (HU 1.4 - Sin cambios respecto a v1, ya cumple)
  app.post('/api/login', async (req, res) => {
    console.log('--- Request /api/login ---');
    const { identifier, password } = req.body; // identifier puede ser email o username

    // Validación básica
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identificador (email/username) y contraseña son requeridos.' });
    }

    const MAX_LOGIN_ATTEMPTS = 5; // Límite de intentos fallidos antes de bloquear

    try {
      let credenciales = null;
      const identifierLower = identifier.toLowerCase();

      // Busca credenciales por username o por email (a través del paciente)
      credenciales = await Credenciales.findOne({ username: identifierLower });
      if (!credenciales) {
        const paciente = await Paciente.findOne({ correo: identifierLower });
        if (paciente) {
          credenciales = await Credenciales.findOne({ usuario_id: paciente._id });
        }
      }

      // Si no se encontraron credenciales
      if (!credenciales) {
        console.log(`Login fallido: Identificador '${identifier}' no encontrado.`);
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' }); // 401 Unauthorized
      }

      // Verifica si la cuenta está bloqueada
      if (credenciales.estadoCuenta === 'Bloqueada') {
        console.log(`Login fallido: Cuenta para '${identifier}' está bloqueada.`);
        return res.status(403).json({ success: false, message: 'La cuenta está bloqueada temporalmente debido a múltiples intentos fallidos.' }); // 403 Forbidden
      }

      // Compara la contraseña proporcionada con la hasheada en la BD
      const isMatch = await bcrypt.compare(password, credenciales.contraseña);

      if (isMatch) {
        // Contraseña correcta: Login exitoso
        console.log(`Login exitoso para identificador: ${identifier}`);

        // Resetea intentos fallidos y actualiza último acceso (sin esperar a que termine)
        Credenciales.updateOne({ _id: credenciales._id }, { $set: { intentosFallidos: 0, ultimoAcceso: new Date() } })
                    .exec() // Ejecuta la actualización
                    .catch(err => console.error("Error actualizando credenciales post-login:", err)); // Logea error si falla

        // Busca los datos del Paciente asociado para devolverlos
        const paciente = await Paciente.findById(credenciales.usuario_id);

        // --- Crear/Actualizar Sesión ---
        req.session.userId = credenciales.usuario_id; // ID del Paciente/Usuario
        req.session.credentialId = credenciales._id; // ID del documento Credenciales
        req.session.username = credenciales.username;
        req.session.rol = credenciales.rol;
        console.log('Sesión creada/actualizada para userId:', req.session.userId);
        // --- Fin Crear/Actualizar Sesión ---

        // Respuesta exitosa
        return res.status(200).json({
            success: true,
            message: 'Login exitoso.',
            // Devuelve información útil del usuario para el frontend
            user: {
                id: credenciales.usuario_id,
                // Usa operador ternario por si el paciente no se encuentra (aunque no debería pasar)
                email: paciente ? paciente.correo : null,
                username: credenciales.username,
                nombre: paciente ? paciente.nombre : null,
                apellido: paciente ? paciente.apellido : null, // Añadido apellido
                rol: credenciales.rol
            }
        });
      } else {
        // Contraseña incorrecta
        console.log(`Login fallido: Contraseña incorrecta para identificador: ${identifier}`);
        credenciales.intentosFallidos += 1; // Incrementa contador
        let accountLocked = false;

        // Verifica si se alcanzó el límite de intentos
        if (credenciales.intentosFallidos >= MAX_LOGIN_ATTEMPTS) {
          console.log(`Bloqueando cuenta para identificador: ${identifier}`);
          credenciales.estadoCuenta = 'Bloqueada'; // Cambia estado a Bloqueada
          accountLocked = true;
        }

        await credenciales.save(); // Guarda los cambios (intentos fallidos / estado)

        // Mensaje de error apropiado
        const message = accountLocked
          ? 'Credenciales inválidas. La cuenta ha sido bloqueada por seguridad.'
          : 'Credenciales inválidas.';
        return res.status(401).json({ success: false, message: message }); // 401 Unauthorized
      }
    } catch (error) {
      console.error('Error durante el login:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor durante el login.' });
    }
  });

  // RUTAS PARA RECUPERACIÓN DE CONTRASEÑA (Sin cambios respecto a v1)
  // 1. Validar si existe el usuario (por email o username)
  app.post('/api/forgot-password/validate-user', async (req, res) => {
     console.log('--- Request /api/forgot-password/validate-user ---');
     const { identifier } = req.body;
     if (!identifier) { return res.status(400).json({ success: false, message: 'Se requiere email o username.' }); }
     const identifierLower = identifier.toLowerCase();
     console.log('Validando existencia para identificador:', identifierLower);
     try {
       let credenciales = await Credenciales.findOne({ username: identifierLower });
       if (!credenciales) {
         const paciente = await Paciente.findOne({ correo: identifierLower });
         if (paciente) { credenciales = await Credenciales.findOne({ usuario_id: paciente._id }); }
       }
       if (credenciales) {
         console.log(`Usuario encontrado para ${identifier}. ID de credenciales: ${credenciales._id}`);
         // Solo devolvemos éxito y el ID (no la pregunta aún)
         return res.status(200).json({ success: true, message: 'Usuario encontrado.', credentialId: credenciales._id });
       } else {
         console.log(`Usuario NO encontrado para identificador: ${identifier}`);
         // Por seguridad, no confirmar si existe o no. Simular éxito.
         return res.status(200).json({ success: true, message: 'Si existe una cuenta asociada, se procederá con la recuperación.' });
         // Alternativa: return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
       }
     } catch (error) {
       console.error('Error en validate-user:', error);
       return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
     }
  });

  // 2. Obtener la pregunta de seguridad (usando el ID de credenciales obtenido antes)
  // Cambiado a POST para recibir credentialId en el body por seguridad
  app.post('/api/forgot-password/get-question', async (req, res) => {
     console.log('--- Request /api/forgot-password/get-question ---');
     const { credentialId } = req.body; // Recibe ID desde el body
     if (!credentialId) { return res.status(400).json({ success: false, message: 'ID de credenciales no proporcionado.' }); }
     console.log('Obteniendo pregunta para credentialId:', credentialId);
     try {
        // Validar que el ID sea un ObjectId válido de MongoDB
        if (!mongoose.Types.ObjectId.isValid(credentialId)) {
            return res.status(400).json({ success: false, message: 'ID de credenciales inválido.' });
        }
       const credenciales = await Credenciales.findById(credentialId);
       if (credenciales && credenciales.preguntaSeguridad) {
         console.log(`Pregunta encontrada para ${credentialId}: ${credenciales.preguntaSeguridad}`);
         return res.status(200).json({ success: true, question: credenciales.preguntaSeguridad });
       } else {
         console.log(`Credenciales o pregunta no encontradas para ID: ${credentialId}`);
         return res.status(404).json({ success: false, message: 'No se pudo obtener la pregunta de seguridad.' }); // 404 Not Found
       }
     } catch (error) {
       console.error('Error en get-question:', error);
       return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
     }
  });

  // 3. Validar la respuesta de seguridad
  app.post('/api/forgot-password/validate-answer', async (req, res) => {
      console.log('--- Request /api/forgot-password/validate-answer ---');
      const { credentialId, answer } = req.body;
      if (!credentialId || !answer) { return res.status(400).json({ success: false, message: 'Se requiere ID de credenciales y respuesta.' }); }
      console.log(`Validando respuesta para credentialId: ${credentialId}`);
      try {
        if (!mongoose.Types.ObjectId.isValid(credentialId)) {
            return res.status(400).json({ success: false, message: 'ID de credenciales inválido.' });
        }
        const credenciales = await Credenciales.findById(credentialId);
        // Verifica que existan credenciales y la respuesta hasheada
        if (!credenciales || !credenciales.respuestaSeguridad) {
          console.log(`Credenciales o respuesta de seguridad no encontradas para ID: ${credentialId}`);
          return res.status(401).json({ success: false, message: 'Respuesta secreta incorrecta.' }); // 401 Unauthorized
        }
        // Compara la respuesta dada con la hasheada
        const isMatch = await bcrypt.compare(answer, credenciales.respuestaSeguridad);
        if (isMatch) {
          console.log(`Respuesta secreta correcta para ${credentialId}`);
          // Respuesta correcta, permite proceder al reseteo
          // Podríamos generar un token temporal aquí para mayor seguridad en el siguiente paso
          return res.status(200).json({ success: true, message: 'Respuesta correcta.' });
        } else {
          console.log(`Respuesta secreta incorrecta para ${credentialId}`);
          return res.status(401).json({ success: false, message: 'Respuesta secreta incorrecta.' }); // 401 Unauthorized
        }
      } catch (error) {
        console.error('Error en validate-answer:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
      }
  });

  // 4. Resetear la contraseña (establecer nueva contraseña)
  app.post('/api/forgot-password/reset-password', async (req, res) => {
    console.log('--- Request /api/forgot-password/reset-password ---');
    // Recibe ID y nueva contraseña (asume que los pasos anteriores fueron exitosos)
    const { credentialId, newPassword } = req.body;
    if (!credentialId || !newPassword) { return res.status(400).json({ success: false, message: 'Se requiere ID de credenciales y nueva contraseña.' }); }
    // Validación básica de longitud de contraseña
    if (newPassword.length < 6) { return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' }); }

    console.log(`Intentando resetear contraseña para credentialId: ${credentialId}`);
    try {
      if (!mongoose.Types.ObjectId.isValid(credentialId)) {
          return res.status(400).json({ success: false, message: 'ID de credenciales inválido.' });
      }
      const credenciales = await Credenciales.findById(credentialId);
      if (!credenciales) {
        console.log(`Error: No se encontraron credenciales con ID ${credentialId}`);
        // Podría ser que el proceso expiró o el ID es incorrecto
        return res.status(400).json({ success: false, message: 'Solicitud inválida o el proceso ha expirado.' });
      }
      // Hashea la nueva contraseña
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      // Actualiza la contraseña, resetea intentos y reactiva la cuenta
      credenciales.contraseña = hashedNewPassword;
      credenciales.intentosFallidos = 0;
      credenciales.estadoCuenta = 'Activa';
      await credenciales.save(); // Guarda los cambios

      console.log(`Contraseña actualizada y cuenta reactivada para credentialId: ${credentialId}`);
      return res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
      console.error('Error en reset-password:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor al resetear la contraseña.' });
    }
  });

  // --- RUTAS PROTEGIDAS (Requieren Autenticación - usan middleware 'isAuthenticated') ---

  // Obtener perfil del usuario logueado
  app.get('/api/profile/me', isAuthenticated, async (req, res) => {
      console.log(`--- Request GET /api/profile/me (User: ${req.user.username}) ---`);
      try {
          // Obtiene IDs desde la sesión (adjuntados por isAuthenticated)
          const pacienteId = req.user.id;
          const credentialId = req.user.credentialId;

          // Busca datos del Paciente y Credenciales por separado
          // Selecciona los campos específicos a devolver (excluye __v, contraseña, respuestaSeguridad)
          const paciente = await Paciente.findById(pacienteId).select('-__v');
          const credenciales = await Credenciales.findById(credentialId).select('username rol estadoCuenta ultimoAcceso');

          // Si no se encuentra alguno (raro, pero posible si hay inconsistencia)
          if (!paciente || !credenciales) {
              console.error(`Error: No se encontró Paciente (${pacienteId}) o Credenciales (${credentialId}) para usuario logueado.`);
              // Podríamos destruir la sesión aquí si hay inconsistencia grave
              return res.status(404).json({ success: false, message: 'No se pudo encontrar la información completa del usuario.' });
          }

          // Combina la información relevante de ambos documentos
          res.status(200).json({
              success: true,
              user: {
                  id: paciente._id, // ID del Paciente
                  nombre: paciente.nombre,
                  apellido: paciente.apellido,
                  fechaNacimiento: paciente.fechaNacimiento,
                  telefono: paciente.telefono,
                  correo: paciente.correo,
                  direccion: paciente.direccion,
                  username: credenciales.username,
                  rol: credenciales.rol,
                  estadoCuenta: credenciales.estadoCuenta,
                  ultimoAcceso: credenciales.ultimoAcceso,
                  createdAt: paciente.createdAt, // Fecha de creación del paciente
                  updatedAt: paciente.updatedAt // Última actualización del paciente
              }
          });
      } catch(error) {
          console.error('Error obteniendo perfil:', error);
          // Manejo específico si el ID es inválido
          if (error.kind === 'ObjectId') {
              return res.status(400).json({ success: false, message: 'ID de usuario inválido en la sesión.' });
          }
          res.status(500).json({ success: false, message: 'Error interno del servidor al obtener el perfil.' });
      }
  });

  // HU 1.2: Actualizar datos del Paciente logueado (Ajustado)
  app.put('/api/profile/me', isAuthenticated, async (req, res) => {
    console.log(`--- Request PUT /api/profile/me (User: ${req.user.username}) ---`);
    const pacienteId = req.user.id; // ID del Paciente viene de la sesión
    // Campos permitidos para actualizar según HU 1.2 (modificada)
    const { nombre, apellido, fechaNacimiento, telefono, direccion } = req.body;

    // Construye objeto solo con los campos que SÍ vienen en el request
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (apellido !== undefined) updateData.apellido = apellido;
    if (fechaNacimiento !== undefined) updateData.fechaNacimiento = fechaNacimiento;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (direccion !== undefined) updateData.direccion = direccion;
    // NOTA: No permitimos actualizar 'correo' aquí para evitar complejidad

    // Verifica si se envió algún dato para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron datos válidos para actualizar.' });
    }

    console.log(`Actualizando perfil para pacienteId: ${pacienteId} con datos:`, updateData);

    try {
      // Busca y actualiza el Paciente por ID
      // { new: true } devuelve el documento actualizado
      // { runValidators: true } aplica las validaciones del schema Mongoose
      const updatedPaciente = await Paciente.findByIdAndUpdate(
          pacienteId,
          { $set: updateData }, // Usa $set para actualizar solo los campos proporcionados
          { new: true, runValidators: true }
      ).select('-__v'); // Excluye el campo __v

      // Si no se encontró el paciente (raro si está logueado)
      if (!updatedPaciente) {
        return res.status(404).json({ success: false, message: 'Paciente no encontrado.' });
      }

      console.log('Perfil actualizado exitosamente para pacienteId:', pacienteId);
      // Devuelve el paciente actualizado (sin datos sensibles como credenciales)
      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente.',
        user: { // Devuelve solo los datos actualizados del paciente
            id: updatedPaciente._id,
            nombre: updatedPaciente.nombre,
            apellido: updatedPaciente.apellido,
            fechaNacimiento: updatedPaciente.fechaNacimiento,
            telefono: updatedPaciente.telefono,
            correo: updatedPaciente.correo, // El correo no cambió
            direccion: updatedPaciente.direccion,
            updatedAt: updatedPaciente.updatedAt // Fecha de actualización
        }
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      // Error de validación de Mongoose (ej: formato de fecha incorrecto)
      if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: 'Error de validación al actualizar.', errors: error.errors });
      }
      // Error si el ID es inválido
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido.' });
      }
      // Otro error interno
      res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el perfil.' });
    }
  });

  // HU 1.3: Eliminar cuenta del usuario logueado (Sin cambios respecto a v1)
  app.delete('/api/profile/me', isAuthenticated, async (req, res) => {
    console.log(`--- Request DELETE /api/profile/me (User: ${req.user.username}) ---`);
    const pacienteId = req.user.id; // ID del Paciente
    const credentialId = req.user.credentialId; // ID de Credenciales
    console.log(`Intentando eliminar cuenta para pacienteId: ${pacienteId}, credentialId: ${credentialId}`);

    try {
      // 1. Eliminar el documento Paciente
      const deletedPaciente = await Paciente.findByIdAndDelete(pacienteId);
      if (deletedPaciente) console.log(`Paciente eliminado con ID: ${pacienteId}`);
      else console.log(`WARN: No se encontró paciente para eliminar con ID: ${pacienteId}`);

      // 2. Eliminar el documento Credenciales
      const deletedCredenciales = await Credenciales.findByIdAndDelete(credentialId);
      if (deletedCredenciales) console.log(`Credenciales eliminadas con ID: ${credentialId}`);
      else console.log(`WARN: No se encontraron credenciales para eliminar con ID: ${credentialId}`);

      // 3. Destruir la sesión del usuario
      req.session.destroy((err) => {
        if (err) {
          // Error al destruir sesión, pero la cuenta ya fue eliminada
          console.error('Error al destruir la sesión después de eliminar cuenta:', err);
          // Aún así, respondemos con éxito porque la eliminación de datos funcionó
          return res.status(200).json({ success: true, message: 'Cuenta eliminada, pero hubo un error al cerrar la sesión del servidor.' });
        } else {
          // Sesión destruida correctamente
          res.clearCookie('connect.sid'); // Pide al navegador eliminar la cookie de sesión
          console.log(`Sesión destruida para usuario eliminado: ${req.user.username}`);
          return res.status(200).json({ success: true, message: 'Cuenta eliminada exitosamente y sesión cerrada.' });
        }
      });
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: 'ID de usuario inválido en la sesión.' });
      }
      res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar la cuenta.' });
    }
  });

  // --- RUTA LOGOUT ---
  app.post('/api/logout', isAuthenticated, (req, res) => {
      console.log(`--- Request POST /api/logout (User: ${req.user.username}) ---`);
      req.session.destroy((err) => {
          if (err) {
              console.error('Error al destruir la sesión durante el logout:', err);
              return res.status(500).json({ success: false, message: 'Error al cerrar sesión en el servidor.' });
          }
          res.clearCookie('connect.sid'); // Elimina la cookie del navegador
          console.log(`Sesión cerrada para usuario: ${req.user.username}`);
          return res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente.' });
      });
  });


  // --- FIN RUTAS ---

  // Middleware para manejar rutas no encontradas (404) - Debe ir al final
  app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
  });

  // Middleware para manejar errores generales - Debe ir al final
  app.use((err, req, res, next) => {
    console.error("Error no manejado:", err.stack);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  });


  // 5. Iniciar el Servidor Express
  app.listen(PORT, () => {
    console.log(`Servidor MediSync v3 corriendo en http://localhost:${PORT}`);
    console.log(`Permitiendo CORS para: http://localhost:5173`); // Confirma origen CORS
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`); // Muestra el entorno actual
  });
};

// Ejecutamos la función principal para iniciar todo el proceso
startServer();
