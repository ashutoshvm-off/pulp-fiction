/**
 * Email Service for Pulp Fiction
 * 
 * Uses Supabase Edge Function with Gmail SMTP
 * The Edge Function handles the actual SMTP connection securely on the server
 * 
 * To deploy the Edge Function:
 * 1. npx supabase login
 * 2. cd supabase && npx supabase functions deploy send-email --project-ref xvahbpqxcpozvyqxnnbx
 * 3. Set secrets:
 *    npx supabase secrets set SMTP_HOST=smtp.gmail.com
 *    npx supabase secrets set SMTP_PORT=587
 *    npx supabase secrets set SMTP_USER=contactpulpfiction@gmail.com
 *    npx supabase secrets set SMTP_PASSWORD=qwlesghdewdjsiyb
 *    npx supabase secrets set FROM_EMAIL="Pulp Fiction <contactpulpfiction@gmail.com>"
 */

import { supabase } from '../supabase';

export interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

type EmailType = 'welcome' | 'password_reset' | 'order_confirmation' | 'subscription_confirmation';

/**
 * Send email via Supabase Edge Function
 */
const sendEmail = async (
    type: EmailType,
    to: string,
    data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> => {
    console.log('📧 Sending email via Supabase Edge Function...');
    console.log('📧 Type:', type, '| To:', to);
    
    try {
        const { data: result, error } = await supabase.functions.invoke('send-email', {
            body: { type, to, data },
        });

        if (error) {
            console.error('❌ Edge function error:', error);
            return { success: false, error: error.message };
        }

        if (!result?.success) {
            console.error('❌ Email sending failed:', result?.error);
            return { success: false, error: result?.error || 'Unknown error' };
        }

        console.log('✅ Email sent successfully via', result.provider || 'SMTP');
        return { success: true };
    } catch (err: any) {
        console.error('❌ Failed to send email:', err);
        return { success: false, error: err.message || 'Failed to send email' };
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
 * Send password reset email with reset link
 */
export const sendPasswordResetEmail = async (
    email: string,
    resetLink: string,
    fullName?: string
): Promise<{ success: boolean; error?: string }> => {
    return sendEmail('password_reset', email, { 
        resetLink,
        fullName: fullName || 'User' 
    });
};

/**
 * Send password reset code (alias for backward compatibility)
 * @deprecated Use sendPasswordResetEmail instead
 */
export const sendPasswordResetCode = async (
    email: string,
    code: string,
    fullName?: string
): Promise<{ success: boolean; error?: string }> => {
    // Generate a reset link with the code
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pulp-fiction-zeta.vercel.app';
    const resetLink = `${baseUrl}/reset-password?code=${code}`;
    return sendEmail('password_reset', email, { 
        resetLink,
        code,
        fullName: fullName || 'User' 
    });
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
    sendPasswordResetEmail,
    sendPasswordResetCode,
    sendOrderConfirmationEmail,
    sendSubscriptionConfirmationEmail,
};
