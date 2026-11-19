const express = require('express');
const MensajeContacto = require('../models/MensajeContacto');
const { verificarSesion, soloAdministrador } = require('../middlewares/authMiddleware');
const { verificarOrigen } = require('../middlewares/csrfMiddleware');

const router = express.Router();
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Recibir mensajes de visitantes (sin requerir cuenta).
router.post('/', verificarOrigen, async (req, res) => {
  try {
    const { nombre, correo, asunto, mensaje } = req.body || {};
    const campos = { nombre, correo, asunto, mensaje };
    if (Object.values(campos).some(valor => typeof valor !== 'string')) {
      return res.status(400).json({ mensaje: 'Completa todos los campos.' });
    }
    const limpio = Object.fromEntries(Object.entries(campos).map(([clave, valor]) => [clave, valor.trim()]));
    if (limpio.nombre.length < 2 || limpio.nombre.length > 100 ||
        limpio.correo.length > 150 || !CORREO.test(limpio.correo) ||
        limpio.asunto.length < 3 || limpio.asunto.length > 120 ||
        limpio.mensaje.length < 10 || limpio.mensaje.length > 2000) {
      return res.status(400).json({ mensaje: 'Revisa los datos ingresados y vuelve a intentarlo.' });
    }
    await MensajeContacto.create(limpio);
    return res.status(201).json({ mensaje: 'Mensaje recibido correctamente.' });
  } catch (error) {
    console.error('Error al guardar mensaje:', error);
    return res.status(500).json({ mensaje: 'No se pudo guardar el mensaje.' });
  }
});

// Bandeja de mensajes exclusiva para administradores.
router.get('/admin', verificarSesion, soloAdministrador, async (req, res) => {
  try {
    const mensajes = await MensajeContacto.find().sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ total: mensajes.length, mensajes });
  } catch (error) {
    console.error('Error al consultar mensajes:', error);
    return res.status(500).json({ mensaje: 'No se pudieron cargar los mensajes.' });
  }
});

module.exports = router;
