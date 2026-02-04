import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getUserLocationWithAddress } from '../lib/services/locationService';
import { createOrder } from '../lib/services/orderService';
import type { LocationData } from '../types';

export const Checkout: React.FC = () => {
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { profile, addresses } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string>('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // Form state - pre-filled from profile
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: ''
  });

  // Auto-fill form from profile data
  useEffect(() => {
    if (profile) {
      const nameParts = (profile.full_name || '').split(' ');
      setFormData(prev => ({
        ...prev,
        email: profile.email || prev.email,
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.slice(1).join(' ') || prev.lastName,
        phone: profile.phone || prev.phone,
      }));
    } else if (user) {
      const nameParts = (user.user_metadata?.full_name || '').split(' ');
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.slice(1).join(' ') || prev.lastName,
        phone: user.user_metadata?.phone || prev.phone,
      }));
    }
  }, [profile, user]);

  // Auto-fill address from selected saved address
  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const selectedAddr = addresses.find(a => a.id === selectedAddressId);
      if (selectedAddr) {
        setFormData(prev => ({
          ...prev,
          address: selectedAddr.address_line1 + (selectedAddr.address_line2 ? ', ' + selectedAddr.address_line2 : ''),
          city: selectedAddr.city || '',
          state: selectedAddr.state || '',
          postalCode: selectedAddr.postal_code || '',
        }));
      }
    }
  }, [selectedAddressId, addresses]);

  // Set default address on load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      if (defaultAddr?.id) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId]);

  // Calculate totals - same as Cart page
  const shipping = cartTotal > 500 ? 0 : 50;
  const tax = cartTotal * 0.05; // 5% GST
  const total = cartTotal + shipping + tax;

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

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setOrderError('Please sign in to place an order');
      navigate('/auth/login?redirect=/checkout');
      return;
    }

    setIsPlacingOrder(true);
    setOrderError('');

    try {
      // Create order in database
      const orderItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      await createOrder(
        {
          profile_id: user.id,
          status: 'pending',
          total_amount: total,
          payment_method: 'cod',
          payment_status: 'pending',
          notes: `Shipping: ${formData.address}, ${formData.city}, ${formData.state} ${formData.postalCode}. Phone: ${formData.phone}`,
        },
        orderItems
      );

      clearCart();
      navigate('/subscription/success'); // Reuse success page
    } catch (error: any) {
      console.error('Order error:', error);
      setOrderError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
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
                    {isLoadingLocation ? 'Getting Location...' : 'Use GPS'}
                  </button>
                </div>

                {orderError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {orderError}
                  </div>
                )}

                {/* Saved Addresses */}
                {addresses.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Select Saved Address</label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-white dark:bg-surface-dark py-3 px-4"
                    >
                      <option value="">-- Select an address --</option>
                      {addresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.label?.toUpperCase()}: {addr.address_line1}, {addr.city} {addr.is_default ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                    <span className="material-symbols-outlined text-lg">payments</span>
                  </span>
                  <h2 className="text-xl font-bold text-text-main dark:text-white">Payment Method</h2>
                </div>
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-[#2a3f23] p-6">
                  <div className="flex items-center gap-4 p-4 bg-[#ebf3e7] dark:bg-[#2a3f23] rounded-xl">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-text-main">
                      <span className="material-symbols-outlined text-2xl">local_shipping</span>
                    </span>
                    <div>
                      <h3 className="font-bold text-text-main dark:text-white">Cash on Delivery (COD)</h3>
                      <p className="text-sm text-text-muted dark:text-gray-400">Pay when your order arrives at your doorstep</p>
                    </div>
                    <span className="ml-auto material-symbols-outlined text-primary text-2xl">check_circle</span>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-text-main dark:text-gray-300 mb-2">Phone Number (for delivery updates)</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 XXXXX XXXXX"
                      className="block w-full rounded-lg border-gray-200 dark:border-[#2a3f23] bg-[#f9fcf8] dark:bg-background-dark py-3 px-4"
                      required
                    />
                  </div>
                </div>
              </section>

              <button 
                type="submit" 
                disabled={isPlacingOrder || items.length === 0}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-gray-400 text-text-main text-lg font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">shopping_bag</span>
                    Place Order - ₹{total.toFixed(2)} (COD)
                  </>
                )}
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
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-text-main dark:text-white">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted dark:text-gray-400">Shipping</span>
                    <span className="font-medium text-text-main dark:text-white">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted dark:text-gray-400">GST (5%)</span>
                    <span className="font-medium text-text-main dark:text-white">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-[#ebf3e7] dark:border-[#2a3f23]">
                    <p className="text-base font-bold text-text-main dark:text-white">Total</p>
                    <p className="text-xl font-bold text-primary">₹{total.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-600 dark:text-green-400">
                    <span className="material-symbols-outlined text-lg">local_shipping</span>
                    <span>Cash on Delivery</span>
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
