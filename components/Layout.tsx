import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email === 'admin@pulpfiction.com' || user?.email === 'superadmin@pulpfiction.com';

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#ebf3e7] bg-white backdrop-blur-md px-6 py-3 lg:px-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Pulp Fiction Logo" className="h-10 w-10 object-cover rounded-full" />
            <h2 className="text-xl font-bold leading-tight tracking-tight text-gray-900 font-brand">Pulp Fiction</h2>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6">
            <Link to="/shop" className={`text-sm font-medium transition-colors ${location.pathname === '/shop' ? 'text-primary' : 'text-gray-900 hover:text-primary'}`}>Shop</Link>
            <Link to="/our-story" className={`text-sm font-medium transition-colors ${location.pathname === '/our-story' ? 'text-primary' : 'text-gray-900 hover:text-primary'}`}>Our Story</Link>
            <Link to="/profile" className={`text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'text-primary' : 'text-gray-900 hover:text-primary'}`}>Profile</Link>
          </nav>
        </div>

        {/* Desktop Cart - Only visible on desktop */}
        <div className="hidden lg:flex gap-3 items-center">
          {isAdmin && (
            <Link to="/admin" className="flex items-center justify-center size-10 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors text-orange-600" title="Admin Dashboard">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            </Link>
          )}
          <button className="flex items-center justify-center size-10 rounded-full bg-[#ebf3e7] hover:bg-primary/20 transition-colors text-gray-800">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
          <Link to="/cart" className="relative flex items-center justify-center size-10 rounded-full bg-[#ebf3e7] hover:bg-primary/20 transition-colors text-gray-800">
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 size-4 bg-primary rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>


      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-8 pb-24 lg:pb-8">
        {children}
      </main>

      {/* Desktop Footer */}
      <footer className="hidden lg:block mt-20 border-t border-[#ebf3e7] bg-surface-light py-12">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Pulp Fiction Logo" className="h-8 w-8 object-cover rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 font-brand">Pulp Fiction</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Delivering the freshest organic juices straight to your doorstep. Healthy living made delicious and easy.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">mail</span></a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">thumb_up</span></a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">photo_camera</span></a>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-gray-900">
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-sm">Shop</h4>
                <Link to="/shop" className="text-sm text-gray-500 hover:text-primary">All Juices</Link>
                <Link to="/subscription" className="text-sm text-gray-500 hover:text-primary">Cleanse Kits</Link>
                <a href="#" className="text-sm text-gray-500 hover:text-primary">Subscriptions</a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-sm">Company</h4>
                <Link to="/our-story" className="text-sm text-gray-500 hover:text-primary">Our Story</Link>
                <a href="#" className="text-sm text-gray-500 hover:text-primary">Sustainability</a>
                <a href="#" className="text-sm text-gray-500 hover:text-primary">Careers</a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-sm">Support</h4>
                <a href="#" className="text-sm text-gray-500 hover:text-primary">FAQ</a>
                <a href="#" className="text-sm text-gray-500 hover:text-primary">Shipping</a>
                <a href="#" className="text-sm text-gray-500 hover:text-primary">Contact</a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <p>© 2024 Pulp Fiction. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-600">Privacy Policy</a>
              <a href="#" className="hover:text-gray-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-2">
        <div className="flex items-center justify-around h-30">
          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${location.pathname === '/' ? 'text-gray-900' : 'text-gray-400'
              }`}
          >
            <span className={`material-symbols-outlined text-2xl mb-1 ${location.pathname === '/' ? 'filled' : ''
              }`}>home</span>
            <span className="text-xs font-medium">Home</span>
            {location.pathname === '/' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-900 rounded-t-full"></div>
            )}
          </Link>

          {/* Categories */}
          <Link
            to="/shop"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${location.pathname === '/shop' ? 'text-gray-900' : 'text-gray-400'
              }`}
          >
            <span className={`material-symbols-outlined text-2xl mb-1 ${location.pathname === '/shop' ? 'filled' : ''
              }`}>grid_view</span>
            <span className="text-xs font-medium">Categories</span>
            {location.pathname === '/shop' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-900 rounded-t-full"></div>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${location.pathname === '/cart' ? 'text-gray-900' : 'text-gray-400'
              }`}
          >
            <div className="relative">
              <span className={`material-symbols-outlined text-2xl mb-1 ${location.pathname === '/cart' ? 'filled' : ''
                }`}>shopping_cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-2 size-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Cart</span>
            {location.pathname === '/cart' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-900 rounded-t-full"></div>
            )}
          </Link>

          {/* Profile */}
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${location.pathname === '/profile' ? 'text-gray-900' : 'text-gray-400'
              }`}
          >
            <span className={`material-symbols-outlined text-2xl mb-1 ${location.pathname === '/profile' ? 'filled' : ''
              }`}>account_circle</span>
            <span className="text-xs font-medium">Profile</span>
            {location.pathname === '/profile' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-900 rounded-t-full"></div>
            )}
          </Link>
        </div>
      </nav>
    </div>
  );
};
