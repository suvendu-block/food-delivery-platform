"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { MenuItem } from "@/lib/api";

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: MenuItem, restaurantId: string, restaurantName: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  const addItem = useCallback(
    (item: MenuItem, newRestaurantId: string, newRestaurantName: string) => {
      if (restaurantId && restaurantId !== newRestaurantId) {
        if (!window.confirm("Adding items from a different restaurant will clear your current cart. Continue?")) {
          return;
        }
        setItems([{ ...item, quantity: 1, restaurantId: newRestaurantId, restaurantName: newRestaurantName }]);
        setRestaurantId(newRestaurantId);
        setRestaurantName(newRestaurantName);
        return;
      }

      setItems((prev) => {
        const existing = prev.find((i) => i._id === item._id);
        if (existing) {
          return prev.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i));
        }
        return [...prev, { ...item, quantity: 1, restaurantId: newRestaurantId, restaurantName: newRestaurantName }];
      });
      setRestaurantId(newRestaurantId);
      setRestaurantName(newRestaurantName);
    },
    [restaurantId]
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i._id !== itemId);
      if (newItems.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, quantity } : i)));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
