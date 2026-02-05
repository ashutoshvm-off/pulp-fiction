'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createOrder } from '@/lib/services/orderService';

interface UserProfile {
    full_name: string;
    email: string;
    phone?: string;
}

interface FeeSettings {
    shipping_fee: number;
    packaging_fee: number;
    tax_percentage: number;
    free_shipping_threshold: number;
    is_active: boolean;
}

const sugarLabels: Record<string, string> = {
    regular: 'Regular',
    extra_sugar: 'Extra Sweet',
    less_sugar: 'Less Sugar',
    no_sugar: 'No Sugar',
};

export default function Checkout() {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [fees, setFees] = useState<FeeSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUserProfile();
            fetchFeeSettings();
        } else {
            router.push('/login');
        }
    }, [user]);

    const fetchUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, email, phone')
                .eq('id', user?.id)
                .single();

            if (data) setProfile(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchFeeSettings = async () => {
        try {
            const { data } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'fee_settings')
                .single();

            if (data?.value) {
                setFees(data.value as FeeSettings);
            } else {
                setFees({
                    shipping_fee: 50,
                    packaging_fee: 10,
                    tax_percentage: 5,
                    free_shipping_threshold: 500,
                    is_active: true,
                });
            }
        } catch (err) {
            console.log('Using default fees');
            setFees({
                shipping_fee: 50,
                packaging_fee: 10,
                tax_percentage: 5,
                free_shipping_threshold: 500,
                is_active: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateFees = () => {
        if (!fees || !fees.is_active) {
            return { shipping: 0, packaging: 0, tax: 0, total: cartTotal };
        }

        const shipping = cartTotal >= fees.free_shipping_threshold ? 0 : fees.shipping_fee;
        const packaging = fees.packaging_fee;
        const tax = (cartTotal * fees.tax_percentage) / 100;
        const total = cartTotal + shipping + packaging + tax;

        return { shipping, packaging, tax, total };
    };

    const handlePlaceOrder = async () => {
        if (!user || !profile) return;

        setProcessing(true);
        try {
            const { total } = calculateFees();
            
            await createOrder(
                {
                    profile_id: user.id,
                    status: 'pending',
                    total_amount: total,
                    payment_status: 'pending',
                    payment_method: 'cod',
                },
                cart.map((item) => ({
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    subtotal: item.price * item.quantity,
                    sugar_option: item.sugar_option,
                }))
            );

            clearCart();
            router.push('/order-success');
        } catch (err) {
            console.error('Error placing order:', err);
            alert('Failed to place order. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <div className="animate-pulse text-amber-800">Loading checkout...</div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
                <button
                    onClick={() => router.push('/products')}
                    className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                >
                    Browse Products
                </button>
            </div>
        );
    }

    const { shipping, packaging, tax, total } = calculateFees();

    return (
        <div className="min-h-screen bg-amber-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500">Name</label>
                                <p className="font-medium text-gray-900">{profile?.full_name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500">Email</label>
                                <p className="font-medium text-gray-900">{profile?.email || user?.email}</p>
                            </div>
                            {profile?.phone && (
                                <div>
                                    <label className="block text-sm text-gray-500">Phone</label>
                                    <p className="font-medium text-gray-900">{profile.phone}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                            <p className="text-sm text-amber-800">
                                <strong>Delivery Note:</strong> We deliver to a single location. Your order will be delivered to our standard delivery address.
                            </p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
                        
                        <div className="space-y-3 mb-6">
                            {cart.map((item) => (
                                <div key={`${item.id}-${item.sugar_option}`} className="flex justify-between items-start py-2 border-b border-gray-100">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Qty: {item.quantity}
                                            {item.sugar_option && ` • ${sugarLabels[item.sugar_option] || item.sugar_option}`}
                                        </p>
                                    </div>
                                    <p className="font-medium text-gray-900">₹{item.price * item.quantity}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{cartTotal}</span>
                            </div>
                            {fees?.is_active && (
                                <>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping {shipping === 0 && <span className="text-green-600 text-xs">(Free)</span>}</span>
                                        <span>₹{shipping}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Packaging</span>
                                        <span>₹{packaging}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Tax ({fees.tax_percentage}%)</span>
                                        <span>₹{tax.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                                <span>Total</span>
                                <span className="text-amber-600">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={processing}
                            className="w-full mt-6 bg-amber-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Processing...' : 'Place Order'}
                        </button>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            Payment on delivery (Cash/UPI)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
