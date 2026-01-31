export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'juice' | 'smoothie' | 'shot' | 'snack' | 'bundle';
  ingredients?: string[];
  benefits?: string[];
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestSeller?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOption?: string; // e.g. "12oz", "Standard"
}

export interface SubscriptionBoxItem extends Product {
  quantity: number;
}

export type Frequency = 'weekly' | 'biweekly' | 'monthly';

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  title: string;
  content: string;
}
