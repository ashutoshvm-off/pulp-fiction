import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, SubscriptionBoxItem, Frequency } from '../types';

interface SubscriptionContextType {
  boxItems: SubscriptionBoxItem[];
  addToBox: (product: Product) => void;
  removeFromBox: (productId: string) => void;
  updateBoxQuantity: (productId: string, quantity: number) => void;
  frequency: Frequency;
  setFrequency: (freq: Frequency) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  boxTotal: number;
  itemsCount: number;
  BOX_CAPACITY: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [boxItems, setBoxItems] = useState<SubscriptionBoxItem[]>([]);
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  const BOX_CAPACITY = 12;

  const itemsCount = boxItems.reduce((total, item) => total + item.quantity, 0);

  const addToBox = (product: Product) => {
    if (itemsCount >= BOX_CAPACITY) return;
    
    setBoxItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromBox = (productId: string) => {
    setBoxItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateBoxQuantity = (productId: string, quantity: number) => {
    // Check if increasing quantity would exceed capacity
    const currentItem = boxItems.find(item => item.id === productId);
    const diff = quantity - (currentItem?.quantity || 0);
    
    if (itemsCount + diff > BOX_CAPACITY) return;

    if (quantity < 1) {
      removeFromBox(productId);
      return;
    }
    
    setBoxItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const boxTotal = boxItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <SubscriptionContext.Provider value={{ 
      boxItems, addToBox, removeFromBox, updateBoxQuantity, 
      frequency, setFrequency, startDate, setStartDate,
      boxTotal, itemsCount, BOX_CAPACITY
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
};
