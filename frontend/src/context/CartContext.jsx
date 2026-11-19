
import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('gotaDeNieveCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // Guardar el carrito cuando cambie
  useEffect(() => {
    localStorage.setItem('gotaDeNieveCart', JSON.stringify(items));
  }, [items]);

  // Agregar productos
  function addItem(producto, presentacion) {
    setItems((actuales) => {
      const existente = actuales.find(
        (item) =>
          item.id === producto.id &&
          item.presentacion === presentacion
      );

      if (existente) {
        return actuales.map((item) =>
          item.id === producto.id &&
          item.presentacion === presentacion
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [
        ...actuales,
        {
          id: producto.id,
          nombre: producto.nombre,
          imagen: producto.imagen,
          precio: producto.precios[presentacion],
          presentacion,
          cantidad: 1
        }
      ];
    });
  }

  // Modificar cantidades
  function updateQuantity(id, presentacion, cantidad) {
    if (cantidad < 1) return;

    setItems((actuales) =>
      actuales.map((item) =>
        item.id === id && item.presentacion === presentacion
          ? { ...item, cantidad }
          : item
      )
    );
  }

  // Eliminar un producto
  function removeItem(id, presentacion) {
    setItems((actuales) =>
      actuales.filter(
        (item) =>
          !(item.id === id && item.presentacion === presentacion)
      )
    );
  }

  // Vaciar el carrito
  function clearCart() {
    setItems([]);
  }

  // Cantidad total de unidades
  const totalItems = items.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  // Valor total de la compra
  const totalPrice = items.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Acceder al carrito desde otros componentes
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart debe utilizarse dentro de CartProvider'
    );
  }

  return context;
}
