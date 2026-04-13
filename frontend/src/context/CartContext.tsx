import React, { createContext, useContext, useState, useCallback } from 'react';

export interface CartEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  price: number;
  category: string;
  quantity: number;
  registrationDetails?: any;
}

interface CartContextType {
  cartItems: CartEvent[];
  addToCart: (event: Omit<CartEvent, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartEvent[]>([]);

  const addToCart = useCallback((event: Omit<CartEvent, 'quantity'>) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === event.id);
      if (existing) {
        return prev.map((item) =>
          item.id === event.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...event, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const isInCart = useCallback(
    (id: string) => cartItems.some((item) => item.id === id),
    [cartItems]
  );

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart, isInCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
