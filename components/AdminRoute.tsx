import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

const ADMIN_EMAILS = [
  'admin@pulpfiction.com',
  'superadmin@pulpfiction.com',
];

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in to access the admin panel.</p>
          <a href="/#/login" className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!ADMIN_EMAILS.includes(user.email || '')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h2>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
          <a href="/#/" className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
