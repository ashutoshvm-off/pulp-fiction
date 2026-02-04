import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { getUserLocationWithAddress } from '../lib/services/locationService';
import type { LocationData } from '../types';

export const Checkout: React.FC = () => {
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const total = cartTotal + (cartTotal > 500 ? 0 : 50) + (cartTotal * 0.05);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUseMyLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError('');

    try {
      const locationData: LocationData = await getUserLocationWithAddress();

      // Auto-fill form with location data
      setFormData(prev => ({
        ...prev,
        address: locationData.address || '',
        city: locationData.city || '',
        state: locationData.state || '',
        postalCode: locationData.postalCode || ''
      }));
    } catch (error: any) {
      setLocationError(error.message || 'Failed to get your location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    clearCart();
    // In a real app, payment processing happens here
    navigate('/subscription/success'); // Reuse success page
  };

  return (
    <div className="py-8 lg:py-12">
      <div className="max-w-[1000px] mx-auto">
        {/* Progress */}
        <div className="mb-10 max-w-2xl mx-auto lg:mx-0">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#ebf3e7] dark:bg-[#2a3f23] -z-10 rounded-full"></div>
            {[1, 2, 3].map(s => (
              <div key={s} className="flex flex-col items-center gap-2 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-[0_0_0_4px_white] dark:shadow-[0_0_0_4px_#162210] ${step >= s ? 'bg-primary text-text-main' : 'bg-white dark:bg-surface-dark border-2 border-[#ebf3e7] dark:border-[#2a3f23] text-text-muted'
                  }`}>
                  {s}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${step >= s ? 'text-text-main dark:text-white' : 'text-text-muted'}`}>
                  {s === 1 ? 'Shipping' : s === 2 ? 'Delivery' : 'Payment'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-start">
          <div className="lg:col-span-7 flex flex-col gap-10">
            <form onSubmit={handlePay}>
              {/* Shipping */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ebf3e7] dark:bg-[#2a3f23] text-primary">
                      <span className="material-symbols-outlined text-lg">local_shipping</span>
                    </span>
                    <h2 className="text-xl font-bold text-text-main dark:text-white">Shipping Information</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isLoadingLocation}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-text-main font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">{isLoadingLocation ? 'progress_activity' : 'my_location'}</span>
                    {isLoadingLocation ? 'Getting Location...' : 'Use My Location'}
                  </button>
                </div>
                {locationError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {locationError}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Email address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">First name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Last name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street address"
                      className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Payment */}
              <section className="mb-8 border-t border-[#ebf3e7] dark:border-[#2a3f23] pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ebf3e7] dark:bg-[#2a3f23] text-primary">
                    <span className="material-symbols-outlined text-lg">credit_card</span>
                  </span>
                  <h2 className="text-xl font-bold text-text-main dark:text-white">Payment Details</h2>
                </div>
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-[#2a3f23] p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Card number</label>
                      <input type="text" placeholder="0000 0000 0000 0000" className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-[#f9fcf8] dark:bg-background-dark py-3 px-4" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Expiration</label>
                      <input type="text" placeholder="MM/YY" className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-[#f9fcf8] dark:bg-background-dark py-3 px-4" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">CVC</label>
                      <input type="text" placeholder="123" className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-[#f9fcf8] dark:bg-background-dark py-3 px-4" />
                    </div>
                  </div>
                </div>
              </section>

              <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-text-main text-lg font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">lock</span>
                Pay ₹{total.toFixed(2)} Securely
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="lg:col-span-5 mt-10 lg:mt-0">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl shadow-black/5 border border-[#ebf3e7] dark:border-[#2a3f23] overflow-hidden sticky top-24">
              <div className="p-6 bg-[#f9fcf8] dark:bg-background-dark border-b border-[#ebf3e7] dark:border-[#2a3f23]">
                <h2 className="text-lg font-bold text-text-main dark:text-white">Order Summary</h2>
                <p className="text-sm text-text-muted dark:text-gray-400">{items.length} items in your cart</p>
              </div>
              <div className="p-6 flex flex-col gap-6 max-h-[400px] overflow-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#f9fcf8] dark:bg-background-dark">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="flex justify-between text-base font-bold text-text-main dark:text-white">
                        <h3>{item.name}</h3>
                        <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-text-muted">Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col gap-3 pt-4 border-t border-[#ebf3e7] dark:border-[#2a3f23]">
                  <div className="flex justify-between items-center pt-3">
                    <p className="text-base font-bold text-text-main dark:text-white">Total</p>
                    <p className="text-xl font-bold text-primary">₹{total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
