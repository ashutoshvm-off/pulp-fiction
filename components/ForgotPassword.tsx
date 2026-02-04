'use client';

import React, { useState } from 'react';
import { sendPasswordResetEmail } from '@/lib/services/emailService';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await sendPasswordResetEmail(email, 'https://pulp-fiction-zeta.vercel.app/', 'John Doe');
    if (result.success) {
      console.log('Password reset email sent');
    } else {
      console.log('Password reset email failed');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Send Reset Email</button>
      {error && <div>{error}</div>}
    </form>
  );
}