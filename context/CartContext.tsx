import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
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
        const cartItems: CartItem[] = data.map((item: any) => {
          // Robust price parsing with fallback
          let parsedPrice = 0;
          if (typeof item.price === 'number') {
            parsedPrice = item.price;
          } else if (typeof item.price === 'string') {
            const parsed = parseFloat(item.price);
            parsedPrice = isNaN(parsed) ? 0 : parsed;
          }

          return {
            id: item.product_id,
            name: item.product_name,
            price: parsedPrice,
            image: item.image,
            category: item.category || 'juice',
            quantity: item.quantity || 1,
            description: item.description || '',
            rating: item.rating || 0,
            reviews: item.reviews || 0,
          };
        });
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
    // Validate price to prevent NaN
    const validPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;

    if (validPrice === 0) {
      toast.error('Invalid product price');
      console.error('Invalid price for item:', item);
      return;
    }

    const validatedItem = {
      ...item,
      price: validPrice,
      quantity: item.quantity || 1
    };

    if (!user) {
      // If not logged in, just add to local state
      setItems((prevItems) => {
        const existingItem = prevItems.find((i) => i.id === validatedItem.id);
        if (existingItem) {
          toast.success(`Updated ${validatedItem.name} quantity in cart`);
          return prevItems.map((i) =>
            i.id === validatedItem.id ? { ...i, quantity: i.quantity + validatedItem.quantity } : i
          );
        }
        toast.success(`${validatedItem.name} added to cart!`);
        return [...prevItems, validatedItem];
      });
      return;
    }

    // Save to database
    try {
      const existingItem = items.find((i) => i.id === validatedItem.id);

      if (existingItem) {
        // Update existing item
        await supabase
          .from('shopping_cart')
          .update({ quantity: existingItem.quantity + validatedItem.quantity })
          .eq('user_id', user.id)
          .eq('product_id', validatedItem.id);

        toast.success(`Updated ${validatedItem.name} quantity in cart`);
      } else {
        // Insert new item
        await supabase
          .from('shopping_cart')
          .insert({
            user_id: user.id,
            product_id: validatedItem.id,
            product_name: validatedItem.name,
            price: validatedItem.price,
            image: validatedItem.image,
            category: validatedItem.category,
            description: validatedItem.description,
            rating: validatedItem.rating,
            reviews: validatedItem.reviews,
            quantity: validatedItem.quantity,
          });

        toast.success(`${validatedItem.name} added to cart!`);
      }

      // Update local state
      setItems((prevItems) => {
        const existing = prevItems.find((i) => i.id === validatedItem.id);
        if (existing) {
          return prevItems.map((i) =>
            i.id === validatedItem.id ? { ...i, quantity: i.quantity + validatedItem.quantity } : i
          );
        }
        return [...prevItems, validatedItem];
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
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
