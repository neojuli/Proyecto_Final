
import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import './Cart.css';

function Cart({ onContinueShopping }) {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalPrice
  } = useCart();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [errorPedido, setErrorPedido] = useState('');
  const [pedidoGuardado, setPedidoGuardado] = useState(null);

  const [tipoEntrega, setTipoEntrega] = useState('domicilio');

  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    direccion: '',
    observaciones: ''
  });

  const formatoPrecio = (precio) =>
    precio.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });

  function manejarCambio(evento) {
    const { name, value } = evento.target;

    setDatosCliente((datosAnteriores) => ({
      ...datosAnteriores,
      [name]: value
    }));
  }

  async function finalizarCompra(evento) {
    evento.preventDefault();

    if (enviandoPedido || items.length === 0) return;

    setEnviandoPedido(true);
    setErrorPedido('');

    try {
      const productosPedido = items.map((item) => ({
        producto: item.id,
        presentacion: item.presentacion,
        cantidad: item.cantidad
      }));

      const datosPedido = {
        cliente: {
          nombre: datosCliente.nombre.trim(),
          telefono: datosCliente.telefono.trim(),
          correo: datosCliente.correo.trim()
        },
        tipoEntrega,
        direccion:
          tipoEntrega === 'domicilio'
            ? datosCliente.direccion.trim()
            : '',
        observaciones: datosCliente.observaciones.trim(),
        productos: productosPedido
      };

      const respuesta = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosPedido)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje || 'No se pudo registrar el pedido'
        );
      }

      if (!resultado.pedido?.id) {
        throw new Error(
          'El servidor no devolvió una confirmación válida'
        );
      }

      setPedidoGuardado({
        ...resultado.pedido,
        productos: items.map((item) => ({ ...item }))
      });

      setPedidoConfirmado(true);

      // Vaciar únicamente después de recibir la confirmación
      clearCart();

    } catch (error) {
      console.error('Error al registrar el pedido:', error);

      setErrorPedido(
        error.message ||
        'Ocurrió un problema al enviar el pedido'
      );
    } finally {
      setEnviandoPedido(false);
    }
  }

  function volverAlCarrito() {
    setMostrarFormulario(false);
    setPedidoConfirmado(false);
    setPedidoGuardado(null);
    setErrorPedido('');
  }

  return (
    <section className="carrito" id="carrito">

      <div className="carrito-encabezado">
        <h2>
          {pedidoConfirmado
            ? 'Confirmación de pedido'
            : mostrarFormulario
              ? 'Finalizar compra'
              : 'Mi carrito de compras'}
        </h2>

        {!mostrarFormulario && !pedidoConfirmado && (
          <span>
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>

      {pedidoConfirmado && pedidoGuardado ? (

        <div className="pedido-confirmado">
          <h3>¡Gracias por tu compra!</h3>

          <p>
            Tu pedido fue registrado correctamente en nuestro
            sistema y está pendiente de confirmación.
          </p>

          <div className="pedido-datos">
            <h3>Información del pedido</h3>

            <p>
              <strong>Número de pedido:</strong>{' '}
              {pedidoGuardado.id}
            </p>

            <p>
              <strong>Estado:</strong>{' '}
              {pedidoGuardado.estado}
            </p>

            <p>
              <strong>Fecha:</strong>{' '}
              {new Date(pedidoGuardado.fecha).toLocaleString('es-CO')}
            </p>
          </div>

          <div className="pedido-datos">
            <h3>Datos del cliente</h3>

            <p>
              <strong>Nombre:</strong> {datosCliente.nombre}
            </p>

            <p>
              <strong>Teléfono:</strong> {datosCliente.telefono}
            </p>

            <p>
              <strong>Correo:</strong> {datosCliente.correo}
            </p>

            <p>
              <strong>Entrega:</strong>{' '}
              {tipoEntrega === 'domicilio'
                ? 'Domicilio'
                : 'Recoger en el establecimiento'}
            </p>

            {tipoEntrega === 'domicilio' && (
              <p>
                <strong>Dirección:</strong>{' '}
                {datosCliente.direccion}
              </p>
            )}

            {datosCliente.observaciones && (
              <p>
                <strong>Observaciones:</strong>{' '}
                {datosCliente.observaciones}
              </p>
            )}
          </div>

          <div className="pedido-resumen">
            <h3>Resumen de compra</h3>

            {pedidoGuardado.productos.map((item) => (
              <p key={`${item.id}-${item.presentacion}`}>
                {item.nombre} - {item.presentacion} x {item.cantidad}
                {' : '}
                {formatoPrecio(item.precio * item.cantidad)}
              </p>
            ))}

            <p className="carrito-total">
              Total registrado:{' '}
              {formatoPrecio(pedidoGuardado.total)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              volverAlCarrito();
              onContinueShopping();
            }}
          >
            Seguir explorando sabores
          </button>
        </div>

      ) : items.length === 0 ? (

        <div className="carrito-vacio">
          <h3>Tu carrito está vacío</h3>

          <p>¡Anímate a descubrir nuestros deliciosos sabores!</p>

          <button
            type="button"
            onClick={onContinueShopping}
          >
            Explorar sabores
          </button>
        </div>

      ) : mostrarFormulario ? (

        <div className="formulario-compra">

          <p>
            Completa tus datos para continuar con tu pedido.
          </p>

          <form onSubmit={finalizarCompra}>

            <div className="campo-compra">
              <label htmlFor="nombre">Nombre completo</label>

              <input
                id="nombre"
                type="text"
                name="nombre"
                value={datosCliente.nombre}
                onChange={manejarCambio}
                placeholder="Escribe tu nombre completo"
                required
                disabled={enviandoPedido}
              />
            </div>

            <div className="campo-compra">
              <label htmlFor="telefono">Número de teléfono</label>

              <input
                id="telefono"
                type="tel"
                name="telefono"
                value={datosCliente.telefono}
                onChange={manejarCambio}
                placeholder="Ej. 3001234567"
                required
                disabled={enviandoPedido}
              />
            </div>

            <div className="campo-compra">
              <label htmlFor="correo">Correo electrónico</label>

              <input
                id="correo"
                type="email"
                name="correo"
                value={datosCliente.correo}
                onChange={manejarCambio}
                placeholder="ejemplo@correo.com"
                required
                disabled={enviandoPedido}
              />
            </div>

            <div className="campo-compra">
              <label>¿Cómo deseas recibir tu pedido?</label>

              <div className="opciones-entrega">

                <label>
                  <input
                    type="radio"
                    name="entrega"
                    value="domicilio"
                    checked={tipoEntrega === 'domicilio'}
                    onChange={() => setTipoEntrega('domicilio')}
                    disabled={enviandoPedido}
                  />
                  Domicilio
                </label>

                <label>
                  <input
                    type="radio"
                    name="entrega"
                    value="recoger"
                    checked={tipoEntrega === 'recoger'}
                    onChange={() => setTipoEntrega('recoger')}
                    disabled={enviandoPedido}
                  />
                  Recoger en el establecimiento
                </label>

              </div>
            </div>

            {tipoEntrega === 'domicilio' && (
              <div className="campo-compra">
                <label htmlFor="direccion">
                  Dirección de entrega
                </label>

                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={datosCliente.direccion}
                  onChange={manejarCambio}
                  placeholder="Ingresa tu dirección completa"
                  required
                  disabled={enviandoPedido}
                />
              </div>
            )}

            <div className="campo-compra">
              <label htmlFor="observaciones">
                Observaciones (opcional)
              </label>

              <textarea
                id="observaciones"
                name="observaciones"
                value={datosCliente.observaciones}
                onChange={manejarCambio}
                placeholder="Indicaciones adicionales para tu pedido"
                rows="4"
                disabled={enviandoPedido}
              />
            </div>

            <div className="resumen-final-compra">
              <h3>Resumen de tu pedido</h3>

              {items.map((item) => (
                <div
                  className="resumen-producto"
                  key={`${item.id}-${item.presentacion}`}
                >
                  <span>
                    {item.nombre} ({item.presentacion}) x {item.cantidad}
                  </span>

                  <strong>
                    {formatoPrecio(item.precio * item.cantidad)}
                  </strong>
                </div>
              ))}

              <p className="carrito-total">
                Total estimado: {formatoPrecio(totalPrice)}
              </p>

              <p>
                El precio definitivo se verificará con nuestra
                base de datos al confirmar el pedido.
              </p>
            </div>

            {errorPedido && (
              <p
                role="alert"
                style={{
                  color: '#b42318',
                  background: '#fff0ed',
                  padding: '12px',
                  borderRadius: '8px'
                }}
              >
                {errorPedido}
              </p>
            )}

            <div className="acciones-compra">

              <button
                type="button"
                className="btn-volver-carrito"
                onClick={() => setMostrarFormulario(false)}
                disabled={enviandoPedido}
              >
                Volver al carrito
              </button>

              <button
                type="submit"
                className="btn-confirmar-compra"
                disabled={enviandoPedido}
              >
                {enviandoPedido
                  ? 'Registrando pedido...'
                  : 'Confirmar pedido'}
              </button>

            </div>

          </form>
        </div>

      ) : (

        <>

          <div className="carrito-lista">

            {items.map((item) => (
              <article
                className="carrito-producto"
                key={`${item.id}-${item.presentacion}`}
              >

                <img
                  src={item.imagen}
                  alt={item.nombre}
                />

                <div className="carrito-detalles">

                  <h3>{item.nombre}</h3>

                  <p>
                    Presentación: {item.presentacion}
                  </p>

                  <p className="carrito-precio">
                    {formatoPrecio(item.precio)}
                  </p>

                  <div className="carrito-controles">

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.presentacion,
                          item.cantidad - 1
                        )
                      }
                      disabled={item.cantidad <= 1}
                      aria-label={`Disminuir cantidad de ${item.nombre}`}
                    >
                      −
                    </button>

                    <span>{item.cantidad}</span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.presentacion,
                          item.cantidad + 1
                        )
                      }
                      aria-label={`Aumentar cantidad de ${item.nombre}`}
                    >
                      +
                    </button>

                  </div>

                  <p>
                    Subtotal:{' '}
                    {formatoPrecio(item.precio * item.cantidad)}
                  </p>

                  <button
                    type="button"
                    className="carrito-eliminar"
                    onClick={() =>
                      removeItem(item.id, item.presentacion)
                    }
                  >
                    Eliminar producto
                  </button>

                </div>
              </article>
            ))}

          </div>

          <div className="carrito-resumen">

            <h3>Resumen de compra</h3>

            <p>
              Cantidad de productos:
              <strong> {totalItems}</strong>
            </p>

            <p className="carrito-total">
              Total: {formatoPrecio(totalPrice)}
            </p>

            <button
              type="button"
              className="carrito-vaciar"
              onClick={clearCart}
            >
              Vaciar carrito
            </button>

            <button
              type="button"
              className="btn-finalizar-compra"
              onClick={() => setMostrarFormulario(true)}
            >
              Finalizar compra
            </button>

          </div>

        </>
      )}

    </section>
  );
}

export default Cart;
