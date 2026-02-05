import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeliverySession, logoutDeliveryAgent, DeliverySession } from '../lib/services/deliveryAuthService';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  notes: string;
  created_at: string;
}

export const DeliveryDashboard: React.FC = () => {
  const [agent, setAgent] = useState<DeliverySession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const session = getDeliverySession();
    if (!session) {
      navigate('/delivery-login');
      return;
    }
    setAgent(session);
    loadOrders();
  }, [navigate]);

  // Real-time subscription for orders - instant sync with admin changes
  useEffect(() => {
    const channel = supabase
      .channel('delivery-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order changed:', payload);
          loadOrders(false); // Silent refresh
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-refresh every 15 seconds as backup
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(false); // Silent refresh
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          payment_status,
          payment_method,
          notes,
          created_at,
          profiles:profile_id (full_name, phone, email)
        `)
        .in('status', ['pending', 'confirmed', 'shipped', 'delivered'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.profiles?.full_name || 'Unknown',
        customer_phone: order.profiles?.phone || 'N/A',
        total_amount: order.total_amount,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        notes: order.notes,
        created_at: order.created_at,
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handlePaymentCollected = async (orderId: string) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'paid' } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: 'paid' });
      }
    } catch (err) {
      console.error('Error updating payment:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logoutDeliveryAgent();
      navigate('/delivery-login');
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">local_shipping</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Delivery Dashboard</h1>
              <p className="text-sm text-gray-600">{agent?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadOrders}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <span className="material-symbols-outlined text-gray-600">refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg transition"
              title="Logout"
            >
              <span className="material-symbols-outlined text-red-600">logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          {(['all', 'pending', 'confirmed', 'shipped', 'delivered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition whitespace-nowrap ${
                filter === f
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                  {orders.filter(o => o.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-4xl mx-auto p-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-300">inventory_2</span>
            <p className="mt-4 text-gray-600">No orders to display</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  selectedOrder?.id === order.id ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200'
                }`}
              >
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₹{order.total_amount.toFixed(2)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedOrder?.id === order.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                    {/* Contact Info */}
                    <div className="flex items-center gap-3">
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium"
                      >
                        <span className="material-symbols-outlined">call</span>
                        {order.customer_phone}
                      </a>
                    </div>

                    {/* Address */}
                    {order.notes && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                        <p className="text-sm text-gray-900">{order.notes}</p>
                      </div>
                    )}

                    {/* Payment Status */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">Payment</p>
                        <p className="font-medium text-gray-900">
                          {order.payment_method?.toUpperCase()} - 
                          <span className={order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                            {' '}{order.payment_status}
                          </span>
                        </p>
                      </div>
                      {order.payment_status !== 'paid' && order.payment_method === 'cod' && (
                        <button
                          onClick={() => handlePaymentCollected(order.id)}
                          disabled={updating === order.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                          {updating === order.id ? (
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">payments</span>
                          )}
                          Collected
                        </button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          disabled={updating === order.id}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          {updating === order.id ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined">check</span>
                          )}
                          Confirm Order
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'shipped')}
                          disabled={updating === order.id}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          {updating === order.id ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined">local_shipping</span>
                          )}
                          Out for Delivery
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          disabled={updating === order.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          {updating === order.id ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined">check_circle</span>
                          )}
                          Mark Delivered
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <div className="flex-1 bg-green-100 text-green-800 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined">verified</span>
                          Delivered Successfully
                        </div>
                      )}
                    </div>

                    {/* Order Time */}
                    <p className="text-xs text-gray-500 text-center">
                      Ordered: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
