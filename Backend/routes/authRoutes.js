
const express = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const router = express.Router();

const COOKIE_NAME = 'gota_sesion';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/'
};

function crearToken(usuario) {
  return jwt.sign(
    { id: usuario._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

function datosPublicos(usuario) {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol
  };
}

// REGISTRAR CLIENTE
router.post('/registro', async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    if (
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      nombre.trim().length > 100 ||
      typeof correo !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()) ||
      correo.trim().length > 254 ||
      typeof contrasena !== 'string' ||
      contrasena.length < 12 ||
      Buffer.byteLength(contrasena, 'utf8') > 72
    ) {
      return res.status(400).json({
        mensaje:
          'Verifica tu nombre, correo y contraseña. La contraseña debe tener al menos 12 caracteres.'
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const usuarioExistente = await Usuario.findOne({
      correo: correoNormalizado
    });

    if (usuarioExistente) {
      return res.status(409).json({
        mensaje: 'Este correo ya está registrado'
      });
    }

    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      correo: correoNormalizado,
      contrasena,
      rol: 'cliente'
    });

    return res.status(201).json({
      mensaje: 'Cuenta creada correctamente',
      usuario: datosPublicos(usuario)
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: 'Este correo ya está registrado'
      });
    }

    console.error('Error al registrar usuario:', error.message);

    return res.status(500).json({
      mensaje: 'No se pudo registrar el usuario'
    });
  }
});

// INICIAR SESIÓN
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (
      typeof correo !== 'string' ||
      typeof contrasena !== 'string'
    ) {
      return res.status(400).json({
        mensaje: 'Ingresa tu correo y contraseña'
      });
    }

    const usuario = await Usuario.findOne({
      correo: correo.trim().toLowerCase(),
      activo: true
    }).select('+contrasena');

    if (
      !usuario ||
      !(await usuario.verificarContrasena(contrasena))
    ) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const token = crearToken(usuario);

    res.cookie(COOKIE_NAME, token, {
      ...COOKIE_OPTIONS,
      maxAge: 2 * 60 * 60 * 1000
    });

    return res.json({
      mensaje: 'Sesión iniciada correctamente',
      usuario: datosPublicos(usuario)
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);

    return res.status(500).json({
      mensaje: 'No se pudo iniciar sesión'
    });
  }
});

// VERIFICAR SESIÓN
router.get('/sesion', async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        mensaje: 'No hay una sesión activa'
      });
    }

    const datos = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const usuario = await Usuario.findById(datos.id);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        mensaje: 'La sesión no es válida'
      });
    }

    return res.json({
      usuario: datosPublicos(usuario)
    });

  } catch (error) {
    return res.status(401).json({
      mensaje: 'La sesión ha expirado o no es válida'
    });
  }
});

// CERRAR SESIÓN
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);

  return res.json({
    mensaje: 'Sesión cerrada correctamente'
  });
});

module.exports = router;
