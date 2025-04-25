import mongoose from 'mongoose';

const credencialesSchema = new mongoose.Schema({
  // _id es generado automáticamente
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio.'],
    unique: true,
    trim: true,
    lowercase: true
  },
  contraseña: { // Usamos 'contraseña' como en tu schema de BD
    type: String,
    required: [true, 'La contraseña es obligatoria.'] // Almacenará HASH
  },
  rol: {
    type: String,
    required: [true, 'El rol es obligatorio.'],
    enum: ['Medico', 'Paciente', 'Administrador'], // Coincide con tu enum
    default: 'Paciente' // Ajusta si el default debe ser otro
  },
  ultimoAcceso: {
    type: Date,
    default: null // O Date.now si quieres registrar el momento de creación
  },
  intentosFallidos: {
    type: Number, // Coincide con tu bsonType
    default: 0
  },
  estadoCuenta: {
    type: String,
    enum: ['Activa', 'Bloqueada'], // Coincide con tu enum (cambié 'inactivo' por 'Bloqueada' basado en tu schema)
    default: 'Activa'
  },
  preguntaSeguridad: { // Campo añadido
    type: String,
    required: [true, 'La pregunta de seguridad es obligatoria.']
  },
  respuestaSeguridad: { // Campo añadido
    type: String,
    required: [true, 'La respuesta de seguridad es obligatoria.'] // Almacenará HASH
  },
  usuario_id: { // Relación con Paciente (o Medico/Admin)
    type: mongoose.Schema.Types.ObjectId, // Tipo especial para IDs de MongoDB
    required: true,
    refPath: 'rol' // Indica que la referencia depende del campo 'rol'
                   // Mongoose buscará en la colección 'Paciente', 'Medico' o 'Administrador'
  }
}, {
  timestamps: true // Añade createdAt y updatedAt
});

// Índice para buscar credenciales por el ID del usuario asociado
credencialesSchema.index({ usuario_id: 1 });

const Credenciales = mongoose.model('Credenciales', credencialesSchema);

export default Credenciales;