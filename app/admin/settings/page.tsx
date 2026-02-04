'use client';

import React, { useState, useEffect } from 'react';

interface ExtraFees {
    shipping_fee: number;
    packaging_fee: number;
    handling_fee: number;
    tax_percentage: number;
    free_shipping_threshold: number;
    is_active: boolean;
}

const DEFAULT_FEES: ExtraFees = {
    shipping_fee: 50,
    packaging_fee: 10,
    handling_fee: 0,
    tax_percentage: 0,
    free_shipping_threshold: 500,
    is_active: true,
};

export default function AdminSettingsPage() {
    const [fees, setFees] = useState<ExtraFees>(DEFAULT_FEES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        // For now, just use default fees until database is set up
        setLoading(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        // Simulate save - replace with actual API call when database is ready
        setTimeout(() => {
            setMessage({ type: 'success', text: 'Fees updated successfully!' });
            setSaving(false);
        }, 500);
    };

    const handleChange = (field: keyof ExtraFees, value: number | boolean) => {
        setFees(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="p-6 min-h-screen bg-gray-50">
                <div className="animate-pulse text-gray-600">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Extra Fees Settings</h1>
                
                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${
                        message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2 text-gray-700">Shipping & Delivery</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Shipping Fee (₹)
                            </label>
                            <input
                                type="number"
                                value={fees.shipping_fee}
                                onChange={(e) => handleChange('shipping_fee', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800"
                                min="0"
                                step="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Free Shipping Threshold (₹)
                            </label>
                            <input
                                type="number"
                                value={fees.free_shipping_threshold}
                                onChange={(e) => handleChange('free_shipping_threshold', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800"
                                min="0"
                                step="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2 text-gray-700">Additional Fees</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Packaging Fee (₹)
                            </label>
                            <input
                                type="number"
                                value={fees.packaging_fee}
                                onChange={(e) => handleChange('packaging_fee', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800"
                                min="0"
                                step="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Handling Fee (₹)
                            </label>
                            <input
                                type="number"
                                value={fees.handling_fee}
                                onChange={(e) => handleChange('handling_fee', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800"
                                min="0"
                                step="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tax Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={fees.tax_percentage}
                                onChange={(e) => handleChange('tax_percentage', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800"
                                min="0"
                                max="100"
                                step="0.1"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={fees.is_active}
                                onChange={(e) => handleChange('is_active', e.target.checked)}
                                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Enable extra fees</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-8">When disabled, no extra fees will be charged</p>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </div>
        </div>
    );
}
