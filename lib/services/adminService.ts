import { supabase } from '../supabase';

export interface AdminOrderSummary {
  id: string;
  order_number: string;
  profile_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  items_count: number;
}

export interface AdminProductUpdate {
  product_id: string;
  name: string;
  price: number;
  is_available: boolean;
}

// Get all orders with customer details
export async function getAllOrders(): Promise<AdminOrderSummary[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        profile_id,
        total_amount,
        status,
        payment_status,
        created_at,
        profiles:profile_id(
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      profile_id: order.profile_id,
      customer_name: order.profiles?.full_name || 'Unknown',
      customer_email: order.profiles?.email || 'Unknown',
      total_amount: order.total_amount,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      items_count: 0, // Will be populated separately if needed
    }));
  } catch (error: any) {
    console.error('Error fetching orders:', error.message);
    throw error;
  }
}

// Get order details with items
export async function getOrderDetails(orderId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal,
          sugar_option
        ),
        profiles:profile_id(
          email,
          full_name,
          phone
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching order details:', error.message);
    throw error;
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
        shipped_at: status === 'shipped' ? new Date().toISOString() : null,
        delivered_at: status === 'delivered' ? new Date().toISOString() : null,
      })
      .eq('id', orderId)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error: any) {
    console.error('Error updating order status:', error.message);
    throw error;
  }
}

// Get total user count
export async function getTotalUserCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error: any) {
    console.error('Error fetching user count:', error.message);
    throw error;
  }
}

// Get user statistics
export async function getUserStats() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at');

    if (error) throw error;

    const totalUsers = data?.length || 0;

    // Calculate new users this month
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const newUsersThisMonth = data?.filter((profile: any) => {
      const createdDate = new Date(profile.created_at);
      return createdDate > monthAgo;
    }).length || 0;

    return {
      totalUsers,
      newUsersThisMonth,
    };
  } catch (error: any) {
    console.error('Error fetching user stats:', error.message);
    throw error;
  }
}

// Get order statistics
export async function getOrderStats() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount, created_at, status');

    if (error) throw error;

    const totalOrders = data?.length || 0;
    const totalRevenue = data?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0;

    // Calculate this month's revenue
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const monthlyRevenue = data
      ?.filter((order: any) => new Date(order.created_at) > monthAgo)
      .reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0;

    return {
      totalOrders,
      totalRevenue,
      monthlyRevenue,
    };
  } catch (error: any) {
    console.error('Error fetching order stats:', error.message);
    throw error;
  }
}

// Store admin product data in a custom table
// You'll need to create this table in your database:
// CREATE TABLE IF NOT EXISTS products_admin (
//   id TEXT PRIMARY KEY,
//   name TEXT NOT NULL,
//   price DECIMAL(10, 2) NOT NULL,
//   is_available BOOLEAN DEFAULT TRUE,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

export async function getProductsForAdmin() {
  try {
    // Try to fetch from admin products table, fall back to local data if not available
    const { data, error } = await supabase
      .from('products_admin')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Note: products_admin table not found, using local data:', error.message);
    return [];
  }
}

export async function updateProduct(productId: string, updates: Partial<AdminProductUpdate>) {
  try {
    const { data, error } = await supabase
      .from('products_admin')
      .upsert({
        id: productId,
        name: updates.name,
        price: updates.price,
        is_available: updates.is_available,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error: any) {
    console.error('Error updating product:', error.message);
    throw error;
  }
}
