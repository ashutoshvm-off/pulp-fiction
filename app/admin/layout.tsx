'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/orders', label: 'Orders' },
        { href: '/admin/products', label: 'Products' },
        { href: '/admin/settings', label: 'Settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Admin Navigation */}
            <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/admin" className="text-xl font-bold text-amber-600">
                                Admin Panel
                            </Link>
                            <div className="hidden md:flex space-x-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`px-4 py-2 rounded-lg transition-colors ${
                                            pathname === item.href
                                                ? 'bg-amber-100 text-amber-700 font-medium'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Link href="/" className="text-gray-600 hover:text-amber-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Site
                            </Link>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Navigation */}
                <div className="md:hidden border-t px-4 py-2 flex space-x-2 overflow-x-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                                pathname === item.href
                                    ? 'bg-amber-100 text-amber-700 font-medium'
                                    : 'text-gray-600 bg-gray-50'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </nav>
            
            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
}
