'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    sugar_option?: string;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total_amount: number;
    created_at: string;
    profiles?: {
        full_name: string;
        email: string;
        phone?: string;
    };
    items: OrderItem[];
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const sugarLabels: Record<string, string> = {
    regular: 'Regular Sugar',
    extra_sugar: 'Extra Sweet',
    less_sugar: 'Less Sugar',
    no_sugar: 'No Sugar',
};

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchOrder(params.id as string);
        }
    }, [params.id]);

    const fetchOrder = async (orderId: string) => {
        setLoading(true);
        try {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select(`
                    *,
                    profiles:profile_id (full_name, email, phone)
                `)
                .eq('id', orderId)
                .single();

            if (orderError) throw orderError;

            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderId);

            if (itemsError) throw itemsError;

            setOrder({
                ...orderData,
                items: itemsData || [],
            });
        } catch (err) {
            console.error('Error fetching order:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        if (!order) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', order.id);

            if (error) throw error;
            setOrder({ ...order, status: newStatus });
        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 min-h-screen bg-gray-50">
                <div className="animate-pulse">Loading order...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-6 min-h-screen bg-gray-50">
                <p className="text-red-600">Order not found</p>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-gray-900 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Order {order.order_number}</h1>
                </div>

                {/* Order Status */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Order Status</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {['confirmed', 'shipped', 'delivered'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => updateStatus(status)}
                                    disabled={updating || order.status === status}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        order.status === status
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-amber-500 text-white hover:bg-amber-600'
                                    }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium text-gray-800">{order.profiles?.full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-800">{order.profiles?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-800">{order.profiles?.phone || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h2>
                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                        {item.sugar_option && (
                                            <span className="text-sm px-2 py-1 bg-amber-100 text-amber-800 rounded">
                                                {sugarLabels[item.sugar_option] || item.sugar_option}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">₹{item.unit_price} each</p>
                                    <p className="font-semibold text-gray-900">₹{item.subtotal}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t mt-4 pt-4 flex justify-between">
                        <span className="text-lg font-semibold text-gray-800">Total</span>
                        <span className="text-xl font-bold text-amber-600">₹{order.total_amount}</span>
                    </div>
                </div>

                {/* Order Timeline */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Order Date</p>
                            <p className="font-medium text-gray-800">
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Payment Status</p>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                                order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
