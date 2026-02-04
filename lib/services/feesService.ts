/**
 * Fees Service for Pulp Fiction
 * Manages shipping and extra fees configuration
 */

import { supabase } from '../supabase';

export interface ExtraFees {
    id?: string;
    shipping_fee: number;
    packaging_fee: number;
    handling_fee: number;
    tax_percentage: number;
    free_shipping_threshold: number;
    is_active: boolean;
    updated_at?: string;
}

const DEFAULT_FEES: ExtraFees = {
    shipping_fee: 50,
    packaging_fee: 10,
    handling_fee: 0,
    tax_percentage: 0,
    free_shipping_threshold: 500,
    is_active: true,
};

/**
 * Get current fee configuration
 */
export const getFees = async (): Promise<ExtraFees> => {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('key', 'extra_fees')
            .single();

        if (error || !data) {
            console.log('Using default fees');
            return DEFAULT_FEES;
        }

        return data.value as ExtraFees;
    } catch (err) {
        console.error('Error fetching fees:', err);
        return DEFAULT_FEES;
    }
};

/**
 * Update fee configuration (admin only)
 */
export const updateFees = async (fees: ExtraFees): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'extra_fees',
                value: fees,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

        if (error) {
            console.error('Error updating fees:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Error updating fees:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Calculate total fees for an order
 */
export const calculateOrderFees = async (subtotal: number): Promise<{
    shipping: number;
    packaging: number;
    handling: number;
    tax: number;
    total: number;
}> => {
    const fees = await getFees();
    
    const shipping = subtotal >= fees.free_shipping_threshold ? 0 : fees.shipping_fee;
    const packaging = fees.packaging_fee;
    const handling = fees.handling_fee;
    const tax = (subtotal * fees.tax_percentage) / 100;
    
    return {
        shipping,
        packaging,
        handling,
        tax,
        total: shipping + packaging + handling + tax,
    };
};

export default {
    getFees,
    updateFees,
    calculateOrderFees,
};
