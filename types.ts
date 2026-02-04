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

export interface UserProfile {
  id?: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Address {
  id?: string;
  profile_id?: string;
  label?: string;
  address_line1: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
  created_at?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  created_at?: string;
}

export interface Order {
  id?: string;
  profile_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address_id?: string;
  billing_address_id?: string;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  items?: OrderItem[];
}

export interface Subscription {
  id?: string;
  profile_id: string;
  status: 'active' | 'paused' | 'cancelled';
  frequency: 'weekly' | 'biweekly' | 'monthly';
  next_delivery_date?: string;
  box_customization?: Record<string, unknown>;
  total_price: number;
  billing_address_id?: string;
  created_at?: string;
  updated_at?: string;
  cancelled_at?: string;
}

export interface SubscriptionDelivery {
  id?: string;
  subscription_id: string;
  order_id?: string;
  delivery_date: string;
  status: 'pending' | 'shipped' | 'delivered' | 'failed';
  created_at?: string;
}
