import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();
  const shipping = cartTotal > 500 ? 0 : 50.00;
  const tax = cartTotal * 0.05; // 5% GST mock
  const total = cartTotal + shipping + tax;

  return (
    <div className="py-10 lg:py-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight font-serif">Your Wellness Cart</h1>
          {cartTotal < 500 && (
             <p className="text-text-muted mt-2 text-sm">Free shipping on orders over ₹500. You're ₹{(500 - cartTotal).toFixed(2)} away!</p>
          )}
        </div>
        <Link to="/shop" className="text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1">
           Continue Shopping <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-surface-dark rounded-3xl border border-[#ebf3e7] dark:border-gray-800">
          <div className="size-20 bg-[#ebf3e7] dark:bg-background-dark rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <span className="material-symbols-outlined text-4xl">shopping_basket</span>
          </div>
          <h2 className="text-xl font-bold text-text-main dark:text-white mb-2">Your cart is empty</h2>
          <p className="text-text-muted mb-8">Looks like you haven't added anything yet.</p>
          <Link to="/shop" className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/30">Start Shopping</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {items.map(item => (
              <div key={item.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 sm:p-6 bg-white dark:bg-surface-dark rounded-3xl border border-[#ebf3e7] dark:border-[#2a3f23] shadow-sm hover:shadow-md transition-all">
                 <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-[#f4f4f5] dark:bg-black/20 rounded-2xl overflow-hidden relative">
                   <img src={item.image} alt={item.name} className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110" />
                 </div>
                 <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-lg font-bold text-text-main dark:text-white">{item.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#ebf3e7] dark:bg-[#2a3f23] text-xs font-bold text-text-muted dark:text-primary capitalize">{item.category}</span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">12oz</span>
                      </div>
                      <div className="text-primary font-bold text-lg mt-1">₹{item.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center justify-between sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="flex items-center bg-[#f9fcf8] dark:bg-background-dark border border-[#ebf3e7] dark:border-[#2a3f23] rounded-xl h-10 overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-10 h-full flex items-center justify-center text-text-muted hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-lg">remove</span>
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-text-main dark:text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-10 h-full flex items-center justify-center text-text-muted hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                 </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
             <div className="sticky top-24 bg-[#f9fcf8] dark:bg-[#1f2e1a] rounded-3xl p-6 lg:p-8 border border-[#ebf3e7] dark:border-[#2a3f23] shadow-sm">
                <h2 className="text-xl font-bold text-text-main dark:text-white mb-6 flex items-center gap-2">
                   Summary
                   <span className="text-xs font-normal text-text-muted dark:text-gray-400 bg-white dark:bg-background-dark px-2 py-1 rounded-full border border-gray-100 dark:border-gray-800">{items.reduce((a,b)=>a+b.quantity,0)} Items</span>
                </h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-text-main dark:text-white">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted dark:text-gray-400">Shipping</span>
                    <span className="font-medium text-text-main dark:text-white">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted dark:text-gray-400">Tax Estimate (5%)</span>
                    <span className="font-medium text-text-main dark:text-white">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#ebf3e7] dark:border-[#2a3f23] my-4 pt-4 flex justify-between items-end">
                    <span className="text-text-main dark:text-white font-bold text-lg">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-text-main dark:text-white">₹{total.toFixed(2)}</span>
                      <p className="text-xs text-text-muted dark:text-gray-500">INR</p>
                    </div>
                  </div>
                </div>
                <Link to="/checkout" className="w-full bg-primary hover:bg-primary-hover text-text-main font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 mb-4 flex items-center justify-center gap-2 group transform hover:-translate-y-0.5">
                   Proceed to Checkout
                   <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
                <div className="flex items-center justify-center gap-2 text-xs text-text-muted dark:text-gray-500">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Secure SSL Encrypted Checkout
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
