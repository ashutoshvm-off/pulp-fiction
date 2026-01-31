import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { itemCount } = useCart();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#ebf3e7] bg-white/80 backdrop-blur-md px-6 py-3 lg:px-10">
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
          </nav>
        </div>

        <div className="flex gap-3">
          <button className="hidden sm:flex items-center justify-center size-10 rounded-full bg-[#ebf3e7] hover:bg-primary/20 transition-colors text-gray-800">
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
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center size-10 rounded-full bg-[#ebf3e7] hover:bg-primary/20 transition-colors text-gray-800"
          >
            <span className="material-symbols-outlined text-[20px]">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#ebf3e7] p-4 absolute top-16 left-0 w-full z-40 shadow-lg">
          <nav className="flex flex-col gap-4">
            <Link to="/shop" className="text-base font-medium text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
            <Link to="/our-story" className="text-base font-medium text-gray-900" onClick={() => setIsMobileMenuOpen(false)}>Our Story</Link>
          </nav>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 lg:p-8">
        {children}
      </main>

      <footer className="mt-20 border-t border-[#ebf3e7] bg-surface-light py-12">
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
    </div>
  );
};
