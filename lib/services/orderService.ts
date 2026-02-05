import { supabase, isSupabaseConfigured } from '../supabase';

export interface OrderItem {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    sugar_option?: string;
}

export interface Order {
    id: string;
    profile_id: string;
    order_number: string;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    total_amount: number;
    payment_method?: string;
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    notes?: string;
    created_at: string;
    updated_at: string;
    shipped_at?: string;
    delivered_at?: string;
    items?: OrderItem[];
}

export interface Subscription {
    id: string;
    profile_id: string;
    product_id: string;
    status: 'active' | 'paused' | 'cancelled';
    frequency: 'weekly' | 'biweekly' | 'monthly';
    quantity: number;
    unit_price: number;
    next_delivery_date?: string;
    cancelled_at?: string;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionDelivery {
    id: string;
    subscription_id: string;
    delivery_date: string;
    status: 'scheduled' | 'delivered' | 'skipped' | 'failed';
    created_at: string;
}

/**
 * Generate unique order number
 */
const generateOrderNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `ORD-${year}${month}${day}-${timestamp}`;
};

/**
 * Create a new order
 */
export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_number'>, items: OrderItem[]): Promise<Order> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const orderNumber = await generateOrderNumber();

    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            ...order,
            order_number: orderNumber,
        })
        .select()
        .single();

    if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
    }

    // Insert order items
    if (items.length > 0) {
        const itemsWithOrderId = items.map(item => ({
            ...item,
            order_id: orderData.id,
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            throw itemsError;
        }
    }

    // Order confirmation email removed - only welcome emails are supported
    console.log('✅ Order created successfully:', orderNumber);

    return {
        ...orderData,
        items,
    };
};

/**
 * Get order by ID with items
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError) {
        if (orderError.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching order:', orderError);
        throw orderError;
    }

    const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

    if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        throw itemsError;
    }

    return {
        ...orderData,
        items: itemsData || [],
    };
};

/**
 * Get all orders for a profile
 */
export const getOrdersByProfileId = async (profileId: string): Promise<Order[]> => {
    if (!isSupabaseConfigured()) {
        return [];
    }

    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
        (data || []).map(async (order) => {
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', order.id);

            if (itemsError) {
                console.error('Error fetching order items:', itemsError);
                return { ...order, items: [] };
            }

            return {
                ...order,
                items: itemsData || [],
            };
        })
    );

    return ordersWithItems;
};

/**
 * Alias for getOrdersByProfileId (for easier use)
 */
export const getOrdersByUser = getOrdersByProfileId;

/**
 * Update order status
 */
export const updateOrderStatus = async (
    orderId: string,
    status: Order['status'],
    paymentStatus?: Order['payment_status']
): Promise<Order | null> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (status === 'shipped') {
        updates.shipped_at = new Date().toISOString();
    } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
    }

    if (paymentStatus) {
        updates.payment_status = paymentStatus;
    }

    const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error('Error updating order:', error);
        throw error;
    }

    return getOrderById(orderId);
};

/**
 * Fetch all orders for the current user
 */
export const fetchUserOrders = async (): Promise<{ orders: Order[]; error: string | null }> => {
    if (!isSupabaseConfigured()) {
        return { orders: [], error: 'Supabase not configured' };
    }

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return { orders: [], error: error.message };
        }

        // Transform the data to include items
        const transformedOrders = (orders || []).map(order => ({
            ...order,
            items: order.order_items || []
        }));

        return { orders: transformedOrders, error: null };
    } catch (error) {
        console.error('Order fetch error:', error);
        return { orders: [], error: 'Failed to fetch orders' };
    }
};

/**
 * Fetch a single order by ID
 */
export const fetchOrderById = async (orderId: string): Promise<{ order: Order | null; error: string | null }> => {
    if (!isSupabaseConfigured()) {
        return { order: null, error: 'Supabase not configured' };
    }

    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .eq('id', orderId)
            .single();

        if (error) {
            console.error('Error fetching order:', error);
            return { order: null, error: error.message };
        }

        return {
            order: order ? { ...order, items: order.order_items || [] } : null,
            error: null
        };
    } catch (error) {
        console.error('Order fetch error:', error);
        return { order: null, error: 'Failed to fetch order' };
    }
};

/**
 * Get status display info (color, icon, label)
 */
export const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; bgColor: string; icon: string; label: string }> = {
        pending: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: 'schedule', label: 'Pending' },
        confirmed: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: 'check_circle', label: 'Confirmed' },
        shipped: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: 'local_shipping', label: 'Shipped' },
        delivered: { color: 'text-green-700', bgColor: 'bg-green-100', icon: 'done_all', label: 'Delivered' },
        cancelled: { color: 'text-red-700', bgColor: 'bg-red-100', icon: 'cancel', label: 'Cancelled' },
    };
    return statusMap[status] || statusMap.pending;
};

export default {
    fetchUserOrders,
    fetchOrderById,
    getStatusInfo,
};
