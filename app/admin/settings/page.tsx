'use client';

import React, { useState, useEffect } from 'react';

interface FeeSettings {
    shipping_fee: number;
    packaging_fee: number;
    tax_percentage: number;
    free_shipping_threshold: number;
    is_active: boolean;
}

const DEFAULT_FEES: FeeSettings = {
    shipping_fee: 50,
    packaging_fee: 10,
    tax_percentage: 5,
    free_shipping_threshold: 500,
    is_active: true,
};

export default function AdminSettingsPage() {
    const [fees, setFees] = useState<FeeSettings>(DEFAULT_FEES);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        // For now, just simulate saving (localStorage)
        try {
            localStorage.setItem('fee_settings', JSON.stringify(fees));
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem('fee_settings');
        if (saved) {
            try {
                setFees(JSON.parse(saved));
            } catch {}
        }
    }, []);

    const handleChange = (field: keyof FeeSettings, value: number | boolean) => {
        setFees(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Fee Management</h1>
                
                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${
                        message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2 text-gray-700">Delivery Fees</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Shipping Fee (₹)
                            </label>
                            <input
                                type="number"
                                value={fees.shipping_fee}
                                onChange={(e) => handleChange('shipping_fee', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-800"
                                min="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">Base delivery charge</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Free Shipping Above (₹)
                            </label>
                            <input
                                type="number"
                                value={fees.free_shipping_threshold}
                                onChange={(e) => handleChange('free_shipping_threshold', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-800"
                                min="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2 text-gray-700">Additional Charges</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Packaging Fee (₹)
                            </label>
                            <input
                                type="number"
                                value={fees.packaging_fee}
                                onChange={(e) => handleChange('packaging_fee', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-800"
                                min="0"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-800"
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
                                className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Enable extra fees</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-8">When disabled, only product prices are charged</p>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </div>
        </div>
    );
}
