
const express = require('express');
const mongoose = require('mongoose');
const Producto = require('../models/Producto');

const {
  verificarSesion,
  soloAdministrador
} = require('../Middlewares/authMiddleware');

const {
  verificarOrigen
} = require('../Middlewares/csrfMiddleware');

const router = express.Router();

const PRESENTACIONES = [
  '1 bola',
  '2 bolas',
  'Medio litro',
  '1 litro'
];

// Catálogo público
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find({
      disponible: true
    });

    return res.json(productos);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al consultar productos'
    });
  }
});

// Todos los productos para administradores
router.get(
  '/admin/todos',
  verificarSesion,
  soloAdministrador,
  async (req, res) => {
    try {
      const productos = await Producto.find()
        .sort({ nombre: 1 });

      return res.json({
        mensaje: 'Productos obtenidos correctamente',
        total: productos.length,
        productos
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensaje: 'Error al consultar productos'
      });
    }
  }
);

// Editar productos
router.patch(
  '/admin/:id',
  verificarOrigen,
  verificarSesion,
  soloAdministrador,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          mensaje: 'ID de producto inválido'
        });
      }

      const {
        nombre,
        descripcion,
        precios,
        disponible
      } = req.body;

      if (
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        typeof descripcion !== 'string' ||
        !descripcion.trim() ||
        typeof disponible !== 'boolean' ||
        !precios ||
        typeof precios !== 'object' ||
        Array.isArray(precios)
      ) {
        return res.status(400).json({
          mensaje: 'Datos del producto inválidos'
        });
      }

      const preciosValidados = {};

      for (const presentacion of PRESENTACIONES) {
        const precio = precios[presentacion];

        if (
          typeof precio !== 'number' ||
          !Number.isFinite(precio) ||
          precio <= 0
        ) {
          return res.status(400).json({
            mensaje: `Precio inválido: ${presentacion}`
          });
        }

        preciosValidados[presentacion] = precio;
      }

      const producto = await Producto.findByIdAndUpdate(
        id,
        {
          $set: {
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            precios: preciosValidados,
            disponible
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!producto) {
        return res.status(404).json({
          mensaje: 'Producto no encontrado'
        });
      }

      return res.json({
        mensaje: 'Producto actualizado correctamente',
        producto
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        mensaje: 'Error al actualizar producto'
      });
    }
  }
);

// Producto individual público
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        mensaje: 'ID de producto inválido'
      });
    }

    const producto = await Producto.findById(id);

    if (!producto || !producto.disponible) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      });
    }

    return res.json(producto);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: 'Error al consultar producto'
    });
  }
});

module.exports = router;
