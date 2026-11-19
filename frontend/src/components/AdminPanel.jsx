
import { useEffect, useState } from 'react';
import './AdminPanel.css';

const TRANSICIONES = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['preparando', 'cancelado'],
  preparando: ['en camino', 'entregado', 'cancelado'],
  'en camino': ['entregado'],
  entregado: [],
  cancelado: []
};

const PRESENTACIONES = ['1 bola', '2 bolas', 'Medio litro', '1 litro'];

const NOMBRES_ESTADOS = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  'en camino': 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
};

function AdminPanel({ onClose }) {
  const [pestana, setPestana] = useState('pedidos');
  const [mensajesContacto, setMensajesContacto] = useState([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [mensajesCargados, setMensajesCargados] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [productosCargados, setProductosCargados] = useState(false);
  const [guardandoProducto, setGuardandoProducto] = useState(null);
  const [ediciones, setEdiciones] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [actualizandoId, setActualizandoId] = useState(null);
  const [estadosSeleccionados, setEstadosSeleccionados] = useState({});

  useEffect(() => {
    const controlador = new AbortController();

    async function cargarPedidos() {
      try {
        setCargando(true);
        setError('');

        const respuesta = await fetch('/api/pedidos', {
          credentials: 'same-origin',
          signal: controlador.signal
        });

        if (!respuesta.ok) {
          if (respuesta.status === 401) {
            throw new Error('Tu sesión ha expirado.');
          }

          if (respuesta.status === 403) {
            throw new Error('No tienes permisos para consultar pedidos.');
          }

          throw new Error('No se pudieron cargar los pedidos.');
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos.pedidos)) {
          throw new Error('Respuesta inválida del servidor.');
        }

        setPedidos(datos.pedidos);

      } catch (error) {
        if (error.name !== 'AbortError') {
          setError(error.message);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarPedidos();

    return () => controlador.abort();
  }, []);

  useEffect(() => {
    if (pestana !== 'productos' || productosCargados) return;
    const controlador = new AbortController();
    async function cargarProductos() {
      setCargandoProductos(true);
      setError('');
      try {
        const respuesta = await fetch('/api/productos/admin/todos', {
          credentials: 'same-origin',
          signal: controlador.signal
        });
        if (!respuesta.ok) {
          throw new Error(respuesta.status === 401 ? 'Tu sesión ha expirado.' :
            respuesta.status === 403 ? 'No tienes permisos para consultar productos.' :
            'No se pudieron cargar los productos.');
        }
        const datos = await respuesta.json();
        if (!Array.isArray(datos.productos)) throw new Error('Respuesta de productos inválida.');
        setProductos(datos.productos);
        setEdiciones(Object.fromEntries(datos.productos.map((producto) => [
          producto._id, {
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            disponible: Boolean(producto.disponible),
            precios: Object.fromEntries(PRESENTACIONES.map((nombre) => [
              nombre, String(producto.precios?.[nombre] ?? '')
            ]))
          }
        ])));
        setProductosCargados(true);
      } catch (error) {
        if (error.name !== 'AbortError') setError(error.message);
      } finally {
        if (!controlador.signal.aborted) setCargandoProductos(false);
      }
    }
    cargarProductos();
    return () => controlador.abort();
  }, [pestana, productosCargados]);

  useEffect(() => {
    if (pestana !== 'mensajes' || mensajesCargados) return;
    const controlador = new AbortController();
    async function cargarMensajes() {
      setCargandoMensajes(true);
      setError('');
      try {
        const respuesta = await fetch('/api/contacto/admin', {
          credentials: 'same-origin',
          signal: controlador.signal
        });
        if (!respuesta.ok) throw new Error('No se pudieron cargar los mensajes de contacto.');
        const datos = await respuesta.json();
        if (!Array.isArray(datos.mensajes)) throw new Error('Respuesta de mensajes inválida.');
        setMensajesContacto(datos.mensajes);
        setMensajesCargados(true);
      } catch (error) {
        if (error.name !== 'AbortError') setError(error.message);
      } finally {
        if (!controlador.signal.aborted) setCargandoMensajes(false);
      }
    }
    cargarMensajes();
    return () => controlador.abort();
  }, [pestana, mensajesCargados]);

  function editarProducto(id, campo, valor) {
    setEdiciones((actuales) => ({
      ...actuales,
      [id]: { ...actuales[id], [campo]: valor }
    }));
  }

  function editarPrecio(id, presentacion, valor) {
    setEdiciones((actuales) => ({
      ...actuales,
      [id]: {
        ...actuales[id],
        precios: { ...actuales[id].precios, [presentacion]: valor }
      }
    }));
  }

  async function guardarProducto(id) {
    if (guardandoProducto) return;
    const datos = ediciones[id];
    if (!datos || !datos.nombre.trim() || !datos.descripcion.trim()) {
      setError('El nombre y la descripción son obligatorios.');
      setMensaje('');
      return;
    }
    const precios = Object.fromEntries(PRESENTACIONES.map((nombre) => [
      nombre, Number(datos.precios[nombre])
    ]));
    if (Object.values(precios).some((precio) => !Number.isFinite(precio) || precio <= 0)) {
      setError('Todos los precios deben ser números mayores que cero.');
      setMensaje('');
      return;
    }
    setGuardandoProducto(id);
    setError('');
    setMensaje('');
    try {
      const respuesta = await fetch(`/api/productos/admin/${id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion.trim(),
          disponible: datos.disponible,
          precios
        })
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo guardar el producto.');
      setProductos((actuales) => actuales.map((producto) =>
        producto._id === id ? resultado.producto : producto
      ));
      setMensaje(`Producto «${resultado.producto.nombre}» actualizado correctamente.`);
    } catch (error) {
      setError(error.message || 'Error inesperado al guardar.');
    } finally {
      setGuardandoProducto(null);
    }
  }

  function formatoPrecio(valor) {
    return Number(valor || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });
  }

  function formatoFecha(fecha) {
    if (!fecha) return 'Sin fecha';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return 'Fecha no disponible';
    }

    return valor.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  async function actualizarEstado(pedido) {
    const nuevoEstado = estadosSeleccionados[pedido._id];

    if (!nuevoEstado || nuevoEstado === pedido.estado) {
      return;
    }

    if (actualizandoId) return;

    setActualizandoId(pedido._id);
    setError('');
    setMensaje('');

    try {
      const respuesta = await fetch(
        `/api/pedidos/${pedido._id}/estado`,
        {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            estado: nuevoEstado
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje || 'No se pudo actualizar el pedido.'
        );
      }

      setPedidos((actuales) =>
        actuales.map((item) =>
          item._id === pedido._id
            ? { ...item, estado: resultado.pedido.estado }
            : item
        )
      );

      setEstadosSeleccionados((actuales) => {
        const copia = { ...actuales };
        delete copia[pedido._id];
        return copia;
      });

      setMensaje('Estado del pedido actualizado correctamente.');

    } catch (error) {
      setError(error.message || 'Ocurrió un error inesperado.');
    } finally {
      setActualizandoId(null);
    }
  }

  const pedidosPendientes = pedidos.filter(
    (pedido) => pedido.estado === 'pendiente'
  ).length;

  const totalPedidos = pedidos
    .filter((pedido) => pedido.estado !== 'cancelado')
    .reduce(
      (total, pedido) => total + Number(pedido.total || 0),
      0
    );

  return (
    <section className="admin-panel">
      <div className="admin-contenido">

        <div className="admin-encabezado">
          <div>
            <p className="admin-etiqueta">GOTA DE NIEVE</p>
            <h1>Panel administrativo</h1>
            <p>Gestiona los pedidos y productos de tu tienda.</p>
          </div>

          <button
            type="button"
            className="admin-volver"
            onClick={onClose}
          >
            Volver a la tienda
          </button>
        </div>

        <div className="admin-pestanas" role="tablist" aria-label="Secciones del panel">
          <button type="button" role="tab" aria-selected={pestana === 'pedidos'}
            className={pestana === 'pedidos' ? 'admin-pestana activa' : 'admin-pestana'}
            onClick={() => { setPestana('pedidos'); setError(''); setMensaje(''); }}>
            Pedidos
          </button>
          <button type="button" role="tab" aria-selected={pestana === 'productos'}
            className={pestana === 'productos' ? 'admin-pestana activa' : 'admin-pestana'}
            onClick={() => { setPestana('productos'); setError(''); setMensaje(''); }}>
            Productos
          </button>
          <button type="button" role="tab" aria-selected={pestana === 'mensajes'}
            className={pestana === 'mensajes' ? 'admin-pestana activa' : 'admin-pestana'}
            onClick={() => { setPestana('mensajes'); setError(''); setMensaje(''); }}>
            Mensajes
          </button>
        </div>

        {pestana === 'pedidos' && cargando && (
          <p className="admin-mensaje" role="status">
            Cargando pedidos...
          </p>
        )}

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}

        {mensaje && (
          <p className="admin-exito" role="status">
            {mensaje}
          </p>
        )}

        {pestana === 'pedidos' && !cargando && (
          <>
            <div className="admin-estadisticas">
              <div className="admin-estadistica">
                <span>Total de pedidos</span>
                <strong>{pedidos.length}</strong>
              </div>

              <div className="admin-estadistica">
                <span>Pedidos pendientes</span>
                <strong>{pedidosPendientes}</strong>
              </div>

              <div className="admin-estadistica">
                <span>Valor de pedidos no cancelados</span>
                <strong>{formatoPrecio(totalPedidos)}</strong>
              </div>
            </div>

            <div className="admin-seccion">
              <h2>Pedidos recientes</h2>
              <p className="admin-descripcion">
                Se muestran hasta los 100 pedidos más recientes.
              </p>

              {pedidos.length === 0 ? (
                <p className="admin-mensaje">
                  Todavía no hay pedidos registrados.
                </p>
              ) : (
                <div className="admin-tabla-contenedor">
                  <table className="admin-tabla">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Productos</th>
                        <th>Entrega</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pedidos.map((pedido) => {
                        const disponibles =
                          TRANSICIONES[pedido.estado] || [];

                        const seleccionado =
                          estadosSeleccionados[pedido._id] || '';

                        return (
                          <tr key={pedido._id}>
                            <td>
                              {formatoFecha(pedido.createdAt)}
                            </td>

                            <td>
                              <strong>
                                {pedido.cliente?.nombre || 'Sin nombre'}
                              </strong>
                              <small>{pedido.cliente?.correo || ''}</small>
                              <small>{pedido.cliente?.telefono || ''}</small>
                            </td>

                            <td>
                              {pedido.productos?.map(
                                (producto, indice) => (
                                  <div
                                    className="admin-producto"
                                    key={indice}
                                  >
                                    {producto.cantidad} × {producto.nombre}
                                    <small>{producto.presentacion}</small>
                                  </div>
                                )
                              )}
                            </td>

                            <td>
                              {pedido.tipoEntrega === 'domicilio'
                                ? 'Domicilio'
                                : 'Recoger en tienda'}

                              {pedido.direccion && (
                                <small>{pedido.direccion}</small>
                              )}
                            </td>

                            <td className="admin-total">
                              {formatoPrecio(pedido.total)}
                            </td>

                            <td>
                              <span className="admin-estado">
                                {NOMBRES_ESTADOS[pedido.estado] ||
                                  pedido.estado}
                              </span>
                            </td>

                            <td>
                              {disponibles.length > 0 ? (
                                <div className="admin-acciones">
                                  <select
                                    aria-label={`Nuevo estado del pedido ${pedido._id}`}
                                    value={seleccionado}
                                    disabled={actualizandoId !== null}
                                    onChange={(evento) =>
                                      setEstadosSeleccionados(
                                        (actuales) => ({
                                          ...actuales,
                                          [pedido._id]: evento.target.value
                                        })
                                      )
                                    }
                                  >
                                    <option value="">
                                      Seleccionar estado
                                    </option>

                                    {disponibles.map((estado) => (
                                      <option
                                        key={estado}
                                        value={estado}
                                      >
                                        {NOMBRES_ESTADOS[estado]}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    className="admin-guardar"
                                    disabled={
                                      !seleccionado ||
                                      actualizandoId !== null
                                    }
                                    onClick={() =>
                                      actualizarEstado(pedido)
                                    }
                                  >
                                    {actualizandoId === pedido._id
                                      ? 'Guardando...'
                                      : 'Guardar'}
                                  </button>
                                </div>
                              ) : (
                                <span className="admin-sin-acciones">
                                  Estado final
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
        {pestana === 'mensajes' && (
          <div className="admin-seccion">
            <div className="admin-productos-encabezado">
              <div>
                <h2>Mensajes de contacto</h2>
                <p className="admin-descripcion">Hasta los 100 mensajes más recientes enviados desde la tienda.</p>
              </div>
              <button type="button" className="admin-recargar" disabled={cargandoMensajes}
                onClick={() => { setMensajesCargados(false); setError(''); setMensaje(''); }}>
                Actualizar mensajes
              </button>
            </div>
            {cargandoMensajes ? <p className="admin-mensaje">Cargando mensajes...</p> :
              mensajesContacto.length === 0 ? <p className="admin-mensaje">Todavía no hay mensajes registrados.</p> :
              <div className="admin-mensajes-grid">
                {mensajesContacto.map(item => (
                  <article className="admin-mensaje-card" key={item._id}>
                    <div className="admin-mensaje-cabecera">
                      <strong>{item.asunto}</strong>
                      <small>{formatoFecha(item.createdAt)}</small>
                    </div>
                    <p><strong>{item.nombre}</strong> — <a href={`mailto:${item.correo}`}>{item.correo}</a></p>
                    <p className="admin-mensaje-texto">{item.mensaje}</p>
                  </article>
                ))}
              </div>}
          </div>
        )}
        {pestana === 'productos' && (
          <div className="admin-seccion">
            <div className="admin-productos-encabezado">
              <div>
                <h2>Administrar productos</h2>
                <p className="admin-descripcion">Actualiza los sabores, precios y disponibilidad del catálogo.</p>
              </div>
              <button type="button" className="admin-recargar" disabled={cargandoProductos || guardandoProducto !== null}
                onClick={() => { setProductosCargados(false); setError(''); setMensaje(''); }}>
                Actualizar lista
              </button>
            </div>
            {cargandoProductos ? <p className="admin-mensaje">Cargando productos...</p> :
              productos.length === 0 ? <p className="admin-mensaje">No hay productos registrados.</p> :
              <div className="admin-productos-grid">
                {productos.map((producto) => {
                  const datos = ediciones[producto._id];
                  if (!datos) return null;
                  const ocupado = guardandoProducto !== null;
                  return (
                    <article className="admin-producto-card" key={producto._id}>
                      <div className="admin-producto-cabecera">
                        <img src={producto.imagen} alt={producto.nombre} loading="lazy" />
                        <div>
                          <strong>{producto.nombre}</strong>
                          <span className={datos.disponible ? 'admin-disponible' : 'admin-agotado'}>
                            {datos.disponible ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                      </div>
                      <label className="admin-campo">Nombre
                        <input value={datos.nombre} maxLength={100} disabled={ocupado}
                          onChange={(e) => editarProducto(producto._id, 'nombre', e.target.value)} />
                      </label>
                      <label className="admin-campo">Descripción
                        <textarea value={datos.descripcion} rows={3} maxLength={600} disabled={ocupado}
                          onChange={(e) => editarProducto(producto._id, 'descripcion', e.target.value)} />
                      </label>
                      <div className="admin-precios-grid">
                        {PRESENTACIONES.map((presentacion) => (
                          <label className="admin-campo" key={presentacion}>{presentacion} (COP)
                            <input type="number" min="1" step="1" required disabled={ocupado}
                              value={datos.precios[presentacion]}
                              onChange={(e) => editarPrecio(producto._id, presentacion, e.target.value)} />
                          </label>
                        ))}
                      </div>
                      <label className="admin-disponibilidad">
                        <input type="checkbox" checked={datos.disponible} disabled={ocupado}
                          onChange={(e) => editarProducto(producto._id, 'disponible', e.target.checked)} />
                        Mostrar este producto en la tienda
                      </label>
                      <button type="button" className="admin-guardar-producto" disabled={ocupado}
                        onClick={() => guardarProducto(producto._id)}>
                        {guardandoProducto === producto._id ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </article>
                  );
                })}
              </div>}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminPanel;
