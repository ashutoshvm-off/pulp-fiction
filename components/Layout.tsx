import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { itemCount } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#ebf3e7] dark:border-gray-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-3 lg:px-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-full bg-primary/20 text-primary-dark">
              <span className="material-symbols-outlined text-green-700 dark:text-primary">local_drink</span>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">Pulp Fiction</h2>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6">
            <Link to="/shop" className={`text-sm font-medium transition-colors ${location.pathname === '/shop' ? 'text-primary' : 'text-gray-900 dark:text-gray-200 hover:text-primary'}`}>Shop</Link>
            <Link to="/our-story" className={`text-sm font-medium transition-colors ${location.pathname === '/our-story' ? 'text-primary' : 'text-gray-900 dark:text-gray-200 hover:text-primary'}`}>Our Story</Link>
          </nav>
        </div>

        <div className="flex gap-3">
          <button className="hidden sm:flex items-center justify-center size-10 rounded-full bg-[#ebf3e7] dark:bg-surface-dark hover:bg-primary/20 transition-colors text-gray-800 dark:text-white">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center size-10 rounded-full bg-[#ebf3e7] dark:bg-surface-dark hover:bg-primary/20 transition-all duration-300 text-gray-800 dark:text-white"
            aria-label="Toggle theme"
          >
            <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${isDarkMode ? 'rotate-180' : 'rotate-0'}`}>
              {isDarkMode ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <Link to="/cart" className="relative flex items-center justify-center size-10 rounded-full bg-[#ebf3e7] dark:bg-surface-dark hover:bg-primary/20 transition-colors text-gray-800 dark:text-white">
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 size-4 bg-primary rounded-full border-2 border-white dark:border-background-dark flex items-center justify-center text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center size-10 rounded-full bg-[#ebf3e7] dark:bg-surface-dark hover:bg-primary/20 transition-colors text-gray-800 dark:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-background-dark border-b border-[#ebf3e7] dark:border-gray-800 p-4 absolute top-16 left-0 w-full z-40 shadow-lg">
          <nav className="flex flex-col gap-4">
            <Link to="/shop" className="text-base font-medium text-gray-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
            <Link to="/our-story" className="text-base font-medium text-gray-900 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>Our Story</Link>
          </nav>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-8">
        {children}
      </main>

      <footer className="mt-20 border-t border-[#ebf3e7] dark:border-gray-800 bg-surface-light dark:bg-surface-dark py-12">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="max-w-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center size-6 rounded-full bg-primary text-white">
                  <span className="material-symbols-outlined text-[16px]">local_drink</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pulp Fiction</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Delivering the freshest organic juices straight to your doorstep. Healthy living made delicious and easy.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">mail</span></a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">thumb_up</span></a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">photo_camera</span></a>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-gray-900 dark:text-white">
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
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <p>© 2024 Pulp Fiction. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-600">Privacy Policy</a>
              <a href="#" className="hover:text-gray-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
