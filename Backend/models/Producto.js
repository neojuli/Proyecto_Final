
const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },

    descripcion: {
      type: String,
      required: true,
      trim: true
    },

    imagen: {
      type: String,
      required: true
    },

    precios: {
      '1 bola': {
        type: Number,
        required: true,
        min: 0
      },

      '2 bolas': {
        type: Number,
        required: true,
        min: 0
      },

      'Medio litro': {
        type: Number,
        required: true,
        min: 0
      },

      '1 litro': {
        type: Number,
        required: true,
        min: 0
      }
    },

    disponible: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'productos'
  }
);

const Producto = mongoose.model('Producto', productoSchema);

module.exports = Producto;
