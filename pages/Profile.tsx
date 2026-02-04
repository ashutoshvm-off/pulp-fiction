import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { uploadAvatar, upsertAddress, deleteAddress } from '../lib/services/profileService';
import { getAddressFromCoordinates } from '../lib/services/locationService';
import { getOrdersByUser, Order } from '../lib/services/orderService';
import type { Address } from '../types';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { profile, addresses, isLoading, isConfigured, updateProfile, refreshAddresses } = useProfile();
    const { user, loading: authLoading, signOut } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        phone: ''
    });

    const [addressForm, setAddressForm] = useState<Address>({
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        label: 'home',
        is_default: false
    });

    useEffect(() => {
        // Update form data when profile or user changes
        if (profile) {
            setFormData({
                email: profile.email,
                full_name: profile.full_name || '',
                phone: profile.phone || ''
            });
        } else if (user) {
            setFormData({
                email: user.email || '',
                full_name: user.user_metadata?.full_name || '',
                phone: user.user_metadata?.phone || ''
            });
        }
    }, [profile, user]);

    // Load user orders
    useEffect(() => {
        const loadOrders = async () => {
            if (!user?.id) return;
            setLoadingOrders(true);
            try {
                const userOrders = await getOrdersByUser(user.id);
                setOrders(userOrders);
            } catch (error) {
                console.error('Failed to load orders:', error);
            } finally {
                setLoadingOrders(false);
            }
        };
        loadOrders();
    }, [user?.id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setAddressForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveProfile = async () => {
        if (!isConfigured) {
            alert('Supabase is not configured. Please add your credentials to .env.local');
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile({
                email: formData.email,
                full_name: formData.full_name,
                phone: formData.phone
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const profileId = profile?.id || user?.id;
        if (!file || !profileId) return;

        try {
            const avatarUrl = await uploadAvatar(file, profileId);
            await updateProfile({
                ...(profile || { email: user?.email || '' }),
                id: profileId,
                avatar_url: avatarUrl
            });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload avatar. Please try again.');
        }
    };

    const handleSaveAddress = async () => {
        const profileId = profile?.id || user?.id;
        if (!profileId) return;

        try {
            const addressData = {
                ...addressForm,
                profile_id: profileId
            };

            if (editingAddress?.id) {
                addressData.id = editingAddress.id;
            }

            await upsertAddress(addressData);
            await refreshAddresses();
            setShowAddressForm(false);
            setEditingAddress(null);
            setAddressForm({
                address_line1: '',
                address_line2: '',
                city: '',
                state: '',
                postal_code: '',
                country: 'India',
                label: 'home',
                is_default: false
            });
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Failed to save address. Please try again.');
        }
    };

    const handleUseMyLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            const address = await getAddressFromCoordinates(latitude, longitude);

            if (address) {
                setAddressForm(prev => ({
                    ...prev,
                    address_line1: address.address_line1 || prev.address_line1,
                    address_line2: address.address_line2 || '',
                    city: address.city || prev.city,
                    state: address.state || prev.state,
                    postal_code: address.postal_code || prev.postal_code,
                    country: address.country || 'India'
                }));
            }
        } catch (error: any) {
            console.error('Error getting location:', error);
            if (error.code === 1) {
                alert('Location access denied. Please enable location permissions.');
            } else if (error.code === 2) {
                alert('Unable to determine your location. Please try again.');
            } else if (error.code === 3) {
                alert('Location request timed out. Please try again.');
            } else {
                alert('Failed to get your location. Please enter address manually.');
            }
        } finally {
            setGettingLocation(false);
        }
    };

    const handleEditAddress = (address: Address) => {
        setEditingAddress(address);
        setAddressForm(address);
        setShowAddressForm(true);
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            await deleteAddress(addressId);
            await refreshAddresses();
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Failed to delete address. Please try again.');
        }
    };

    if (!isConfigured) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">Supabase Not Configured</h2>
                    <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                        To use the profile feature, you need to configure Supabase. Please add your Supabase credentials to <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">.env.local</code>
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">
                        See <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">.env.local.example</code> and <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">supabase-schema.sql</code> for setup instructions.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="flex items-center justify-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="ml-4 text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    // Show loading while auth is initializing
    if (authLoading) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="flex items-center justify-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    <p className="ml-4 text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Only show sign-in prompt if user is NOT authenticated
    if (!user) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-8 text-center">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4">account_circle</span>
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Welcome to Your Profile</h2>
                    <p className="text-text-muted dark:text-gray-400 mb-6">Sign in or create an account to view and manage your profile</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-3 bg-primary hover:bg-primary-hover text-text-main font-bold rounded-lg transition-all"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all"
                        >
                            Create Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // User is authenticated but profile might still be loading or missing
    // Create a temporary profile from user data if profile is null
    const displayProfile = profile || {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || '',
    };

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Info Card */}
                <div className="lg:col-span-2 bg-[#1a2e1a] rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Personal Information</h2>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-text-main font-semibold rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">edit</span>
                                Edit
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200 dark:border-[#2a3f23]">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-[#ebf3e7] dark:bg-[#2a3f23] flex items-center justify-center overflow-hidden">
                                {displayProfile.avatar_url ? (
                                    <img src={displayProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-5xl text-primary">account_circle</span>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-hover transition-all">
                                <span className="material-symbols-outlined text-sm text-text-main">photo_camera</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{displayProfile.full_name || 'Add your name'}</h3>
                            <p className="text-gray-300">{displayProfile.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="block w-full rounded-lg border border-[#3a4f33] bg-[#243824] text-white py-3 px-4 disabled:opacity-50 placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder="Enter your full name"
                                className="block w-full rounded-lg border border-[#3a4f33] bg-[#243824] text-white py-3 px-4 disabled:opacity-50 placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder="Enter your phone number"
                                className="block w-full rounded-lg border border-[#3a4f33] bg-[#243824] text-white py-3 px-4 disabled:opacity-50 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-text-main font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        email: profile.email,
                                        full_name: profile.full_name || '',
                                        phone: profile.phone || ''
                                    });
                                }}
                                className="px-6 py-3 bg-gray-200 dark:bg-[#2a3f23] text-text-main dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-[#3a4f33] transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                    <div className="bg-[#1a2e1a] rounded-2xl shadow-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Account Stats</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Saved Addresses</span>
                                <span className="font-bold text-primary">{addresses.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Orders</span>
                                <span className="font-bold text-primary">0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Addresses */}
            <div className="mt-8 bg-[#1a2e1a] rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Saved Addresses</h2>
                    <button
                        onClick={() => {
                            setShowAddressForm(true);
                            setEditingAddress(null);
                            setAddressForm({
                                address_line1: '',
                                address_line2: '',
                                city: '',
                                state: '',
                                postal_code: '',
                                country: 'India',
                                label: 'home',
                                is_default: false
                            });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-text-main font-semibold rounded-lg transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Address
                    </button>
                </div>

                {showAddressForm && (
                    <div className="mb-6 p-6 bg-[#243824] rounded-xl border border-[#2a3f23]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">
                                {editingAddress ? 'Edit Address' : 'New Address'}
                            </h3>
                            <button
                                type="button"
                                onClick={handleUseMyLocation}
                                disabled={gettingLocation}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {gettingLocation ? 'sync' : 'my_location'}
                                </span>
                                {gettingLocation ? 'Getting Location...' : 'Use My Location'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-white mb-2">Label</label>
                                <select
                                    name="label"
                                    value={addressForm.label}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border border-[#3a4f33] bg-[#2a3f23] text-white py-3 px-4"
                                >
                                    <option value="home">Home</option>
                                    <option value="work">Work</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-white mb-2">Address Line 1</label>
                                <input
                                    type="text"
                                    name="address_line1"
                                    value={addressForm.address_line1}
                                    onChange={handleAddressInputChange}
                                    placeholder="Street address"
                                    className="block w-full rounded-lg border border-[#3a4f33] bg-[#2a3f23] text-white py-3 px-4 placeholder-gray-400"
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-white mb-2">Address Line 2 (Optional)</label>
                                <input
                                    type="text"
                                    name="address_line2"
                                    value={addressForm.address_line2 || ''}
                                    onChange={handleAddressInputChange}
                                    placeholder="Apartment, suite, etc."
                                    className="block w-full rounded-lg border border-[#3a4f33] bg-[#2a3f23] text-white py-3 px-4 placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={addressForm.city || ''}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border border-[#3a4f33] bg-[#2a3f23] text-white py-3 px-4 placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={addressForm.state || ''}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border border-[#3a4f33] bg-[#2a3f23] text-white py-3 px-4 placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">Postal Code</label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    value={addressForm.postal_code || ''}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border border-[#3a4f33] bg-[#2a3f23] text-white py-3 px-4 placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={addressForm.country || 'India'}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border border-[#3a4f33] bg-[#2a3f23] text-white py-3 px-4 placeholder-gray-400"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="is_default"
                                        checked={addressForm.is_default}
                                        onChange={handleAddressInputChange}
                                        className="w-4 h-4 text-primary rounded"
                                    />
                                    <span className="text-sm font-semibold text-white">Set as default address</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleSaveAddress}
                                className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-text-main font-bold rounded-lg transition-all"
                            >
                                Save Address
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddressForm(false);
                                    setEditingAddress(null);
                                }}
                                className="px-6 py-3 bg-gray-200 dark:bg-[#2a3f23] text-text-main dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-[#3a4f33] transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 && !showAddressForm && (
                        <div className="col-span-2 text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">location_on</span>
                            <p className="text-gray-300">No saved addresses yet</p>
                        </div>
                    )}

                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className="p-4 bg-[#243824] rounded-xl border border-[#2a3f23] relative"
                        >
                            {address.is_default && (
                                <span className="absolute top-2 right-2 px-2 py-1 bg-primary text-text-main text-xs font-bold rounded">
                                    Default
                                </span>
                            )}
                            <div className="flex items-start gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white capitalize">{address.label}</h4>
                                    <p className="text-sm text-gray-300 mt-1">
                                        {address.address_line1}
                                        {address.address_line2 && `, ${address.address_line2}`}
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        {address.city}, {address.state} {address.postal_code}
                                    </p>
                                    <p className="text-sm text-gray-300">{address.country}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditAddress(address)}
                                    className="flex items-center gap-1 px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                    Edit
                                </button>
                                <button
                                    onClick={() => address.id && handleDeleteAddress(address.id)}
                                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order History */}
            <div className="mt-8 bg-[#1a2e1a] rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">receipt_long</span>
                    Order History
                </h2>

                {loadingOrders ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">progress_activity</span>
                        <p className="text-gray-300 mt-2">Loading orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">shopping_bag</span>
                        <p className="text-gray-300">No orders yet</p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="mt-4 px-6 py-2 bg-primary hover:bg-primary-hover text-text-main font-semibold rounded-lg transition-all"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="p-4 bg-[#243824] rounded-xl border border-[#2a3f23]"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="font-bold text-white">{order.order_number}</h4>
                                        <p className="text-sm text-gray-400">
                                            {new Date(order.created_at || '').toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary text-lg">₹{order.total_amount.toFixed(2)}</p>
                                        <span className={`inline-block px-2 py-1 text-xs font-bold rounded capitalize ${
                                            order.status === 'delivered' ? 'bg-green-600 text-white' :
                                            order.status === 'shipped' ? 'bg-blue-600 text-white' :
                                            order.status === 'confirmed' ? 'bg-yellow-600 text-white' :
                                            order.status === 'cancelled' ? 'bg-red-600 text-white' :
                                            'bg-gray-600 text-white'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                                {order.items && order.items.length > 0 && (
                                    <div className="border-t border-[#2a3f23] pt-3 mt-3">
                                        <p className="text-sm text-gray-400 mb-2">Items:</p>
                                        <div className="space-y-1">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-300">{item.product_name} x{item.quantity}</span>
                                                    <span className="text-white">₹{item.subtotal.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {order.notes && (
                                    <p className="text-xs text-gray-400 mt-2 truncate">📍 {order.notes}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
