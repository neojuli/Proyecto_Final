
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },

    contrasena: {
      type: String,
      required: true,
      select: false
    },

    rol: {
      type: String,
      enum: ['administrador', 'cliente'],
      default: 'cliente'
    },

    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'usuarios'
  }
);

// Cifrar la contraseña antes de guardar el usuario
usuarioSchema.pre('save', async function () {
  if (!this.isModified('contrasena')) {
    return;
  }

  this.contrasena = await bcrypt.hash(
    this.contrasena,
    12
  );
});

// Comparar una contraseña con su hash
usuarioSchema.methods.verificarContrasena = async function (
  contrasenaIngresada
) {
  return bcrypt.compare(
    contrasenaIngresada,
    this.contrasena
  );
};

const Usuario = mongoose.model(
  'Usuario',
  usuarioSchema
);

module.exports = Usuario;
