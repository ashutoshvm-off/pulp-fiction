import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { getCurrentUserProfile } from '../lib/services/profileService';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    userProfileId: string | null;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    confirmEmail: (token: string) => Promise<{ error: AuthError | null }>;
    updatePassword: (newPassword: string, token: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userProfileId, setUserProfileId] = useState<string | null>(null);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.id) {
                setUserProfileId(session.user.id); // Profile ID is same as auth user ID
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.id) {
                setUserProfileId(session.user.id);
            } else {
                setUserProfileId(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, fullName?: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) return { error };

            // Profile will be created automatically via database trigger
            return { error: null };
        } catch (error) {
            return { error: error as AuthError };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            return { error };
        } catch (error) {
            return { error: error as AuthError };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        // Clear any local storage
        localStorage.removeItem('userProfile');
    };

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#/reset-password`,
            });

            return { error };
        } catch (error) {
            return { error: error as AuthError };
        }
    };

    const confirmEmail = async (token: string) => {
        try {
            const { error } = await supabase.auth.verifyOtp({
                token,
                type: 'email',
            });

            return { error };
        } catch (error) {
            return { error: error as AuthError };
        }
    };

    const updatePassword = async (newPassword: string, token: string) => {
        try {
            // First verify the token
            const { error: verifyError } = await supabase.auth.verifyOtp({
                token,
                type: 'recovery',
            });

            if (verifyError) {
                return { error: verifyError };
            }

            // Update password
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            return { error };
        } catch (error) {
            return { error: error as AuthError };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                userProfileId,
                signUp,
                signIn,
                signOut,
                resetPassword,
                confirmEmail,
                updatePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
