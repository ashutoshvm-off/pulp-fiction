import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  getUserStats,
  getOrderStats,
  getTotalUserCount,
  AdminOrderSummary,
} from '../lib/services/adminService';
import { getAdminSession, logoutAdmin, AdminSession } from '../lib/services/adminAuthService';
import { uploadProductImage } from '../lib/services/storageService';
import { fetchProducts, updateProduct as updateProductInDb, createProduct, deleteProduct } from '../lib/services/productService';
import { AdminManagement } from './AdminManagement';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import {
  getAllDeliveryAgents,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
  DeliveryAgent,
} from '../lib/services/deliveryAuthService';

type Tab = 'dashboard' | 'orders' | 'products' | 'admin' | 'settings' | 'delivery';
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface FeeSettings {
  shipping_fee: number;
  packaging_fee: number;
  tax_percentage: number;
  free_shipping_threshold: number;
  is_active: boolean;
}

const DEFAULT_FEES: FeeSettings = {
  shipping_fee: 50,
  packaging_fee: 10,
  tax_percentage: 5,
  free_shipping_threshold: 500,
  is_active: true,
};

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({ totalUsers: 0, newUsersThisMonth: 0 });
  const [orderStats, setOrderStats] = useState({ totalOrders: 0, totalRevenue: 0, monthlyRevenue: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adminUser, setAdminUser] = useState<AdminSession | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  
  // Fee settings state
  const [feeSettings, setFeeSettings] = useState<FeeSettings>(DEFAULT_FEES);
  const [savingFees, setSavingFees] = useState(false);
  const [feeMessage, setFeeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product> & { ingredientsText?: string; benefitsText?: string }>({
    id: '',
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'juice',
    ingredients: [],
    benefits: [],
    isAvailable: true,
    isBestSeller: false,
    isNew: true,
    ingredientsText: '',
    benefitsText: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newProductFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Function to load all data
  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [ordersData, userStatsData, orderStatsData, productsData] = await Promise.all([
        getAllOrders(),
        getUserStats(),
        getOrderStats(),
        fetchProducts(),
      ]);
      setOrders(ordersData);
      setUserStats(userStatsData);
      setOrderStats(orderStatsData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    // Check if user is logged in as admin
    const session = getAdminSession();
    if (!session) {
      navigate('/admin-login');
      return;
    }
    setAdminUser(session);

    loadData();
    loadFeeSettings();
  }, [navigate]);

  // Real-time subscription for orders - instant sync when delivery agent updates
  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order changed:', payload);
          // Reload orders on any change
          loadData(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-refresh data every 15 seconds as backup
  const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if not editing something
      if (!editingProduct && !showAddForm && !selectedOrder) {
        loadData(false); // Don't show loading spinner for auto-refresh
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [editingProduct, showAddForm, selectedOrder]);

  const handleOrderStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
    }
  };

  const handleProductUpdate = (product: Product) => {
    setEditingProduct({ ...product });
  };

  const saveProductChanges = async () => {
    if (!editingProduct) return;
    setSavingProduct(true);
    setError(null);
    try {
      // Save to database
      const updatedProduct = await updateProductInDb(editingProduct.id, {
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        image: editingProduct.image,
        category: editingProduct.category,
        ingredients: editingProduct.ingredients,
        benefits: editingProduct.benefits,
        isAvailable: editingProduct.isAvailable,
        isBestSeller: editingProduct.isBestSeller,
        isNew: editingProduct.isNew,
      });
      
      // Update local state
      setProducts(products.map(p =>
        p.id === editingProduct.id ? updatedProduct : p
      ));
      setEditingProduct(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setSavingProduct(false);
    }
  };

  const cancelProductEdit = () => {
    setEditingProduct(null);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      setError('Product name and price are required');
      return;
    }

    setSavingProduct(true);
    setError(null);
    try {
      // Generate ID from name
      const productId = newProduct.id || newProduct.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const createdProduct = await createProduct({
        id: productId,
        name: newProduct.name!,
        description: newProduct.description || '',
        price: newProduct.price!,
        image: newProduct.image || '',
        category: newProduct.category || 'juice',
        ingredients: newProduct.ingredients || [],
        benefits: newProduct.benefits || [],
        isAvailable: newProduct.isAvailable !== false,
        isBestSeller: newProduct.isBestSeller || false,
        isNew: newProduct.isNew !== false,
      });

      setProducts([...products, createdProduct]);
      setShowAddForm(false);
      setNewProduct({
        id: '',
        name: '',
        description: '',
        price: 0,
        image: '',
        category: 'juice',
        ingredients: [],
        benefits: [],
        isAvailable: true,
        isBestSeller: false,
        isNew: true,
        ingredientsText: '',
        benefitsText: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeletingProduct(productId);
    setError(null);
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    setDeletingOrder(orderId);
    setError(null);
    
    try {
      // Delete order items first (they reference the order)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) {
        console.error('Error deleting order items:', itemsError);
        throw new Error(`Failed to delete order items: ${itemsError.message}`);
      }
      
      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (orderError) {
        console.error('Error deleting order:', orderError);
        throw new Error(`Failed to delete order: ${orderError.message}`);
      }
      
      // Update local state only after successful delete
      setOrders(prev => prev.filter(order => order.id !== orderId));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      
      // Also update orderStats
      setOrderStats(prev => ({
        ...prev,
        totalOrders: prev.totalOrders - 1
      }));
      
    } catch (err: any) {
      console.error('Delete order error:', err);
      setError(err.message || 'Failed to delete order');
    } finally {
      setDeletingOrder(null);
    }
  };

  const handleNewProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const tempId = newProduct.name?.toLowerCase().replace(/\s+/g, '-') || `new-product-${Date.now()}`;
      const result = await uploadProductImage(file, tempId);
      
      if (result.success && result.url) {
        setNewProduct({ ...newProduct, image: result.url });
      } else {
        setError(result.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (newProductFileInputRef.current) {
        newProductFileInputRef.current.value = '';
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingProduct) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const result = await uploadProductImage(file, editingProduct.id);
      
      if (result.success && result.url) {
        setEditingProduct({ ...editingProduct, image: result.url });
      } else {
        setError(result.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logoutAdmin();
      navigate('/admin-login');
    }
  };

  const loadFeeSettings = async () => {
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
        .maybeSingle(); // Use maybeSingle to avoid 406 error when no row exists

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
      console.log('Using default fees');
      setFeeSettings(defaultFees);
    }
  };

  const saveFeeSettings = async () => {
    setSavingFees(true);
    setFeeMessage(null);

    try {
      // First try to update existing row
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'fee_settings')
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const result = await supabase
          .from('app_settings')
          .update({
            value: feeSettings,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'fee_settings');
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('app_settings')
          .insert({
            key: 'fee_settings',
            value: feeSettings,
          });
        error = result.error;
      }

      if (error) throw error;
      setFeeMessage({ type: 'success', text: 'Fee settings saved successfully!' });
    } catch (err: any) {
      console.error('Save fee error:', err);
      setFeeMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSavingFees(false);
    }
  };

  // Delivery agents state
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [showAddAgentForm, setShowAddAgentForm] = useState(false);
  const [newAgent, setNewAgent] = useState({ username: '', password: '', fullName: '', phone: '' });
  const [savingAgent, setSavingAgent] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null);

  // Load delivery agents when switching to delivery tab
  useEffect(() => {
    if (activeTab === 'delivery') {
      loadDeliveryAgents();
    }
  }, [activeTab]);

  const loadDeliveryAgents = async () => {
    try {
      const agents = await getAllDeliveryAgents();
      setDeliveryAgents(agents);
    } catch (err) {
      console.error('Error loading delivery agents:', err);
    }
  };

  const handleAddAgent = async () => {
    if (!newAgent.username || !newAgent.password || !newAgent.fullName) {
      setError('Username, password, and name are required');
      return;
    }

    setSavingAgent(true);
    try {
      const agent = await createDeliveryAgent(
        newAgent.username,
        newAgent.password,
        newAgent.fullName,
        newAgent.phone
      );
      setDeliveryAgents([agent, ...deliveryAgents]);
      setShowAddAgentForm(false);
      setNewAgent({ username: '', password: '', fullName: '', phone: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to add delivery agent');
    } finally {
      setSavingAgent(false);
    }
  };

  const handleToggleAgentStatus = async (agent: DeliveryAgent) => {
    try {
      await updateDeliveryAgent(agent.id, { is_active: !agent.is_active });
      setDeliveryAgents(prev =>
        prev.map(a => a.id === agent.id ? { ...a, is_active: !a.is_active } : a)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update agent status');
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery agent?')) return;
    
    setDeletingAgent(id);
    try {
      await deleteDeliveryAgent(id);
      setDeliveryAgents(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete agent');
    } finally {
      setDeletingAgent(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Logged in as: <span className="font-semibold">{adminUser?.username}</span>
            <span className="ml-4 text-xs text-green-600 flex items-center gap-1 inline-flex">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Auto-refreshing every 30s
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'refresh'}
            </span>
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-6 py-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'delivery'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Delivery Agents
          </button>
          {adminUser?.can_manage_admins && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Manage Admins
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Users */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{userStats.totalUsers}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10h.01M13 16h2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* New Users This Month */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">New Users (This Month)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{userStats.newUsersThisMonth}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{orderStats.totalOrders}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">₹{orderStats.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Monthly: ₹{orderStats.monthlyRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{order.order_number}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{order.customer_name}</td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">₹{order.total_amount.toFixed(2)}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">All Orders ({orders.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order #</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                            selectedOrder?.id === order.id ? 'bg-green-50' : ''
                          }`}
                        >
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">{order.order_number}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">{order.customer_name}</td>
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">₹{order.total_amount.toFixed(2)}</td>
                          <td className="px-6 py-3 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={(e) => handleDeleteOrder(order.id, e)}
                              disabled={deletingOrder === order.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Delete order"
                            >
                              {deletingOrder === order.id ? (
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <span className="material-symbols-outlined text-lg">delete</span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div>
              {selectedOrder ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.order_number}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-2xl font-bold text-gray-900">₹{selectedOrder.total_amount.toFixed(2)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Order Status</p>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleOrderStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                      <p className={`px-3 py-1 rounded inline-block text-xs font-semibold ${
                        selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedOrder.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrder.payment_status}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="text-gray-900">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600">Select an order to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined">{showAddForm ? 'close' : 'add'}</span>
                {showAddForm ? 'Cancel' : 'Add New Product'}
              </button>
            </div>

            {/* Add Product Form */}
            {showAddForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
                <div className="space-y-4">
                  {/* Image Upload for New Product */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative flex items-center justify-center">
                        {newProduct.image ? (
                          <img
                            src={newProduct.image}
                            alt="New product"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-4xl text-gray-400">image</span>
                        )}
                        {uploadingImage && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <input
                            ref={newProductFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleNewProductImageUpload}
                            className="hidden"
                            id="new-product-image-upload"
                          />
                          <label
                            htmlFor="new-product-image-upload"
                            className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className="material-symbols-outlined text-lg">upload</span>
                            {uploadingImage ? 'Uploading...' : 'Upload Image'}
                          </label>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Or enter image URL:</p>
                          <input
                            type="url"
                            value={newProduct.image || ''}
                            onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={newProduct.name || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="e.g., Green Detox Juice"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        value={newProduct.price || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        placeholder="249.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newProduct.description || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      rows={3}
                      placeholder="Describe the product..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newProduct.category || 'juice'}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      >
                        <option value="juice">Juice</option>
                        <option value="smoothie">Smoothie</option>
                        <option value="shot">Shot</option>
                        <option value="snack">Snack</option>
                        <option value="bundle">Bundle</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newProduct.isBestSeller || false}
                          onChange={(e) => setNewProduct({ ...newProduct, isBestSeller: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Best Seller</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newProduct.isNew !== false}
                          onChange={(e) => setNewProduct({ ...newProduct, isNew: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">New</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma separated)</label>
                    <input
                      type="text"
                      value={newProduct.ingredientsText !== undefined ? newProduct.ingredientsText : (newProduct.ingredients || []).join(', ')}
                      onChange={(e) => setNewProduct({ 
                        ...newProduct, 
                        ingredientsText: e.target.value,
                        ingredients: e.target.value.split(',').map(i => i.trim()).filter(i => i) 
                      })}
                      onBlur={(e) => setNewProduct({
                        ...newProduct,
                        ingredientsText: undefined,
                        ingredients: e.target.value.split(',').map((i: string) => i.trim()).filter((i: string) => i)
                      })}
                      placeholder="e.g., Apple, Kale, Spinach"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (comma separated)</label>
                    <input
                      type="text"
                      value={newProduct.benefitsText !== undefined ? newProduct.benefitsText : (newProduct.benefits || []).join(', ')}
                      onChange={(e) => setNewProduct({ 
                        ...newProduct, 
                        benefitsText: e.target.value,
                        benefits: e.target.value.split(',').map(b => b.trim()).filter(b => b) 
                      })}
                      onBlur={(e) => setNewProduct({
                        ...newProduct,
                        benefitsText: undefined,
                        benefits: e.target.value.split(',').map((b: string) => b.trim()).filter((b: string) => b)
                      })}
                      placeholder="e.g., Energy, Immunity, Detox"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAddProduct}
                      disabled={savingProduct || uploadingImage || !newProduct.name || !newProduct.price}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {savingProduct ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">add</span>
                          Add Product
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      disabled={savingProduct}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {editingProduct ? (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Product</h3>
                <div className="space-y-4">
                  {/* Image Preview and Edit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        <img
                          src={editingProduct.image}
                          alt={editingProduct.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                        {uploadingImage && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        {/* File Upload */}
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className="material-symbols-outlined text-lg">upload</span>
                            {uploadingImage ? 'Uploading...' : 'Upload Image'}
                          </label>
                          <p className="text-xs text-gray-500 mt-1">Upload to Supabase Storage (JPEG, PNG, WebP, GIF - max 5MB)</p>
                        </div>
                        
                        {/* URL Input */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Or enter image URL directly:</p>
                          <input
                            type="url"
                            value={editingProduct.image}
                            onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={editingProduct.category || 'juice'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      >
                        <option value="juice">Juice</option>
                        <option value="smoothie">Smoothie</option>
                        <option value="snack">Snack</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                      <select
                        value={editingProduct.isAvailable !== false ? 'available' : 'unavailable'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isAvailable: e.target.value === 'available' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      >
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma separated)</label>
                    <input
                      type="text"
                      value={editingProduct.ingredientsText !== undefined ? editingProduct.ingredientsText : (editingProduct.ingredients || []).join(', ')}
                      onChange={(e) => setEditingProduct({ 
                        ...editingProduct, 
                        ingredientsText: e.target.value
                      })}
                      onBlur={(e) => setEditingProduct({
                        ...editingProduct,
                        ingredientsText: undefined,
                        ingredients: e.target.value.split(',').map((i: string) => i.trim()).filter((i: string) => i)
                      })}
                      placeholder="e.g., Apple, Kale, Spinach"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (comma separated)</label>
                    <input
                      type="text"
                      value={editingProduct.benefitsText !== undefined ? editingProduct.benefitsText : (editingProduct.benefits || []).join(', ')}
                      onChange={(e) => setEditingProduct({ 
                        ...editingProduct, 
                        benefitsText: e.target.value
                      })}
                      onBlur={(e) => setEditingProduct({
                        ...editingProduct,
                        benefitsText: undefined,
                        benefits: e.target.value.split(',').map((b: string) => b.trim()).filter((b: string) => b)
                      })}
                      placeholder="e.g., Energy, Immunity, Detox"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={saveProductChanges}
                      disabled={savingProduct || uploadingImage}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {savingProduct ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      onClick={cancelProductEdit}
                      disabled={savingProduct}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className={`bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition ${product.isAvailable === false ? 'opacity-60' : ''}`}>
                  <div className="aspect-square overflow-hidden bg-gray-100 relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.isAvailable === false && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">Unavailable</span>
                      </div>
                    )}
                    {product.isBestSeller && (
                      <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">Best Seller</span>
                    )}
                    {product.isNew && (
                      <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">New</span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Category: {product.category}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>

                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                      <span className="text-sm text-gray-600">★ {product.rating}</span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleProductUpdate(product)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deletingProduct === product.id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center"
                      >
                        {deletingProduct === product.id ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span className="material-symbols-outlined text-lg">delete</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab - NEW */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fee Management</h2>
            
            {feeMessage && (
              <div className={`p-4 rounded-lg mb-6 ${
                feeMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {feeMessage.text}
              </div>
            )}

            <div className="max-w-2xl">
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Delivery Fees</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shipping Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={feeSettings.shipping_fee}
                        onChange={(e) => setFeeSettings({ ...feeSettings, shipping_fee: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Base delivery charge for all orders</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Free Shipping Above (₹)
                      </label>
                      <input
                        type="number"
                        value={feeSettings.free_shipping_threshold}
                        onChange={(e) => setFeeSettings({ ...feeSettings, free_shipping_threshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Additional Charges</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Packaging Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={feeSettings.packaging_fee}
                        onChange={(e) => setFeeSettings({ ...feeSettings, packaging_fee: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Percentage (%)
                      </label>
                      <input
                        type="number"
                        value={feeSettings.tax_percentage}
                        onChange={(e) => setFeeSettings({ ...feeSettings, tax_percentage: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feeSettings.is_active}
                      onChange={(e) => setFeeSettings({ ...feeSettings, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable extra fees</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-8">When disabled, only product prices are charged</p>
                </div>

                <button
                  onClick={saveFeeSettings}
                  disabled={savingFees}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {savingFees ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Agents Tab */}
        {activeTab === 'delivery' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Delivery Agents</h2>
              <button
                onClick={() => setShowAddAgentForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined">person_add</span>
                Add Delivery Agent
              </button>
            </div>

            {/* Add Agent Form */}
            {showAddAgentForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Delivery Agent</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <input
                      type="text"
                      value={newAgent.username}
                      onChange={(e) => setNewAgent({ ...newAgent, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      placeholder="e.g., driver1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={newAgent.password}
                      onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={newAgent.fullName}
                      onChange={(e) => setNewAgent({ ...newAgent, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newAgent.phone}
                      onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-600"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddAgent}
                    disabled={savingAgent}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
                  >
                    {savingAgent ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">check</span>
                        Add Agent
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddAgentForm(false);
                      setNewAgent({ username: '', password: '', fullName: '', phone: '' });
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Agents List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveryAgents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 block">local_shipping</span>
                        No delivery agents yet. Click "Add Delivery Agent" to get started.
                      </td>
                    </tr>
                  ) : (
                    deliveryAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-green-600">local_shipping</span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{agent.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{agent.username}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{agent.phone || '—'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleAgentStatus(agent)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition ${
                              agent.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {agent.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteAgent(agent.id)}
                            disabled={deletingAgent === agent.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deletingAgent === agent.id ? (
                              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className="material-symbols-outlined">delete</span>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === 'admin' && (
          <AdminManagement />
        )}
      </div>
    </div>
  );
};
