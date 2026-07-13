/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getAllOrders, 
  updateOrderStatus,
  getAllReviews,
  approveReview,
  deleteReview,
  getAllUserProfiles,
  addInventoryLog
} from '../services/dbService';
import { Product, Order, Review, UserProfile } from '../types';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Package, 
  ShoppingBag, 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  X, 
  AlertCircle, 
  ShieldAlert, 
  Star,
  Menu,
  LayoutDashboard,
  Users,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  LogOut,
  Store,
  ChevronRight,
  Eye,
  Settings,
  HelpCircle,
  Edit,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

// Modular Sub-components
import { AdminOverview } from '../components/AdminOverview';
import { AdminCharts } from '../components/AdminCharts';
import { AdminCustomers } from '../components/AdminCustomers';
import { AdminNotifications } from '../components/AdminNotifications';
import { AdminProductForm } from '../components/AdminProductForm';
import { AdminInventory } from '../components/AdminInventory';
import { AdminOrders } from '../components/AdminOrders';

export const Admin: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Primary Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // App Layout States
  const [activeSection, setActiveSection] = useState<'overview' | 'sales' | 'orders' | 'products' | 'customers' | 'reviews' | 'notifications' | 'inventory'>('overview');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Lightbox Modal for review images
  const [selectedModalImage, setSelectedModalImage] = useState<string | null>(null);

  // Product Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);

  // Product Catalog filter states
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('All');

  // Orders logistics filter states
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);

      const fetchedOrders = await getAllOrders();
      setOrders(fetchedOrders);

      const fetchedReviews = await getAllReviews();
      setReviews(fetchedReviews);

      const fetchedUsers = await getAllUserProfiles();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Error fetching admin dashboard logs:', err);
      toast.error("Failed to sync some sections with Firestore.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Unauthorized entry. Relocated to safe user dashboard.");
      navigate('/profile');
      return;
    }

    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, authLoading]);

  // CRUD Product Actions
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from Firestore?`)) return;
    try {
      const targetProduct = products.find(p => p.id === id);
      const lastStock = targetProduct ? targetProduct.stock : 0;
      
      await deleteProduct(id);
      
      await addInventoryLog({
        productId: id,
        productName: name,
        changeType: 'delete_product',
        quantityChanged: -lastStock,
        oldStock: lastStock,
        newStock: 0,
        notes: `Permanently deleted product "${name}" from catalog`
      });

      toast.success(`Removed "${name}" from e-store registry.`);
      await fetchAdminData();
    } catch (err) {
      toast.error("Failed to delete from Firestore.");
    }
  };

  const handleUpdateStock = async (id: string, currentStock: number, change: number) => {
    const updatedStock = Math.max(0, currentStock + change);
    try {
      const targetProduct = products.find(p => p.id === id);
      const prodName = targetProduct ? targetProduct.name : 'Unknown Product';
      
      await updateProduct(id, { stock: updatedStock });
      
      await addInventoryLog({
        productId: id,
        productName: prodName,
        changeType: change > 0 ? 'manual_restock' : 'manual_adjustment',
        quantityChanged: change,
        oldStock: currentStock,
        newStock: updatedStock,
        notes: change > 0 ? 'Direct restock (+) in catalog' : 'Direct deduction (-) in catalog'
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: updatedStock } : p))
      );
      toast.success("Stock level updated", { id: "stock-success", duration: 1000 });
    } catch (err) {
      toast.error("Failed to update stock in Firestore.");
    }
  };

  // Logistics & Status Actions
  const handleUpdateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o))
      );
      toast.success(`Order ${orderId} updated to: ${status.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to update order in Firestore.");
    }
  };

  // Moderator Review Actions
  const handleApproveReview = async (reviewId: string) => {
    try {
      await approveReview(reviewId);
      toast.success("Review approved successfully! Aggregates refreshed.", { icon: '⭐️' });
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve review.");
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to reject and delete this review?")) return;
    try {
      await deleteReview(reviewId);
      toast.success("Review deleted and removed from database.");
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject and delete review.");
    }
  };

  // Calculated Analytics metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  // Filters for Products catalog
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) || 
                          p.id.toLowerCase().includes(prodSearch.toLowerCase()) ||
                          p.category.toLowerCase().includes(prodSearch.toLowerCase());
    const matchesCategory = prodCategoryFilter === 'All' || p.category === prodCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filters for Orders logistics
  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'All') return true;
    return o.orderStatus.toLowerCase() === orderStatusFilter.toLowerCase();
  });

  if (authLoading || loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-xs text-gray-400 font-mono">Synchronizing admin dashboard with Firestore logs...</p>
      </div>
    );
  }

  interface SidebarItem {
    id: 'overview' | 'sales' | 'orders' | 'products' | 'customers' | 'reviews' | 'notifications' | 'inventory';
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
  }

  // Sidebar navigation items
  const sidebarNavItems: SidebarItem[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'sales', label: 'Analytics & Charts', icon: TrendingUp },
    { id: 'orders', label: 'Order Logistics', icon: ShoppingBag, badge: orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'processing').length },
    { id: 'products', label: 'Catalog Products', icon: Package },
    { id: 'inventory', label: 'Inventory Control', icon: Database, badge: products.filter(p => p.stock <= 5).length },
    { id: 'customers', label: 'Customer Registry', icon: Users },
    { id: 'reviews', label: 'Review Moderation', icon: MessageSquare, badge: reviews.filter(r => !r.approved).length },
    { id: 'notifications', label: 'System Logs', icon: Bell, badge: reviews.filter(r => !r.approved).length + products.filter(p => p.stock <= 5).length }
  ];

  return (
    <div className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 ${
      isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      
      {/* 1. DESKTOP PERSISTENT SIDEBAR */}
      <aside className={`hidden md:flex flex-col w-64 shrink-0 border-r py-6 px-4 justify-between h-screen sticky top-0 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'
      }`}>
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center border border-zinc-700 shadow-lg">
              <span className="text-white text-xs font-black font-mono">MK</span>
            </div>
            <div>
              <h1 className="text-xs font-black tracking-widest uppercase font-mono">MK BACKOFFICE</h1>
              <p className="text-[9px] text-neutral-400 font-mono font-semibold">SECURE ACCESS LEVEL v1.2</p>
            </div>
          </div>

          {/* Navigation Directory links */}
          <nav className="space-y-1">
            <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-widest px-2 block mb-2">Directory</span>
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all uppercase tracking-wide text-left cursor-pointer ${
                    isActive 
                      ? 'bg-black text-white shadow-md' 
                      : isDarkMode 
                        ? 'text-neutral-400 hover:text-white hover:bg-zinc-850/50' 
                        : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono leading-none ${
                      isActive ? 'bg-white text-black' : 'bg-red-500 text-white animate-pulse'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel Controls */}
        <div className="space-y-4 pt-6 border-t border-neutral-100/10">
          {/* Dark Mode toggle button */}
          <button
            onClick={() => setIsDarkMode(prev => !prev)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              isDarkMode ? 'bg-zinc-850/60 text-amber-400 hover:bg-zinc-800' : 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDarkMode ? 'LIGHT SKIN' : 'DARK OBSIDIAN'}</span>
            </div>
            <span className="text-[9px] font-bold uppercase text-neutral-400">Toggle</span>
          </button>

          {/* Return to client shop */}
          <button
            onClick={() => navigate('/shop')}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              isDarkMode ? 'text-neutral-400 hover:text-white hover:bg-zinc-850/50' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>RETURN TO SHOP</span>
          </button>

          {/* Admin Info Summary */}
          <div className="flex items-center gap-3 px-2 pt-2 border-t border-neutral-100/10 text-xs">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold font-mono text-white text-xs shrink-0">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{user?.displayName || 'Authorized Admin'}</p>
              <p className="text-[10px] text-neutral-400 truncate font-mono">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION SIDEBAR DRAWERS */}
      <header className={`md:hidden sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b ${
        isDarkMode ? 'bg-zinc-950 border-zinc-900 text-white' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpenMobile(true)}
            className={`p-2 rounded-xl border ${
              isDarkMode ? 'border-zinc-800 text-zinc-300 bg-zinc-900/50' : 'border-neutral-250 text-gray-700 bg-neutral-50'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-black tracking-widest uppercase font-mono">MK DASHBOARD</span>
        </div>

        <button
          onClick={() => setIsDarkMode(prev => !prev)}
          className="p-2 rounded-xl text-amber-500"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpenMobile && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" onClick={() => setIsSidebarOpenMobile(false)}></div>
          <div className={`fixed inset-y-0 left-0 w-64 z-50 flex flex-col justify-between py-6 px-4 transition-all duration-300 animate-in slide-in-from-left ${
            isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-neutral-900'
          }`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center border border-zinc-700">
                    <span className="text-white text-xs font-black font-mono">MK</span>
                  </div>
                  <span className="text-xs font-black font-mono tracking-widest">BACKOFFICE</span>
                </div>
                <button onClick={() => setIsSidebarOpenMobile(false)} className="p-1 rounded-full hover:bg-neutral-100/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="space-y-1">
                {sidebarNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setIsSidebarOpenMobile(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all uppercase tracking-wide text-left ${
                        isActive 
                          ? 'bg-black text-white' 
                          : isDarkMode 
                            ? 'text-neutral-400 hover:text-white hover:bg-zinc-850/50' 
                            : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono leading-none">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3 pt-4 border-t border-neutral-100/10">
              <button
                onClick={() => { navigate('/shop'); setIsSidebarOpenMobile(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold font-mono text-neutral-400"
              >
                <Store className="w-4 h-4" />
                <span>Return to Shop</span>
              </button>
              <div className="flex items-center gap-3 px-2 pt-2 text-xs">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white">AD</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{user?.displayName || 'Admin'}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. MAIN CONTENT FRAME */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 md:py-10 max-w-7xl mx-auto w-full">
        
        {/* Dynamic Section Orchestrator */}
        {activeSection === 'overview' && (
          <AdminOverview
            orders={orders}
            products={products}
            reviews={reviews}
            users={users}
            totalRevenue={totalRevenue}
            onNavigate={(sec) => setActiveSection(sec)}
            onApproveReview={handleApproveReview}
            onRejectReview={handleRejectReview}
            isDarkMode={isDarkMode}
          />
        )}

        {activeSection === 'sales' && (
          <AdminCharts
            orders={orders}
            products={products}
            isDarkMode={isDarkMode}
          />
        )}

        {activeSection === 'customers' && (
          <AdminCustomers
            users={users}
            orders={orders}
            products={products}
            isDarkMode={isDarkMode}
          />
        )}

        {activeSection === 'notifications' && (
          <AdminNotifications
            orders={orders}
            products={products}
            reviews={reviews}
            isDarkMode={isDarkMode}
            onNavigate={(sec) => setActiveSection(sec)}
          />
        )}

        {/* INLINE TAB: CUSTOMER LOGISTICS (ORDERS) */}
        {activeSection === 'orders' && (
          <AdminOrders
            orders={orders}
            onOrderUpdated={fetchAdminData}
            isDarkMode={isDarkMode}
          />
        )}

        {/* INLINE TAB: CATALOG PRODUCTS */}
        {activeSection === 'products' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100/10 pb-4">
              <div>
                <h2 className="text-lg font-bold font-sans tracking-tight">Active Product Registry</h2>
                <p className="text-xs text-neutral-400 font-sans">
                  Directly modify stocks, delete pieces, and expand collections in real-time.
                </p>
              </div>
              
              <button
                onClick={() => {
                  setSelectedProductForEdit(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center justify-center bg-black text-white hover:bg-neutral-800 border border-zinc-700 font-mono font-bold px-4 py-2.5 rounded-2xl text-[10px] tracking-wider uppercase shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5 text-emerald-500" />
                Add New Apparel Piece
              </button>
            </div>

            {/* Catalog Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className={`relative w-full sm:max-w-xs flex items-center border rounded-xl px-3 py-2 ${
                isDarkMode ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-white border-neutral-250 text-gray-800'
              }`}>
                <input
                  type="text"
                  placeholder="Search products by name/id..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="bg-transparent focus:outline-none text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400 uppercase">Collection:</span>
                <select
                  value={prodCategoryFilter}
                  onChange={(e) => setProdCategoryFilter(e.target.value)}
                  className={`border rounded-xl px-3 py-1.5 text-xs font-mono font-semibold outline-none cursor-pointer ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-white border-neutral-250 text-gray-700'
                  }`}
                >
                  <option value="All">All Categories</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Tops">Tops</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Activewear">Activewear</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Formal">Formal</option>
                  <option value="Unstitched">Unstitched</option>
                </select>
              </div>
            </div>

            {/* Catalog Table */}
            <div className={`border rounded-3xl overflow-hidden ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left divide-y divide-neutral-100/10 font-sans">
                  <thead className={`text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider ${
                    isDarkMode ? 'bg-zinc-950' : 'bg-neutral-50'
                  }`}>
                    <tr>
                      <th className="py-3 px-4">Design piece</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Rating Index</th>
                      <th className="py-3 px-4">Direct Stock Controls</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100/5">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-neutral-400 italic">No products matched the active search filters.</td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className={isDarkMode ? 'hover:bg-zinc-850/50' : 'hover:bg-neutral-50/50'}>
                          <td className="py-3 px-4 font-medium text-gray-900 max-w-[200px] truncate">
                            <div className="flex items-center gap-3">
                              <img src={p.images[0]} alt="" className="w-7 h-9 object-cover rounded bg-neutral-200" referrerPolicy="no-referrer" />
                              <span className={`font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-neutral-900'}`}>{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold uppercase font-mono text-[10px] text-neutral-400">{p.category}</td>
                          <td className={`py-3 px-4 font-bold font-mono ${isDarkMode ? 'text-zinc-100' : 'text-neutral-900'}`}>${p.price}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-amber-500 font-mono font-bold">
                              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                              {p.rating} <span className="text-neutral-400 font-normal">({p.reviewCount})</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateStock(p.id, p.stock, -1)}
                                className={`p-1 px-2.5 border rounded-lg font-black font-mono text-xs cursor-pointer ${
                                  isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'border-neutral-250 text-neutral-500 hover:text-black hover:bg-neutral-50'
                                }`}
                              >
                                -
                              </button>
                              <span className={`font-black min-w-[24px] text-center font-mono text-xs ${p.stock === 0 ? 'text-red-500' : isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                                {p.stock}
                              </span>
                              <button
                                onClick={() => handleUpdateStock(p.id, p.stock, 1)}
                                className={`p-1 px-2.5 border rounded-lg font-black font-mono text-xs cursor-pointer ${
                                  isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'border-neutral-250 text-neutral-500 hover:text-black hover:bg-neutral-50'
                                }`}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedProductForEdit(p);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 hover:bg-blue-500/10 text-neutral-400 hover:text-blue-500 rounded-lg transition-colors cursor-pointer"
                                title="Edit product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* INLINE TAB: REVIEWS MODERATION */}
        {activeSection === 'reviews' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100/10 pb-4">
              <div>
                <h2 className="text-lg font-bold font-sans tracking-tight">Reviews Moderation Panel</h2>
                <p className="text-xs text-neutral-400 font-sans">
                  Moderate customer feedback reviews to keep the apparel public score authentic and clean.
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-xl font-bold font-mono text-[10px] uppercase">
                  {reviews.filter(r => !r.approved).length} Pending Moderation
                </span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className={`text-xs italic py-12 text-center rounded-3xl border ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 text-neutral-400' : 'bg-white border-neutral-150 text-gray-400'
              }`}>No customer reviews submitted yet.</p>
            ) : (
              <div className="space-y-6 divide-y divide-neutral-100/10">
                {reviews.map((rev, idx) => {
                  const linkedProduct = products.find(p => p.id === rev.productId);
                  return (
                    <div key={rev.id} className={`space-y-3 ${idx > 0 ? 'pt-6' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm leading-snug">{rev.userName}</span>
                            {rev.isVerifiedPurchase && (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-full">
                                Verified Purchase
                              </span>
                            )}
                            {rev.approved ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-full">
                                Approved
                              </span>
                            ) : (
                              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-full">
                                Pending Approval
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            Review ID: {rev.id} | Product: <span className={isDarkMode ? 'text-zinc-100' : 'text-neutral-900 font-semibold'}>{linkedProduct?.name || rev.productId}</span>
                          </p>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(rev.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                             key={s}
                             className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current text-amber-400' : 'text-zinc-700'}`}
                          />
                        ))}
                      </div>

                      {/* Comment */}
                      <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line p-4 rounded-3xl border ${
                        isDarkMode ? 'bg-zinc-950 border-zinc-850/80' : 'bg-neutral-50 border-neutral-200/50'
                      }`}>
                        {rev.comment}
                      </p>

                      {/* Attached Showcase Images */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex gap-2 pt-1">
                          {rev.images.map((imgUrl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedModalImage(imgUrl)}
                              className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-800 hover:border-white/50 hover:shadow-sm transition-all cursor-zoom-in flex-shrink-0"
                            >
                              <img src={imgUrl} alt="Review Showcase" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Moderation Actions */}
                      <div className="flex items-center gap-3 pt-1">
                        {!rev.approved && (
                          <button
                            onClick={() => handleApproveReview(rev.id)}
                            className="bg-black text-white hover:bg-zinc-850 font-mono text-[10px] font-bold px-4 py-2 rounded-xl border border-zinc-700 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Approve & Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleRejectReview(rev.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-mono text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Reject / Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* INLINE TAB: INVENTORY CONTROLS */}
        {activeSection === 'inventory' && (
          <AdminInventory
            products={products}
            onProductUpdated={fetchAdminData}
            isDarkMode={isDarkMode}
          />
        )}

      </main>

      {/* 4. MODALS & SLIDING CREATE PRODUCT DRAWER */}
      {selectedModalImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedModalImage(null)}>
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl flex items-center justify-center border border-white/10" onClick={(e) => e.stopPropagation()}>
            <img src={selectedModalImage} alt="Fullscreen Attachment" className="max-w-full max-h-[80vh] object-contain" />
            <button
              onClick={() => setSelectedModalImage(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isFormOpen && (
        <AdminProductForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedProductForEdit(null);
          }}
          onSuccess={fetchAdminData}
          productToEdit={selectedProductForEdit}
          isDarkMode={isDarkMode}
        />
      )}

    </div>
  );
};
