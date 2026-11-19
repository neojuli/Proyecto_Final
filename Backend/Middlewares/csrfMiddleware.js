
function verificarOrigen(req, res, next) {
  const metodosSeguros = ['GET', 'HEAD', 'OPTIONS'];

  if (metodosSeguros.includes(req.method)) {
    return next();
  }

  const origen = req.get('origin');
  const sitio = req.get('sec-fetch-site');

  // Rechazar solicitudes que indiquen un origen externo.
  if (sitio === 'cross-site') {
    return res.status(403).json({
      mensaje: 'Solicitud rechazada por seguridad'
    });
  }

  // Exigir el encabezado Origin en operaciones
  // que modifican información.
  if (!origen) {
    return res.status(403).json({
      mensaje: 'No se pudo verificar el origen de la solicitud'
    });
  }

  const origenesPermitidos = (
    process.env.ALLOWED_ORIGINS || ''
  )
    .split(',')
    .map((valor) => valor.trim())
    .filter(Boolean);

 
if (process.env.NODE_ENV !== 'production') {
  origenesPermitidos.push(
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175'
  );
}


  if (!origenesPermitidos.includes(origen)) {
    return res.status(403).json({
      mensaje: 'El origen de la solicitud no está autorizado'
    });
  }

  next();
}

module.exports = { verificarOrigen };
