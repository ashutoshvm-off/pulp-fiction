import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface CartContextType {
  items: CartItem[];
  cartTotal: number;
  itemCount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load cart from database when user logs in
  useEffect(() => {
    if (user) {
      loadCartFromDB();
    } else {
      // Clear cart when user logs out
      setItems([]);
    }
  }, [user]);

  const loadCartFromDB = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error loading cart:', error);
        return;
      }

      if (data) {
        const cartItems: CartItem[] = data.map((item: any) => ({
          id: item.product_id,
          name: item.product_name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
        }));
        setItems(cartItems);
      }
    } catch (error) {
      console.error('Error loading cart from DB:', error);
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const addToCart = async (item: CartItem) => {
    if (!user) {
      // If not logged in, just add to local state
      setItems((prevItems) => {
        const existingItem = prevItems.find((i) => i.id === item.id);
        if (existingItem) {
          return prevItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          );
        }
        return [...prevItems, item];
      });
      return;
    }

    // Save to database
    try {
      const existingItem = items.find((i) => i.id === item.id);
      
      if (existingItem) {
        // Update existing item
        await supabase
          .from('shopping_cart')
          .update({ quantity: existingItem.quantity + item.quantity })
          .eq('user_id', user.id)
          .eq('product_id', item.id);
      } else {
        // Insert new item
        await supabase
          .from('shopping_cart')
          .insert({
            user_id: user.id,
            product_id: item.id,
            product_name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
          });
      }

      // Update local state
      setItems((prevItems) => {
        const existing = prevItems.find((i) => i.id === item.id);
        if (existing) {
          return prevItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          );
        }
        return [...prevItems, item];
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (user) {
      try {
        await supabase
          .from('shopping_cart')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', itemId);
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    }

    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    if (user) {
      try {
        await supabase
          .from('shopping_cart')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('product_id', itemId);
      } catch (error) {
        console.error('Error updating cart quantity:', error);
      }
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = async () => {
    if (user) {
      try {
        await supabase
          .from('shopping_cart')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }

    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, cartTotal, itemCount, addToCart, removeFromCart, updateQuantity, clearCart }}>
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
