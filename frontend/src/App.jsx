
import { useEffect, useState } from 'react';
import { useCart } from './context/CartContext.jsx';
import Cart from './components/Cart.jsx';
import Auth from './components/auth.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import Contacto from './components/Contacto.jsx';
import './App.css';

const API_URL = '/api/productos';

const ORDEN_PRESENTACIONES = [
  '1 bola',
  '2 bolas',
  'Medio litro',
  '1 litro'
];

function App() {
  const { addItem, totalItems } = useCart();

  const [productos, setProductos] = useState([]);
  const [presentaciones, setPresentaciones] = useState({});
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [mostrarAdmin, setMostrarAdmin] = useState(false);

  const [usuario, setUsuario] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [errorSesion, setErrorSesion] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Cargar productos desde MongoDB
  useEffect(() => {
    const controlador = new AbortController();

    async function cargarProductos() {
      try {
        setCargando(true);
        setError('');

        const respuesta = await fetch(API_URL, {
          signal: controlador.signal
        });

        if (!respuesta.ok) {
          throw new Error('No se pudieron obtener los productos');
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error('La respuesta del servidor no es válida');
        }

        const productosAdaptados = datos.map((producto) => ({
          ...producto,
          id: producto._id,
          presentaciones: ORDEN_PRESENTACIONES.filter(
            (nombre) =>
              typeof producto.precios?.[nombre] === 'number'
          )
        }));

        setProductos(productosAdaptados);

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error al cargar productos:', error);

          setError(
            'No pudimos cargar los sabores. Comprueba que el servidor esté funcionando.'
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarProductos();

    return () => controlador.abort();
  }, []);

  // Comprobar si ya existe una sesión activa
  useEffect(() => {
    const controlador = new AbortController();

    async function comprobarSesion() {
      try {
        const respuesta = await fetch('/api/auth/sesion', {
          credentials: 'same-origin',
          signal: controlador.signal
        });

        if (respuesta.status === 401) {
          setUsuario(null);
          return;
        }

        if (!respuesta.ok) {
          throw new Error('No se pudo verificar la sesión');
        }

        const datos = await respuesta.json();

        if (!controlador.signal.aborted) {
          setUsuario(datos.usuario || null);
        }

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error al verificar sesión:', error);
          setErrorSesion(
            'No se pudo verificar la sesión. Intenta actualizar la página.'
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setVerificandoSesion(false);
        }
      }
    }

    comprobarSesion();

    return () => controlador.abort();
  }, []);

  // Desplazamiento a sabores
  useEffect(() => {
    if (
      !mostrarCarrito &&
      !mostrarAuth &&
      window.location.hash === '#sabores'
    ) {
      document.getElementById('sabores')?.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, [mostrarCarrito, mostrarAuth, cargando]);

function explorarSabores() {
  window.history.replaceState(null, '', '#sabores');
  setMostrarCarrito(false);
  setMostrarAuth(false);
  setMostrarAdmin(false);
}

  function abrirAuth() {
    setMostrarCarrito(false);
    setMostrarAuth(true);
    setErrorSesion('');
  }

  function abrirAdmin() {
  if (usuario?.rol !== 'administrador') return;

  setMostrarCarrito(false);
  setMostrarAuth(false);
  setMostrarAdmin(true);
}

  function iniciarSesion(usuarioAutenticado) {
    setUsuario(usuarioAutenticado);
    setMostrarAuth(false);
    setErrorSesion('');
  }

  async function cerrarSesion() {
    if (cerrandoSesion) return;

    setCerrandoSesion(true);
    setErrorSesion('');

    try {
      const respuesta = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });

      if (!respuesta.ok) {
        throw new Error('No se pudo cerrar la sesión');
      }

      setUsuario(null);
      setMostrarAuth(false);
      setMostrarAdmin(false);

    } catch (error) {
      console.error('Error al cerrar sesión:', error);

      setErrorSesion(
        'No se pudo cerrar la sesión. Inténtalo nuevamente.'
      );
    } finally {
      setCerrandoSesion(false);
    }
  }

  const formatoPrecio = (precio) =>
    precio.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });

  function agregarAlCarrito(producto) {
    const presentacion =
      presentaciones[producto.id] || producto.presentaciones[0];

    if (!presentacion) return;

    addItem(producto, presentacion);
  }

function navegarASeccion() {
  setMostrarCarrito(false);
  setMostrarAuth(false);
  setMostrarAdmin(false);
}

  return (
    <div className="App">

      <header>
        <img
          src="/imagenes/logo.jpeg"
          alt="Logo Gota de Nieve"
          className="logo"
        />

        <nav>
          <a href="#inicio" onClick={navegarASeccion}>
            Inicio
          </a>

          <a href="#sabores" onClick={navegarASeccion}>
            Sabores
          </a>

          <a href="#galeria" onClick={navegarASeccion}>
            Galería
          </a>

          <a href="#contacto" onClick={navegarASeccion}>
            Contacto
          </a>

          {!verificandoSesion && (
            usuario ? (
              <div className="usuario-menu">
                <span className="usuario-nombre">
                  Hola, {usuario.nombre}
                </span>

                
{usuario.rol === 'administrador' && (
  <>
    <span className="usuario-rol">
      Administrador
    </span>

    <button
      type="button"
      className="btn-panel-admin"
      onClick={abrirAdmin}
    >
      Panel administrativo
    </button>
  </>
)}


                <button
                  type="button"
                  className="btn-cerrar-sesion"
                  onClick={cerrarSesion}
                  disabled={cerrandoSesion}
                >
                  {cerrandoSesion
                    ? 'Cerrando...'
                    : 'Cerrar sesión'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-mi-cuenta"
                onClick={abrirAuth}
              >
                Mi cuenta
              </button>
            )
          )}

          <button
            type="button"
            className="btn-ver-carrito"
            onClick={() => {
              setMostrarCarrito(!mostrarCarrito);
              setMostrarAuth(false);
              setMostrarAdmin(false);
            }}
          >
            🛒 Mi carrito ({totalItems})
          </button>
        </nav>
      </header>

      {errorSesion && (
        <p
          role="alert"
          className="mensaje-catalogo error-catalogo"
        >
          {errorSesion}
        </p>
      )}

        {mostrarCarrito && !mostrarAdmin && (
        <Cart onContinueShopping={explorarSabores} />
      )}

      <main>

  {mostrarAdmin && usuario?.rol === 'administrador' ? (
    <AdminPanel onClose={() => setMostrarAdmin(false)} />
  ) : mostrarAuth ? (
          <Auth
            onLogin={iniciarSesion}
            onClose={() => setMostrarAuth(false)}
          />
        ) : !mostrarCarrito && (
          <>
            <section id="inicio">
              <h1>Bienvenido a Gota de Nieve</h1>

              <p>
                Descubre el sabor de nuestros deliciosos helados.
              </p>

              <a href="#sabores">Ver sabores</a>
            </section>

            <section id="sabores">
              <h2>Nuestros sabores</h2>

              {cargando && (
                <p role="status" className="mensaje-catalogo">
                  Cargando nuestros deliciosos sabores...
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="mensaje-catalogo error-catalogo"
                >
                  {error}
                </p>
              )}

              {!cargando && !error && productos.length === 0 && (
                <p className="mensaje-catalogo">
                  Por el momento no tenemos sabores disponibles.
                </p>
              )}

              {!cargando && !error && (
                <div className="productos">

                  {productos.map((producto) => {
                    const presentacionSeleccionada =
                      presentaciones[producto.id] ||
                      producto.presentaciones[0];

                    const precio =
                      producto.precios[presentacionSeleccionada];

                    return (
                      <article
                        className="producto-card"
                        key={producto.id}
                      >

                        <img
                          src={producto.imagen}
                          alt={`Helado de ${producto.nombre}`}
                        />

                        <div className="producto-info">

                          <h3>{producto.nombre}</h3>

                          <p className="descripcion">
                            {producto.descripcion}
                          </p>

                          <p className="precio">
                            {typeof precio === 'number'
                              ? formatoPrecio(precio)
                              : 'Precio no disponible'}
                          </p>

                          <label
                            htmlFor={`presentacion-${producto.id}`}
                          >
                            Presentación:
                          </label>

                          <select
                            id={`presentacion-${producto.id}`}
                            value={presentacionSeleccionada || ''}
                            disabled={
                              producto.presentaciones.length === 0
                            }
                            onChange={(e) =>
                              setPresentaciones((actual) => ({
                                ...actual,
                                [producto.id]: e.target.value
                              }))
                            }
                          >
                            {producto.presentaciones.map(
                              (presentacion) => (
                                <option
                                  key={presentacion}
                                  value={presentacion}
                                >
                                  {presentacion}
                                </option>
                              )
                            )}
                          </select>

                          <button
                            type="button"
                            className="btn-agregar"
                            disabled={
                              producto.presentaciones.length === 0
                            }
                            onClick={() =>
                              agregarAlCarrito(producto)
                            }
                          >
                            Agregar al carrito
                          </button>

                        </div>
                      </article>
                    );
                  })}

                </div>
              )}
            </section>

            <section id="galeria">
              <h2>Nuestra galería</h2>

              <img
                src="/imagenes/menu.jpeg"
                alt="Menú de Gota de Nieve"
                className="menu"
              />
            </section>

            <section id="contacto">
              <h2>Contáctanos</h2>
              <Contacto />
            </section>
          </>
        )}

      </main>

      <footer>
        <p>
          © Gota de Nieve - Todos los derechos reservados
        </p>
      </footer>

    </div>
  );
}

export default App;
