const mongoose = require('mongoose');

const mensajeContactoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  correo: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
  asunto: { type: String, required: true, trim: true, maxlength: 120 },
  mensaje: { type: String, required: true, trim: true, maxlength: 2000 }
}, { timestamps: true });

module.exports = mongoose.model('MensajeContacto', mensajeContactoSchema);
