import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { getCurrentUserProfile } from '../lib/services/profileService';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    userProfileId: string | null;
    signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    confirmEmail: (token: string) => Promise<{ error: AuthError | null }>;
    updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userProfileId, setUserProfileId] = useState<string | null>(null);

    useEffect(() => {
        // Get initial session and validate it
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    // Validate the session by checking if user exists
                    const { data: { user: validUser }, error: userError } = await supabase.auth.getUser();

                    if (userError || !validUser) {
                        // Invalid session - user doesn't exist, clear it
                        console.warn('Invalid session detected, signing out...');
                        await supabase.auth.signOut();
                        localStorage.removeItem('userProfile');
                        setSession(null);
                        setUser(null);
                        setUserProfileId(null);
                    } else {
                        setSession(session);
                        setUser(validUser);
                        setUserProfileId(validUser.id);
                    }
                } else {
                    setSession(null);
                    setUser(null);
                    setUserProfileId(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Clear potentially corrupt session
                await supabase.auth.signOut();
                localStorage.removeItem('userProfile');
                setSession(null);
                setUser(null);
                setUserProfileId(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                setSession(session);
                setUser(session.user);
                setUserProfileId(session.user.id);
            } else {
                setSession(null);
                setUser(null);
                setUserProfileId(null);
                localStorage.removeItem('userProfile');
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: undefined, // No email redirect needed
                    data: {
                        full_name: fullName,
                        phone: phone,
                    },
                },
            });

            if (error) return { error };

            // Profile will be created automatically via database trigger
            // User is now signed up and can sign in immediately
            return { error: null, user: data.user };
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
            // Verify the email confirmation token
            // When users click the link in their confirmation email,
            // we need to exchange the token_hash for a session
            const { error } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'signup',
            });

            return { error };
        } catch (error) {
            return { error: error as AuthError };
        }
    };

    const updatePassword = async (newPassword: string) => {
        try {
            // Update password for the currently authenticated user
            // The user is already authenticated via the recovery link from their email
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
