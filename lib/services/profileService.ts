import { supabase, isSupabaseConfigured } from '../supabase';

export interface UserProfile {
    id?: string;
    email: string;
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Address {
    id?: string;
    profile_id?: string;
    label?: string;
    address_line1: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    is_default?: boolean;
    created_at?: string;
}

/**
 * Get current user's profile
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured');
        return null;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        console.error('Error getting current user:', userError);
        return null;
    }

    return getProfileById(user.id);
};

/**
 * Fetch user profile by ID (linked to auth.users)
 */
export const getProfileById = async (profileId: string): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured');
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No profile found
            return null;
        }
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
};

/**
 * Fetch user profile by email
 */
export const getProfileByEmail = async (email: string): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured');
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No profile found
            return null;
        }
        console.error('Error fetching profile:', error);
        throw error;
    }

    return data;
};

/**
 * Update user profile
 * Note: Profile is created automatically when user signs up via trigger
 * This function updates existing profile data
 */
export const updateProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        throw new Error('User not authenticated');
    }

    const profileData = {
        ...updates,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }

    return data;
};

/**
 * Upload profile avatar to Supabase Storage
 */
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

/**
 * Get addresses for a profile
 */
export const getAddressesByProfileId = async (profileId: string): Promise<Address[]> => {
    if (!isSupabaseConfigured()) {
        return [];
    }

    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', profileId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching addresses:', error);
        throw error;
    }

    return data || [];
};

/**
 * Create or update address
 */
export const upsertAddress = async (address: Address): Promise<Address> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
        .from('addresses')
        .upsert(address)
        .select()
        .single();

    if (error) {
        console.error('Error upserting address:', error);
        throw error;
    }

    return data;
};

/**
 * Delete address
 */
export const deleteAddress = async (addressId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }

    const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

    if (error) {
        console.error('Error deleting address:', error);
        throw error;
    }
};
