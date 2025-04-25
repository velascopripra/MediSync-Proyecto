import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio.'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es obligatorio.'],
    trim: true
  },
  fechaNacimiento: {
    type: Date
    // required: [true, 'La fecha de nacimiento es obligatoria.'] // <-- Comentado o eliminado
  },
  telefono: {
    type: Number, // O String si prefieres
    // required: [true, 'El teléfono es obligatorio.'] // <-- Comentado o eliminado
  },
  correo: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Por favor ingresa un correo electrónico válido.']
  }
}, {
  timestamps: true
});

pacienteSchema.index({ correo: 1 });

const Paciente = mongoose.model('Paciente', pacienteSchema);

export default Paciente;