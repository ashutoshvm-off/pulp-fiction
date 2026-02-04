import { supabase, isSupabaseConfigured } from '../supabase';

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
 * Create a subscription
 */
export const createSubscription = async (subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscription)
        .select()
        .single();

    if (error) {
        console.error('Error creating subscription:', error);
        throw error;
    }

    return data;
};

/**
 * Get subscriptions for a profile
 */
export const getSubscriptionsByProfileId = async (profileId: string): Promise<Subscription[]> => {
    if (!isSupabaseConfigured()) {
        return [];
    }

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
    }

    return data || [];
};

/**
 * Update subscription
 */
export const updateSubscription = async (subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription | null> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('subscriptions')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .select()
        .single();

    if (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }

    return data;
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (subscriptionId: string): Promise<Subscription | null> => {
    return updateSubscription(subscriptionId, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
    });
};

/**
 * Create subscription delivery
 */
export const createSubscriptionDelivery = async (delivery: Omit<SubscriptionDelivery, 'id' | 'created_at'>): Promise<SubscriptionDelivery> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('subscription_deliveries')
        .insert(delivery)
        .select()
        .single();

    if (error) {
        console.error('Error creating subscription delivery:', error);
        throw error;
    }

    return data;
};

/**
 * Get subscription deliveries
 */
export const getSubscriptionDeliveries = async (subscriptionId: string): Promise<SubscriptionDelivery[]> => {
    if (!isSupabaseConfigured()) {
        return [];
    }

    const { data, error } = await supabase
        .from('subscription_deliveries')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('delivery_date', { ascending: true });

    if (error) {
        console.error('Error fetching subscription deliveries:', error);
        throw error;
    }

    return data || [];
};

/**
 * Update subscription delivery status
 */
export const updateSubscriptionDeliveryStatus = async (
    deliveryId: string,
    status: SubscriptionDelivery['status']
): Promise<SubscriptionDelivery | null> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('subscription_deliveries')
        .update({ status })
        .eq('id', deliveryId)
        .select()
        .single();

    if (error) {
        console.error('Error updating subscription delivery:', error);
        throw error;
    }

    return data;
};
