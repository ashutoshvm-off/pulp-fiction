import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { createOrder } from '../lib/services/orderService';
import { supabase } from '../lib/supabase';

interface FeeSettings {
  shipping_fee: number;
  packaging_fee: number;
  tax_percentage: number;
  free_shipping_threshold: number;
  is_active: boolean;
}

export const Checkout: React.FC = () => {
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { profile, addresses } = useProfile();
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string>('');
  const [feeSettings, setFeeSettings] = useState<FeeSettings | null>(null);

  // Load fee settings from database
  useEffect(() => {
    const loadFees = async () => {
      const defaultFees: FeeSettings = {
        shipping_fee: 50,
        packaging_fee: 10,
        tax_percentage: 5,
        free_shipping_threshold: 500,
        is_active: true,
      };
      
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'fee_settings')
          .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error
        
        if (error) {
          console.log('Fee settings not found, using defaults');
          setFeeSettings(defaultFees);
          return;
        }
        
        if (data?.value) {
          setFeeSettings(data.value as FeeSettings);
        } else {
          setFeeSettings(defaultFees);
        }
      } catch (err) {
        console.log('Error loading fees, using defaults:', err);
        setFeeSettings(defaultFees);
      }
    };
    loadFees();
  }, []);

  // Get user info from profile
  const customerName = profile?.full_name || user?.user_metadata?.full_name || 'Customer';
  const customerEmail = profile?.email || user?.email || '';
  const customerPhone = profile?.phone || user?.user_metadata?.phone || '';
  
  // Get default address
  const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
  const shippingAddress = defaultAddress 
    ? `${defaultAddress.address_line1}${defaultAddress.address_line2 ? ', ' + defaultAddress.address_line2 : ''}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.postal_code}`
    : 'No address saved';

  // Calculate totals using fee settings
  const shipping = feeSettings?.is_active 
    ? (cartTotal >= (feeSettings?.free_shipping_threshold || 500) ? 0 : (feeSettings?.shipping_fee || 50))
    : 0;
  const packaging = feeSettings?.is_active ? (feeSettings?.packaging_fee || 0) : 0;
  const taxRate = feeSettings?.is_active ? (feeSettings?.tax_percentage || 5) : 0;
  const tax = cartTotal * (taxRate / 100);
  const total = cartTotal + shipping + packaging + tax;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setOrderError('Please sign in to place an order');
      navigate('/auth/login?redirect=/checkout');
      return;
    }

    if (!defaultAddress) {
      setOrderError('Please add a delivery address in your profile first');
      return;
    }

    setIsPlacingOrder(true);
    setOrderError('');

    try {
      const orderItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        sugar_option: (item as any).sugarPreference || 'regular',
      }));

      await createOrder(
        {
          profile_id: user.id,
          status: 'pending',
          total_amount: total,
          payment_method: 'cod',
          payment_status: 'pending',
          notes: `Shipping: ${shippingAddress}. Phone: ${customerPhone}`,
        },
        orderItems
      );

      clearCart();
      navigate('/subscription/success');
    } catch (error: any) {
      console.error('Order error:', error);
      setOrderError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-4">Your cart is empty</h2>
        <Link to="/menu" className="bg-primary hover:bg-primary-hover text-text-main font-bold py-3 px-6 rounded-xl">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 lg:py-12">
      <div className="max-w-[1000px] mx-auto">
        <h1 className="text-3xl font-bold text-text-main dark:text-white mb-8">Checkout</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            {orderError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                {orderError}
              </div>
            )}

            {/* Customer Info - Auto-filled from profile */}
            <section className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-[#2a3f23] p-6">
              <h2 className="text-lg font-bold text-text-main dark:text-white mb-4">Your Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-muted dark:text-gray-400">Name</span>
                  <span className="font-medium text-text-main dark:text-white">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted dark:text-gray-400">Email</span>
                  <span className="font-medium text-text-main dark:text-white">{customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted dark:text-gray-400">Phone</span>
                  <span className="font-medium text-text-main dark:text-white">{customerPhone || 'Not set'}</span>
                </div>
              </div>
              <Link to="/profile" className="text-primary text-sm mt-3 inline-block hover:underline">
                Edit Profile →
              </Link>
            </section>

            {/* Delivery Address - Auto-filled from saved address */}
            <section className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-[#2a3f23] p-6">
              <h2 className="text-lg font-bold text-text-main dark:text-white mb-4">Delivery Address</h2>
              {defaultAddress ? (
                <div className="p-4 bg-[#f9fcf8] dark:bg-background-dark rounded-lg">
                  <p className="font-medium text-text-main dark:text-white">
                    {defaultAddress.label && <span className="text-primary uppercase text-sm">{defaultAddress.label}</span>}
                  </p>
                  <p className="text-text-main dark:text-white mt-1">{defaultAddress.address_line1}</p>
                  {defaultAddress.address_line2 && <p className="text-text-muted">{defaultAddress.address_line2}</p>}
                  <p className="text-text-muted">{defaultAddress.city}, {defaultAddress.state} {defaultAddress.postal_code}</p>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-yellow-700 dark:text-yellow-300">No delivery address saved. Please add one in your profile.</p>
                </div>
              )}
              <Link to="/profile" className="text-primary text-sm mt-3 inline-block hover:underline">
                {defaultAddress ? 'Change Address →' : 'Add Address →'}
              </Link>
            </section>

            {/* Payment Method */}
            <section className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-[#2a3f23] p-6">
              <h2 className="text-lg font-bold text-text-main dark:text-white mb-4">Payment Method</h2>
              <div className="flex items-center gap-4 p-4 bg-[#ebf3e7] dark:bg-[#2a3f23] rounded-xl">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-text-main">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </span>
                <div>
                  <h3 className="font-bold text-text-main dark:text-white">Cash on Delivery (COD)</h3>
                  <p className="text-sm text-text-muted dark:text-gray-400">Pay when your order arrives</p>
                </div>
                <span className="ml-auto material-symbols-outlined text-primary text-2xl">check_circle</span>
              </div>
            </section>

            <button 
              onClick={handlePay}
              disabled={isPlacingOrder || items.length === 0 || !defaultAddress}
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
                  Place Order - ₹{total.toFixed(2)}
                </>
              )}
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-5 mt-10 lg:mt-0">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl shadow-black/5 border border-[#ebf3e7] dark:border-[#2a3f23] overflow-hidden sticky top-24">
              <div className="p-6 bg-[#f9fcf8] dark:bg-background-dark border-b border-[#ebf3e7] dark:border-[#2a3f23]">
                <h2 className="text-lg font-bold text-text-main dark:text-white">Order Summary</h2>
                <p className="text-sm text-text-muted dark:text-gray-400">{items.length} items</p>
              </div>
              <div className="p-6 flex flex-col gap-4 max-h-[300px] overflow-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[#f9fcf8] dark:bg-background-dark">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="flex justify-between text-sm font-bold text-text-main dark:text-white">
                        <h3>{item.name}</h3>
                        <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="text-xs text-text-muted">Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-[#ebf3e7] dark:border-[#2a3f23] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text-main dark:text-white">₹{cartTotal.toFixed(2)}</span>
                </div>
                {feeSettings?.is_active && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Shipping {shipping === 0 && <span className="text-green-600">(Free)</span>}</span>
                      <span className="text-text-main dark:text-white">₹{shipping.toFixed(2)}</span>
                    </div>
                    {packaging > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Packaging</span>
                        <span className="text-text-main dark:text-white">₹{packaging.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Tax ({taxRate}%)</span>
                      <span className="text-text-main dark:text-white">₹{tax.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-3 border-t border-[#ebf3e7] dark:border-[#2a3f23]">
                  <span className="font-bold text-text-main dark:text-white">Total</span>
                  <span className="text-xl font-bold text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
