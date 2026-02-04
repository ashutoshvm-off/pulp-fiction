import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { updatePassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setError('Invalid reset link. Please request a new password reset.');
            setTokenValid(false);
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const validateForm = () => {
        if (!formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        // Password strength validation
        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumbers = /\d/.test(formData.password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            setError('Password must contain uppercase, lowercase, and numbers');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        const token = searchParams.get('token');

        if (!token) {
            setError('Invalid reset link. Please try again.');
            setLoading(false);
            return;
        }

        const { error: updateError } = await updatePassword(formData.password, token);

        if (updateError) {
            setError(updateError.message || 'Failed to reset password. The link may have expired.');
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4 py-12">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-green-800 mb-2">Pulp Fiction</h1>
                    <p className="text-gray-600">Reset your password</p>
                </div>

                {/* Reset Password Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-95">
                    {!tokenValid ? (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Invalid Link</h2>
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                            <p className="text-gray-600 mb-6 text-center">
                                The password reset link is invalid or has expired.
                            </p>
                            <div className="space-y-3">
                                <Link
                                    to="/forgot-password"
                                    className="block w-full text-center bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all"
                                >
                                    Request New Link
                                </Link>
                                <Link
                                    to="/login"
                                    className="block w-full text-center text-green-600 hover:text-green-700 font-semibold transition-colors"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    ) : success ? (
                        <div>
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Password Reset!</h2>
                            </div>
                            <p className="text-gray-600 text-center mb-6">
                                Your password has been successfully reset. You can now login with your new password.
                            </p>
                            <p className="text-sm text-gray-500 text-center">
                                Redirecting to login page...
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Password</h2>
                            <p className="text-gray-600 text-sm mb-6">
                                Enter your new password below. Make sure it's strong and unique.
                            </p>

                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Must be at least 6 characters with uppercase, lowercase, and numbers
                                    </p>
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                </div>

                                {/* Password Strength Indicator */}
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                                    <ul className="text-xs space-y-1">
                                        <li className={`${formData.password.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                                            ✓ At least 6 characters
                                        </li>
                                        <li className={`${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                                            ✓ Contains uppercase letter
                                        </li>
                                        <li className={`${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                                            ✓ Contains lowercase letter
                                        </li>
                                        <li className={`${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                                            ✓ Contains number
                                        </li>
                                    </ul>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Resetting...
                                        </span>
                                    ) : (
                                        'Reset Password'
                                    )}
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
