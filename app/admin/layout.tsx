import React from 'react';
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Admin Navigation */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/admin" className="text-xl font-bold text-orange-600">
                                Admin Panel
                            </Link>
                            <div className="hidden md:flex space-x-4">
                                <Link href="/admin" className="text-gray-600 hover:text-orange-600 px-3 py-2">
                                    Dashboard
                                </Link>
                                <Link href="/admin/orders" className="text-gray-600 hover:text-orange-600 px-3 py-2">
                                    Orders
                                </Link>
                                <Link href="/admin/products" className="text-gray-600 hover:text-orange-600 px-3 py-2">
                                    Products
                                </Link>
                                <Link href="/admin/settings" className="text-gray-600 hover:text-orange-600 px-3 py-2">
                                    Settings
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Link href="/" className="text-gray-600 hover:text-orange-600">
                                ← Back to Site
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
            
            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
}
