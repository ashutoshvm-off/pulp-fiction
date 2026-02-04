import { supabase, isSupabaseConfigured } from '../supabase';

export interface OTPRecord {
    id?: string;
    email: string;
    code: string;
    expires_at: string;
    verified: boolean;
    created_at?: string;
}

/**
 * Generate a 6-digit OTP code
 */
export const generateOTPCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create OTP record in database
 * Returns the generated code
 */
export const createOTP = async (email: string): Promise<{ code: string; error: string | null }> => {
    if (!isSupabaseConfigured()) {
        return { code: '', error: 'Supabase not configured' };
    }

    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes from now

    try {
        // Delete any existing OTP for this email first
        await supabase
            .from('password_reset_codes')
            .delete()
            .eq('email', email.toLowerCase());

        // Create new OTP
        const { error } = await supabase
            .from('password_reset_codes')
            .insert({
                email: email.toLowerCase(),
                code,
                expires_at: expiresAt,
                verified: false,
            });

        if (error) {
            console.error('Error creating OTP:', error);
            return { code: '', error: error.message };
        }

        return { code, error: null };
    } catch (error) {
        console.error('OTP creation error:', error);
        return { code: '', error: 'Failed to create OTP' };
    }
};

/**
 * Verify OTP code
 * Returns true if code is valid and not expired
 */
export const verifyOTP = async (email: string, code: string): Promise<{ valid: boolean; error: string | null }> => {
    if (!isSupabaseConfigured()) {
        return { valid: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('password_reset_codes')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('code', code)
            .eq('verified', false)
            .single();

        if (error || !data) {
            return { valid: false, error: 'Invalid or expired code' };
        }

        // Check if code is expired
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
            return { valid: false, error: 'Code has expired. Please request a new one.' };
        }

        // Mark OTP as verified
        await supabase
            .from('password_reset_codes')
            .update({ verified: true })
            .eq('id', data.id);

        return { valid: true, error: null };
    } catch (error) {
        console.error('OTP verification error:', error);
        return { valid: false, error: 'Failed to verify code' };
    }
};

/**
 * Check if OTP was verified (for new password page)
 */
export const isOTPVerified = async (email: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
        return false;
    }

    try {
        const { data, error } = await supabase
            .from('password_reset_codes')
            .select('verified, expires_at')
            .eq('email', email.toLowerCase())
            .eq('verified', true)
            .single();

        if (error || !data) {
            return false;
        }

        // Check if within a reasonable time window (30 minutes after verification)
        const expiresAt = new Date(data.expires_at);
        const verificationWindow = new Date(expiresAt.getTime() + 15 * 60 * 1000); // 15 extra minutes
        
        return verificationWindow > new Date();
    } catch (error) {
        return false;
    }
};

/**
 * Delete OTP after password reset is complete
 */
export const deleteOTP = async (email: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        return;
    }

    try {
        await supabase
            .from('password_reset_codes')
            .delete()
            .eq('email', email.toLowerCase());
    } catch (error) {
        console.error('Error deleting OTP:', error);
    }
};

/**
 * Clean up expired OTPs (can be called periodically)
 */
export const cleanupExpiredOTPs = async (): Promise<void> => {
    if (!isSupabaseConfigured()) {
        return;
    }

    try {
        await supabase
            .from('password_reset_codes')
            .delete()
            .lt('expires_at', new Date().toISOString());
    } catch (error) {
        console.error('Error cleaning up OTPs:', error);
    }
};

export default {
    generateOTPCode,
    createOTP,
    verifyOTP,
    isOTPVerified,
    deleteOTP,
    cleanupExpiredOTPs,
};
