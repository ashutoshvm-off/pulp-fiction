import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { uploadAvatar, upsertAddress, deleteAddress } from '../lib/services/profileService';
import type { Address } from '../types';

export const Profile: React.FC = () => {
    const { profile, addresses, isLoading, isConfigured, updateProfile, refreshAddresses, logout } = useProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const [formData, setFormData] = useState({
        email: profile?.email || '',
        full_name: profile?.full_name || '',
        phone: profile?.phone || ''
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
        if (profile) {
            setFormData({
                email: profile.email,
                full_name: profile.full_name || '',
                phone: profile.phone || ''
            });
        }
    }, [profile]);

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
        if (!file || !profile?.id) return;

        try {
            const avatarUrl = await uploadAvatar(file, profile.id);
            await updateProfile({
                ...profile,
                avatar_url: avatarUrl
            });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload avatar. Please try again.');
        }
    };

    const handleSaveAddress = async () => {
        if (!profile?.id) return;

        try {
            const addressData = {
                ...addressForm,
                profile_id: profile.id
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

    const handleLoginPrompt = () => {
        const email = prompt('Enter your email to view/create your profile:');
        if (email) {
            updateProfile({ email });
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

    if (!profile) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-8 text-center">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4">account_circle</span>
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Welcome to Your Profile</h2>
                    <p className="text-text-muted dark:text-gray-400 mb-6">Sign in with your email to view and manage your profile</p>
                    <button
                        onClick={handleLoginPrompt}
                        className="px-6 py-3 bg-primary hover:bg-primary-hover text-text-main font-bold rounded-lg transition-all"
                    >
                        Sign In / Create Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-text-main dark:text-white">My Profile</h1>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Info Card */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text-main dark:text-white">Personal Information</h2>
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
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
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
                            <h3 className="text-xl font-bold text-text-main dark:text-white">{profile.full_name || 'Add your name'}</h3>
                            <p className="text-text-muted dark:text-gray-400">{profile.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4 disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder="Enter your full name"
                                className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4 disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                placeholder="Enter your phone number"
                                className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4 disabled:opacity-50"
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
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-6">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Account Stats</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-text-muted dark:text-gray-400">Saved Addresses</span>
                                <span className="font-bold text-primary">{addresses.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-text-muted dark:text-gray-400">Orders</span>
                                <span className="font-bold text-primary">0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Addresses */}
            <div className="mt-8 bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-main dark:text-white">Saved Addresses</h2>
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
                    <div className="mb-6 p-6 bg-[#f9fcf8] dark:bg-background-dark rounded-xl border border-[#ebf3e7] dark:border-[#2a3f23]">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">
                            {editingAddress ? 'Edit Address' : 'New Address'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Label</label>
                                <select
                                    name="label"
                                    value={addressForm.label}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                                >
                                    <option value="home">Home</option>
                                    <option value="work">Work</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Address Line 1</label>
                                <input
                                    type="text"
                                    name="address_line1"
                                    value={addressForm.address_line1}
                                    onChange={handleAddressInputChange}
                                    placeholder="Street address"
                                    className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Address Line 2 (Optional)</label>
                                <input
                                    type="text"
                                    name="address_line2"
                                    value={addressForm.address_line2 || ''}
                                    onChange={handleAddressInputChange}
                                    placeholder="Apartment, suite, etc."
                                    className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={addressForm.city || ''}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={addressForm.state || ''}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Postal Code</label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    value={addressForm.postal_code || ''}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={addressForm.country || 'India'}
                                    onChange={handleAddressInputChange}
                                    className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
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
                                    <span className="text-sm font-semibold text-text-main dark:text-gray-300">Set as default address</span>
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
                            <span className="material-symbols-outlined text-6xl text-text-muted dark:text-gray-600 mb-4">location_on</span>
                            <p className="text-text-muted dark:text-gray-400">No saved addresses yet</p>
                        </div>
                    )}

                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            className="p-4 bg-[#f9fcf8] dark:bg-background-dark rounded-xl border border-[#ebf3e7] dark:border-[#2a3f23] relative"
                        >
                            {address.is_default && (
                                <span className="absolute top-2 right-2 px-2 py-1 bg-primary text-text-main text-xs font-bold rounded">
                                    Default
                                </span>
                            )}
                            <div className="flex items-start gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                <div className="flex-1">
                                    <h4 className="font-bold text-text-main dark:text-white capitalize">{address.label}</h4>
                                    <p className="text-sm text-text-muted dark:text-gray-400 mt-1">
                                        {address.address_line1}
                                        {address.address_line2 && `, ${address.address_line2}`}
                                    </p>
                                    <p className="text-sm text-text-muted dark:text-gray-400">
                                        {address.city}, {address.state} {address.postal_code}
                                    </p>
                                    <p className="text-sm text-text-muted dark:text-gray-400">{address.country}</p>
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
        </div>
    );
};
