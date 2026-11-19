
const mongoose = require('mongoose');

const productoPedidoSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },

    nombre: {
      type: String,
      required: true
    },

    presentacion: {
      type: String,
      required: true,
      enum: ['1 bola', '2 bolas', 'Medio litro', '1 litro']
    },

    cantidad: {
      type: Number,
      required: true,
      min: 1
    },

    precio: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const pedidoSchema = new mongoose.Schema(
  {
    cliente: {
      nombre: {
        type: String,
        required: true,
        trim: true
      },

      telefono: {
        type: String,
        required: true,
        trim: true
      },

      correo: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
      }
    },

    tipoEntrega: {
      type: String,
      required: true,
      enum: ['domicilio', 'recoger']
    },

    direccion: {
      type: String,
      trim: true,
      default: ''
    },

    observaciones: {
      type: String,
      trim: true,
      default: ''
    },

    productos: {
      type: [productoPedidoSchema],
      required: true,
      validate: {
        validator: (productos) => productos.length > 0,
        message: 'El pedido debe contener al menos un producto'
      }
    },

    total: {
      type: Number,
      required: true,
      min: 0
    },

    estado: {
      type: String,
      enum: [
        'pendiente',
        'confirmado',
        'preparando',
        'en camino',
        'entregado',
        'cancelado'
      ],
      default: 'pendiente'
    }
  },
  {
    timestamps: true,
    collection: 'pedidos'
  }
);

module.exports = mongoose.model('Pedido', pedidoSchema);
