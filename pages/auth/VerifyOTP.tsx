import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { verifyOTP, createOTP } from '../../lib/services/otpService';

export const VerifyOTP: React.FC = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [email, setEmail] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('resetEmail');
        if (!storedEmail) {
            navigate('/forgot-password');
            return;
        }
        setEmail(storedEmail);
        // Focus first input on mount
        inputRefs.current[0]?.focus();
    }, [navigate]);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (value && index === 5 && newCode.every(digit => digit !== '')) {
            handleVerify(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus();
            handleVerify(pastedData);
        }
    };

    const handleVerify = async (codeString?: string) => {
        const fullCode = codeString || code.join('');
        
        if (fullCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { valid, error: verifyError } = await verifyOTP(email, fullCode);

            if (!valid) {
                setError(verifyError || 'Invalid code. Please try again.');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
                setLoading(false);
                return;
            }

            setSuccess('Code verified! Redirecting...');
            
            // Navigate to new password page
            setTimeout(() => {
                navigate('/new-password');
            }, 1000);
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResending(true);
        setError('');
        setSuccess('');

        try {
            const { error: otpError } = await createOTP(email);
            
            if (otpError) {
                setError(otpError);
            } else {
                setSuccess('A new code has been sent to your email.');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError('Failed to resend code. Please try again.');
        }

        setResending(false);
    };

    const maskEmail = (email: string) => {
        const [local, domain] = email.split('@');
        const maskedLocal = local.length > 3 
            ? `${local.slice(0, 2)}${'*'.repeat(local.length - 3)}${local.slice(-1)}`
            : `${local[0]}${'*'.repeat(local.length - 1)}`;
        return `${maskedLocal}@${domain}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4 py-12">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-green-800 mb-2">Pulp Fiction</h1>
                    <p className="text-gray-600">Enter verification code</p>
                </div>

                {/* OTP Verification Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-95">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                        Check Your Email
                    </h2>
                    <p className="text-gray-600 mb-6 text-sm text-center">
                        We've sent a 6-digit verification code to<br />
                        <span className="font-semibold text-gray-800">{maskEmail(email)}</span>
                    </p>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
                            {success}
                        </div>
                    )}

                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                disabled={loading}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none disabled:bg-gray-100"
                            />
                        ))}
                    </div>

                    {/* Verify Button */}
                    <button
                        onClick={() => handleVerify()}
                        disabled={loading || code.some(digit => !digit)}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mb-4"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </span>
                        ) : (
                            'Verify Code'
                        )}
                    </button>

                    {/* Resend Code */}
                    <p className="text-center text-gray-600 text-sm">
                        Didn't receive the code?{' '}
                        <button
                            onClick={handleResendCode}
                            disabled={resending}
                            className="text-green-600 hover:text-green-700 font-semibold transition-colors disabled:opacity-50"
                        >
                            {resending ? 'Sending...' : 'Resend Code'}
                        </button>
                    </p>

                    {/* Back to Login Link */}
                    <div className="mt-6 text-center pt-4 border-t border-gray-100">
                        <Link
                            to="/login"
                            className="text-gray-500 hover:text-gray-700 text-sm transition-colors inline-flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Login
                        </Link>
                    </div>
                </div>

                {/* Timer Info */}
                <p className="text-center text-gray-500 text-sm mt-4">
                    Code expires in 15 minutes
                </p>
            </div>
        </div>
    );
};
