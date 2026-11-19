
import { useState } from 'react';
import './Auth.css';

function Auth({ onLogin, onClose }) {
  const [modo, setModo] = useState('login');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [datos, setDatos] = useState({
    nombre: '',
    correo: '',
    contrasena: ''
  });

  function manejarCambio(evento) {
    const { name, value } = evento.target;

    setDatos((actual) => ({
      ...actual,
      [name]: value
    }));
  }

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setError('');
    setMensaje('');
    setDatos({
      nombre: '',
      correo: '',
      contrasena: ''
    });
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();

    if (cargando) return;

    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const esRegistro = modo === 'registro';

      const ruta = esRegistro
        ? '/api/auth/registro'
        : '/api/auth/login';

      const contenido = esRegistro
        ? {
            nombre: datos.nombre.trim(),
            correo: datos.correo.trim(),
            contrasena: datos.contrasena
          }
        : {
            correo: datos.correo.trim(),
            contrasena: datos.contrasena
          };

      const respuesta = await fetch(ruta, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contenido)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje || 'No se pudo completar la solicitud'
        );
      }

      if (esRegistro) {
        setMensaje(
          'Tu cuenta fue creada correctamente. Ahora puedes iniciar sesión.'
        );

        setModo('login');

        setDatos({
          nombre: '',
          correo: datos.correo,
          contrasena: ''
        });
      } else {
        if (!resultado.usuario) {
          throw new Error('El servidor no devolvió los datos del usuario');
        }

        onLogin(resultado.usuario);
      }

    } catch (error) {
      console.error('Error de autenticación:', error);
      setError(
        error.message || 'Ocurrió un error inesperado'
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="auth-contenedor">
      <div className="auth-tarjeta">

        <button
          type="button"
          className="auth-cerrar"
          onClick={onClose}
          aria-label="Cerrar formulario"
        >
          ×
        </button>

        <div className="auth-encabezado">
          <img
            src="/imagenes/logo.jpeg"
            alt="Gota de Nieve"
            className="auth-logo"
          />

          <h2>
            {modo === 'login'
              ? 'Iniciar sesión'
              : 'Crear una cuenta'}
          </h2>

          <p>
            {modo === 'login'
              ? 'Bienvenido de nuevo a Gota de Nieve'
              : 'Regístrate y disfruta de nuestros sabores'}
          </p>
        </div>

        <div className="auth-pestanas">
          <button
            type="button"
            className={modo === 'login' ? 'activo' : ''}
            onClick={() => cambiarModo('login')}
            disabled={cargando}
          >
            Iniciar sesión
          </button>

          <button
            type="button"
            className={modo === 'registro' ? 'activo' : ''}
            onClick={() => cambiarModo('registro')}
            disabled={cargando}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={manejarEnvio}>

          {modo === 'registro' && (
            <div className="auth-campo">
              <label htmlFor="auth-nombre">
                Nombre completo
              </label>

              <input
                id="auth-nombre"
                name="nombre"
                type="text"
                value={datos.nombre}
                onChange={manejarCambio}
                placeholder="Ingresa tu nombre completo"
                maxLength={100}
                autoComplete="name"
                required
                disabled={cargando}
              />
            </div>
          )}

          <div className="auth-campo">
            <label htmlFor="auth-correo">
              Correo electrónico
            </label>

            <input
              id="auth-correo"
              name="correo"
              type="email"
              value={datos.correo}
              onChange={manejarCambio}
              placeholder="ejemplo@correo.com"
              autoComplete="email"
              required
              disabled={cargando}
            />
          </div>

          <div className="auth-campo">
            <label htmlFor="auth-contrasena">
              Contraseña
            </label>

            <input
              id="auth-contrasena"
              name="contrasena"
              type="password"
              value={datos.contrasena}
              onChange={manejarCambio}
              placeholder="Ingresa tu contraseña"
              autoComplete={
                modo === 'registro'
                  ? 'new-password'
                  : 'current-password'
              }
              minLength={modo === 'registro' ? 12 : undefined}
              required
              disabled={cargando}
            />

            {modo === 'registro' && (
              <small>
                Utiliza una contraseña de al menos 12 caracteres.
              </small>
            )}
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="auth-exito" role="status">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            className="auth-boton"
            disabled={cargando}
          >
            {cargando
              ? 'Procesando...'
              : modo === 'login'
                ? 'Iniciar sesión'
                : 'Crear cuenta'}
          </button>

        </form>

        <p className="auth-pie">
          {modo === 'login'
            ? '¿Todavía no tienes una cuenta?'
            : '¿Ya tienes una cuenta?'}

          <button
            type="button"
            onClick={() =>
              cambiarModo(
                modo === 'login' ? 'registro' : 'login'
              )
            }
            disabled={cargando}
          >
            {modo === 'login'
              ? 'Regístrate aquí'
              : 'Inicia sesión'}
          </button>
        </p>

      </div>
    </section>
  );
}

export default Auth;
