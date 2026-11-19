
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

// Comprueba que el usuario tenga una sesión válida.
async function verificarSesion(req, res, next) {
  try {
    const token = req.cookies?.gota_sesion;

    if (!token) {
      return res.status(401).json({
        mensaje: 'Debes iniciar sesión para continuar'
      });
    }

    const datos = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    if (!mongoose.isValidObjectId(datos.id)) {
      return res.status(401).json({
        mensaje: 'La sesión no es válida'
      });
    }

    const usuario = await Usuario.findById(datos.id);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        mensaje: 'La sesión no es válida'
      });
    }

    // Los permisos se consultan en MongoDB,
    // no se aceptan desde el navegador.
    req.usuario = {
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    };

    next();

  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        mensaje: 'La sesión no es válida o ha expirado'
      });
    }

    console.error('Error al verificar sesión:', error);

    return res.status(500).json({
      mensaje: 'Error interno al verificar la sesión'
    });
  }
}

// Comprueba que el usuario sea administrador.
function soloAdministrador(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({
      mensaje: 'Debes iniciar sesión para continuar'
    });
  }

  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      mensaje: 'No tienes permisos para realizar esta acción'
    });
  }

  next();
}

module.exports = {
  verificarSesion,
  soloAdministrador
};
