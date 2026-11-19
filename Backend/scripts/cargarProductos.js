
const mongoose = require('mongoose');
require('dotenv').config();

const Producto = require('../models/Producto');

const precios = {
  '1 bola': 3000,
  '2 bolas': 5000,
  'Medio litro': 11000,
  '1 litro': 20000
};

const productos = [
  {
    nombre: 'Chocolate',
    descripcion:
      'Intenso y cremoso sabor a chocolate elaborado con cacao de alta calidad.',
    imagen: '/imagenes/chocolate.jpeg',
    precios,
    disponible: true
  },
  {
    nombre: 'Fresa',
    descripcion:
      'Delicioso helado de fresa con un sabor dulce y refrescante.',
    imagen: '/imagenes/fresa.jpeg',
    precios,
    disponible: true
  },
  {
    nombre: 'Vainilla',
    descripcion:
      'Suave y cremoso helado de vainilla con un sabor tradicional.',
    imagen: '/imagenes/vainilla.jpeg',
    precios,
    disponible: true
  },
  {
    nombre: 'Mora',
    descripcion:
      'Helado de mora con un delicioso equilibrio entre dulzura y frescura.',
    imagen: '/imagenes/mora.jpeg',
    precios,
    disponible: true
  },
  {
    nombre: 'Banano',
    descripcion:
      'Cremoso helado de banano con un agradable sabor frutal.',
    imagen: '/imagenes/banano.jpeg',
    precios,
    disponible: true
  }
];

async function cargarProductos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB conectado correctamente');

    for (const datos of productos) {
      await Producto.updateOne(
        { nombre: datos.nombre },
        { $set: datos },
        { upsert: true, runValidators: true }
      );
    }

    console.log('Los 5 productos se registraron correctamente');
  } catch (error) {
    console.error('Error al registrar productos:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

cargarProductos();
