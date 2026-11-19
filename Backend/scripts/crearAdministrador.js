
const mongoose = require('mongoose');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Usuario = require('../models/Usuario');

async function crearAdministrador() {
  const consola = readline.createInterface({
    input: stdin,
    output: stdout
  });

  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB conectado correctamente');

    const nombre = (
      await consola.question('Nombre del administrador: ')
    ).trim();

    const correo = (
      await consola.question('Correo del administrador: ')
    ).trim().toLowerCase();

    const contrasena = await consola.question(
      'Contraseña del administrador (mínimo 12 caracteres): '
    );

    if (!nombre || nombre.length > 100) {
      throw new Error('Ingresa un nombre válido');
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
      correo.length > 254
    ) {
      throw new Error('Ingresa un correo válido');
    }

    if (
      contrasena.length < 12 ||
      Buffer.byteLength(contrasena, 'utf8') > 72
    ) {
      throw new Error(
        'La contraseña debe tener al menos 12 caracteres y no superar 72 bytes'
      );
    }

    const existente = await Usuario.findOne({ correo });

    if (existente) {
      throw new Error(
        'Ya existe una cuenta con ese correo. Utiliza otro correo para el administrador.'
      );
    }

    // Crear mediante el modelo para aplicar el hash bcrypt.
    const administrador = await Usuario.create({
      nombre,
      correo,
      contrasena,
      rol: 'administrador',
      activo: true
    });

    console.log('\nAdministrador creado correctamente');
    console.log('ID:', administrador._id.toString());
    console.log('Nombre:', administrador.nombre);
    console.log('Correo:', administrador.correo);
    console.log('Rol:', administrador.rol);

  } catch (error) {
    console.error('\nError:', error.message);
    process.exitCode = 1;

  } finally {
    consola.close();
    await mongoose.disconnect();
  }
}

crearAdministrador();
