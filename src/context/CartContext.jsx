import { createContext, useContext, useEffect, useReducer, useState } from "react";

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.id === action.product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.product, qty: 1 }] };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "SET_QTY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i
        ),
      };
    case "CLEAR":
      return { ...state, items: [] };
    case "LOAD":
      return { ...state, items: action.items };
    default:
      return state;
  }
}

const STORAGE_KEY = "ght_cart";

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: "LOAD", items: JSON.parse(saved) });
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const itemCount = state.items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const hasPhysical = state.items.some((i) => i.type === "physical_book");

  function addItem(product) {
    dispatch({ type: "ADD", product });
    setDrawerOpen(true);
  }
  function removeItem(id) { dispatch({ type: "REMOVE", id }); }
  function setQty(id, qty) { dispatch({ type: "SET_QTY", id, qty }); }
  function clearCart() { dispatch({ type: "CLEAR" }); }

  return (
    <CartContext.Provider value={{
      items: state.items,
      itemCount,
      subtotal,
      hasPhysical,
      drawerOpen,
      setDrawerOpen,
      addItem,
      removeItem,
      setQty,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
