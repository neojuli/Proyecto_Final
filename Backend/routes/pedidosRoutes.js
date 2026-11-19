const {
  verificarOrigen
} = require('../Middlewares/csrfMiddleware');

const {
  verificarSesion,
  soloAdministrador
} = require('../Middlewares/authMiddleware');
const express = require('express');
const mongoose = require('mongoose');

const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');

const router = express.Router();

// Registrar un nuevo pedido
router.post('/', async (req, res) => {
  try {
    const {
      cliente,
      tipoEntrega,
      direccion,
      observaciones,
      productos
    } = req.body;

    // Validar los datos del cliente
    if (
      !cliente ||
      typeof cliente.nombre !== 'string' ||
      !cliente.nombre.trim() ||
      typeof cliente.telefono !== 'string' ||
      !cliente.telefono.trim() ||
      typeof cliente.correo !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo.trim())
    ) {
      return res.status(400).json({
        mensaje: 'Los datos del cliente son inválidos'
      });
    }

    // Validar el tipo de entrega
    if (!['domicilio', 'recoger'].includes(tipoEntrega)) {
      return res.status(400).json({
        mensaje: 'Selecciona un tipo de entrega válido'
      });
    }

    // La dirección es obligatoria para domicilios
    if (
      tipoEntrega === 'domicilio' &&
      (typeof direccion !== 'string' || !direccion.trim())
    ) {
      return res.status(400).json({
        mensaje: 'Debes ingresar una dirección de entrega'
      });
    }

    // Validar que existan productos
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        mensaje: 'El pedido debe contener productos'
      });
    }

    const presentacionesValidas = [
      '1 bola',
      '2 bolas',
      'Medio litro',
      '1 litro'
    ];

    const productosPedido = [];
    let total = 0;

    for (const item of productos) {
      if (
        !item ||
        !mongoose.isValidObjectId(item.producto) ||
        !presentacionesValidas.includes(item.presentacion) ||
        !Number.isSafeInteger(item.cantidad) ||
        item.cantidad < 1 ||
        item.cantidad > 100
      ) {
        return res.status(400).json({
          mensaje: 'Hay productos con datos inválidos'
        });
      }

      // Consultar el producto real en MongoDB
      const producto = await Producto.findOne({
        _id: item.producto,
        disponible: true
      });

      if (!producto) {
        return res.status(400).json({
          mensaje: 'Uno de los productos no está disponible'
        });
      }

      // Obtener el precio directamente de MongoDB
      const precio = producto.precios[item.presentacion];

      if (
        typeof precio !== 'number' ||
        !Number.isFinite(precio) ||
        precio < 0
      ) {
        return res.status(400).json({
          mensaje: 'La presentación seleccionada no tiene un precio válido'
        });
      }

      productosPedido.push({
        producto: producto._id,
        nombre: producto.nombre,
        presentacion: item.presentacion,
        cantidad: item.cantidad,
        precio
      });

      total += precio * item.cantidad;
    }

    // Crear el pedido con los precios calculados
    const nuevoPedido = await Pedido.create({
      cliente: {
        nombre: cliente.nombre.trim(),
        telefono: cliente.telefono.trim(),
        correo: cliente.correo.trim().toLowerCase()
      },
      tipoEntrega,
      direccion:
        tipoEntrega === 'domicilio'
          ? direccion.trim()
          : '',
      observaciones:
        typeof observaciones === 'string'
          ? observaciones.trim()
          : '',
      productos: productosPedido,
      total,
      estado: 'pendiente'
    });

    res.status(201).json({
      mensaje: 'Pedido registrado correctamente',
      pedido: {
        id: nuevoPedido._id,
        estado: nuevoPedido.estado,
        total: nuevoPedido.total,
        fecha: nuevoPedido.createdAt
      }
    });

  } catch (error) {
    console.error('Error al registrar pedido:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        mensaje: 'Los datos del pedido no son válidos'
      });
    }

    res.status(500).json({
      mensaje: 'Ocurrió un error al registrar el pedido'
    });
  }
});

// Consultar todos los pedidos.
// Acceso exclusivo para administradores.
router.get(
  '/',
  verificarSesion,
  soloAdministrador,
  async (req, res) => {
    try {
      const pedidos = await Pedido.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return res.status(200).json({
        mensaje: 'Pedidos obtenidos correctamente',
        total: pedidos.length,
        pedidos
      });

    } catch (error) {
      console.error('Error al consultar pedidos:', error);

      return res.status(500).json({
        mensaje: 'No se pudieron consultar los pedidos'
      });
    }
  }
);


// Actualizar el estado de un pedido.
// Acceso exclusivo para administradores.

router.patch(
  '/:id/estado',
  verificarOrigen,
  verificarSesion,
  soloAdministrador,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body || {};

      const estadosPermitidos = [
        'pendiente',
        'confirmado',
        'preparando',
        'en camino',
        'entregado',
        'cancelado'
      ];

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          mensaje: 'El identificador del pedido no es válido'
        });
      }

      if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({
          mensaje: 'El estado seleccionado no es válido'
        });
      }

      const transiciones = {
        pendiente: ['confirmado', 'cancelado'],
        confirmado: ['preparando', 'cancelado'],
        preparando: ['en camino', 'entregado', 'cancelado'],
        'en camino': ['entregado'],
        entregado: [],
        cancelado: []
      };

      const pedidoActual = await Pedido.findById(id);

      if (!pedidoActual) {
        return res.status(404).json({
          mensaje: 'No se encontró el pedido'
        });
      }

      const estadosSiguientes =
        transiciones[pedidoActual.estado] || [];

      if (!estadosSiguientes.includes(estado)) {
        return res.status(409).json({
          mensaje:
            'No se permite cambiar de ' +
            pedidoActual.estado +
            ' a ' +
            estado
        });
      }

      const pedidoActualizado = await Pedido.findOneAndUpdate(
        {
          _id: id,
          estado: pedidoActual.estado
        },
        {
          $set: { estado }
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!pedidoActualizado) {
        return res.status(409).json({
          mensaje:
            'El pedido fue modificado recientemente. Actualiza la información.'
        });
      }

      return res.status(200).json({
        mensaje: 'Estado actualizado correctamente',
        pedido: {
          id: pedidoActualizado._id,
          estado: pedidoActualizado.estado,
          total: pedidoActualizado.total
        }
      });

    } catch (error) {
      console.error('Error al actualizar pedido:', error);

      return res.status(500).json({
        mensaje: 'No se pudo actualizar el estado del pedido'
      });
    }
  }
);

module.exports = router;
