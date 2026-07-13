/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, selectedSize: string, selectedColor: { name: string; hex: string }) => void;
  removeFromCart: (productId: string, size: string, colorHex: string) => void;
  updateQuantity: (productId: string, size: string, colorHex: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'mk_fashion_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (
    product: Product,
    quantity: number,
    selectedSize: string,
    selectedColor: { name: string; hex: string }
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor.hex === selectedColor.hex
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        // Cap at stock level
        updated[existingIndex].quantity = Math.min(newQty, product.stock);
        return updated;
      }

      return [...prev, { product, quantity, selectedSize, selectedColor }];
    });
  };

  const removeFromCart = (productId: string, size: string, colorHex: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedSize === size &&
            item.selectedColor.hex === colorHex
          )
      )
    );
  };

  const updateQuantity = (productId: string, size: string, colorHex: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter(
          (item) =>
            !(
              item.product.id === productId &&
              item.selectedSize === size &&
              item.selectedColor.hex === colorHex
            )
        );
      }

      return prev.map((item) => {
        if (
          item.product.id === productId &&
          item.selectedSize === size &&
          item.selectedColor.hex === colorHex
        ) {
          return { ...item, quantity: Math.min(quantity, item.product.stock) };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  // Free shipping over $150
  const shipping = subtotal === 0 ? 0 : subtotal >= 150 ? 0 : 15.0;
  
  const tax = subtotal * 0.08; // Estimated 8% sales tax
  
  const total = subtotal + shipping + tax;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        shipping,
        tax,
        total
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
