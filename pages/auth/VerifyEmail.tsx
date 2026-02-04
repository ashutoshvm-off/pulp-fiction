import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { confirmEmail } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setError('Invalid verification link. Please check your email and try again.');
                setLoading(false);
                return;
            }

            const { error: verifyError } = await confirmEmail(token);

            if (verifyError) {
                setError(verifyError.message || 'Failed to verify email. The link may have expired.');
                setLoading(false);
            } else {
                setSuccess(true);
                setLoading(false);
                // Redirect to home after 3 seconds
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            }
        };

        verifyEmail();
    }, [searchParams, confirmEmail, navigate]);

    const handleResendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setResendLoading(true);
        setError('');

        if (!email) {
            setError('Please enter your email address');
            setResendLoading(false);
            return;
        }

        // Note: You'll need to implement a resend verification email function in AuthContext
        // For now, we'll show a message
        setError('Resend functionality coming soon. Please check your spam folder or contact support.');
        setResendLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4 py-12">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-green-800 mb-2">Pulp Fiction</h1>
                    <p className="text-gray-600">Verify your email address</p>
                </div>

                {/* Verification Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-95">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                            <p className="text-gray-600">Verifying your email...</p>
                        </div>
                    ) : success ? (
                        <div>
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Email Verified!</h2>
                            </div>
                            <p className="text-gray-600 text-center mb-6">
                                Your email has been successfully verified. You can now enjoy all features of your account.
                            </p>
                            <p className="text-sm text-gray-500 text-center">
                                Redirecting to home page...
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Email Verification Failed</h2>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                                <p className="font-semibold mb-2">Having trouble?</p>
                                <p>Make sure you're clicking the link from your email within 24 hours. Links expire for security.</p>
                            </div>

                            <p className="text-gray-600 text-center mb-4">
                                Didn't receive the verification email?
                            </p>

                            <form onSubmit={handleResendEmail} className="space-y-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                    disabled={resendLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={resendLoading}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
