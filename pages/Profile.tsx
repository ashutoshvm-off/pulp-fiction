import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders, Order, getStatusInfo } from '../lib/services/orderService';

export const Profile: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadOrders();
    }, [user, navigate]);

    const loadOrders = async () => {
        setLoadingOrders(true);
        const { orders: fetchedOrders } = await fetchUserOrders();
        setOrders(fetchedOrders);
        setLoadingOrders(false);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    if (!user) {
        return null;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">My Account</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${
                        activeTab === 'profile'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${
                        activeTab === 'orders'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Orders
                </button>
            </div>

            {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-primary">person</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{user.user_metadata?.full_name || 'User'}</h2>
                            <p className="text-gray-500">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Link to="/profile/addresses" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-600">location_on</span>
                                <span className="font-medium text-gray-900">Manage Addresses</span>
                            </div>
                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </Link>

                        <Link to="/subscription" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-600">autorenew</span>
                                <span className="font-medium text-gray-900">Subscriptions</span>
                            </div>
                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </Link>

                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-600">logout</span>
                                <span className="font-medium text-red-600">Sign Out</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-4">
                    {loadingOrders ? (
                        <div className="flex justify-center py-12">
                            <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">progress_activity</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">shopping_bag</span>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h3>
                            <p className="text-gray-500 mb-4">Start shopping to see your orders here.</p>
                            <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary-hover transition-colors">
                                Browse Shop
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                    ) : (
                        orders.map(order => {
                            const statusInfo = getStatusInfo(order.status);
                            return (
                                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    {/* Order Header */}
                                    <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Order #{order.order_number}</p>
                                            <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusInfo.bgColor}`}>
                                            <span className={`material-symbols-outlined text-sm ${statusInfo.color}`}>{statusInfo.icon}</span>
                                            <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="p-4">
                                        {order.items && order.items.length > 0 ? (
                                            <div className="space-y-3">
                                                {order.items.slice(0, 3).map(item => (
                                                    <div key={item.id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-gray-400">local_drink</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-900">₹{item.subtotal.toFixed(2)}</p>
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No items</p>
                                        )}
                                    </div>

                                    {/* Order Footer */}
                                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                                        <p className="text-sm font-bold text-gray-900">Total: ₹{order.total_amount.toFixed(2)}</p>
                                        <Link 
                                            to={`/order/${order.id}`}
                                            className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                                        >
                                            View Details
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};
