import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Address } from '../types';
import { getProfileByEmail, upsertProfile, getAddressesByProfileId } from '../lib/services/profileService';
import { isSupabaseConfigured } from '../lib/supabase';

interface ProfileContextType {
    profile: UserProfile | null;
    addresses: Address[];
    isLoading: boolean;
    isConfigured: boolean;
    setProfile: (profile: UserProfile | null) => void;
    updateProfile: (profile: UserProfile) => Promise<void>;
    loadProfile: (email: string) => Promise<void>;
    refreshAddresses: () => Promise<void>;
    logout: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfigured] = useState(isSupabaseConfigured());

    // Load profile from localStorage on mount
    useEffect(() => {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            try {
                const parsed = JSON.parse(savedProfile);
                setProfile(parsed);
                if (parsed.id && isConfigured) {
                    loadAddresses(parsed.id);
                }
            } catch (error) {
                console.error('Error parsing saved profile:', error);
            }
        }
    }, [isConfigured]);

    const loadAddresses = async (profileId: string) => {
        if (!isConfigured) return;

        try {
            const fetchedAddresses = await getAddressesByProfileId(profileId);
            setAddresses(fetchedAddresses);
        } catch (error) {
            console.error('Error loading addresses:', error);
        }
    };

    const loadProfile = async (email: string) => {
        if (!isConfigured) {
            console.warn('Supabase not configured');
            return;
        }

        setIsLoading(true);
        try {
            const fetchedProfile = await getProfileByEmail(email);
            if (fetchedProfile) {
                setProfile(fetchedProfile);
                localStorage.setItem('userProfile', JSON.stringify(fetchedProfile));
                if (fetchedProfile.id) {
                    await loadAddresses(fetchedProfile.id);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (updatedProfile: UserProfile) => {
        if (!isConfigured) {
            throw new Error('Supabase not configured');
        }

        setIsLoading(true);
        try {
            const savedProfile = await upsertProfile(updatedProfile);
            setProfile(savedProfile);
            localStorage.setItem('userProfile', JSON.stringify(savedProfile));
            if (savedProfile.id) {
                await loadAddresses(savedProfile.id);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshAddresses = async () => {
        if (profile?.id && isConfigured) {
            await loadAddresses(profile.id);
        }
    };

    const logout = () => {
        setProfile(null);
        setAddresses([]);
        localStorage.removeItem('userProfile');
    };

    return (
        <ProfileContext.Provider
            value={{
                profile,
                addresses,
                isLoading,
                isConfigured,
                setProfile,
                updateProfile,
                loadProfile,
                refreshAddresses,
                logout
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
