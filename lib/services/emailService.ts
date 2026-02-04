import { supabase, isSupabaseConfigured } from '../supabase';

/**
 * Email Service for Pulp Fiction
 * 
 * This service sends emails via Supabase Edge Functions.
 * For production, deploy the Edge Function in /supabase/functions/send-email
 * 
 * Development mode will log emails to console instead of sending.
 */

export interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

type EmailType = 'welcome' | 'otp' | 'order_confirmation' | 'subscription_confirmation';

interface EmailData {
    [key: string]: unknown;
}

const isDevelopment = import.meta.env.DEV;

/**
 * Send email via Supabase Edge Function
 */
const sendEmail = async (
    type: EmailType,
    to: string,
    data: EmailData
): Promise<{ success: boolean; error?: string }> => {
    // In development, just log the email
    if (isDevelopment) {
        console.log('📧 [DEV MODE] Email would be sent:');
        console.log('  Type:', type);
        console.log('  To:', to);
        console.log('  Data:', JSON.stringify(data, null, 2));
        return { success: true };
    }

    if (!isSupabaseConfigured()) {
        console.error('Supabase not configured for email sending');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const { data: result, error } = await supabase.functions.invoke('send-email', {
            body: { type, to, data },
        });

        if (error) {
            console.error('Email sending error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Failed to send email:', err);
        return { success: false, error: 'Failed to send email' };
    }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (
    email: string,
    fullName: string
): Promise<{ success: boolean; error?: string }> => {
    return sendEmail('welcome', email, { fullName });
};

/**
 * Send OTP code for password reset
 */
export const sendPasswordResetCode = async (
    email: string,
    code: string,
    fullName?: string
): Promise<{ success: boolean; error?: string }> => {
    return sendEmail('otp', email, { code, fullName: fullName || '' });
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (
    email: string,
    fullName: string,
    orderNumber: string,
    orderTotal: number,
    orderItems: OrderItem[]
): Promise<{ success: boolean; error?: string }> => {
    return sendEmail('order_confirmation', email, {
        fullName,
        orderNumber,
        orderTotal,
        orderItems,
    });
};

/**
 * Send subscription confirmation email
 */
export const sendSubscriptionConfirmationEmail = async (
    email: string,
    fullName: string,
    frequency: string,
    totalPrice: number,
    nextDeliveryDate: string
): Promise<{ success: boolean; error?: string }> => {
    return sendEmail('subscription_confirmation', email, {
        fullName,
        frequency,
        totalPrice,
        nextDeliveryDate,
    });
};

export default {
    sendWelcomeEmail,
    sendPasswordResetCode,
    sendOrderConfirmationEmail,
    sendSubscriptionConfirmationEmail,
};
