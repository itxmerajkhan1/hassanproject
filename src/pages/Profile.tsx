/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, LogOut, Loader2, Sparkles, User, Package, Calendar, MapPin, Phone, CheckCircle, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProducts, getUserOrders, subscribeProducts, subscribeUserOrders } from '../services/dbService';
import { Product, Order } from '../types';
import { ProductCard } from '../components/ProductCard';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

export const Profile: React.FC = () => {
  useSEO({
    title: 'Client Portal & Atelier Profile',
    description: 'Manage your unstitched collections, review active wishlists, track purchase orders, and edit delivery details.'
  });

  const { user, profile, loading, signUp, signIn, signOut, wishlist, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'wishlist' | 'orders' | 'details'>('wishlist');
  const navigate = useNavigate();

  // Redirect to admin panel if user is admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, navigate]);

  // Authenticated database fetch states
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Sign In / Sign Up Forms State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Sync tab from URL query params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'orders' || tabParam === 'wishlist' || tabParam === 'details') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load wishlist products and past orders in real-time when user profile is loaded
  useEffect(() => {
    if (!user) return;
    
    setFetchingData(true);
    
    // Subscribe to products to compute wishlist items in real-time
    const unsubscribeProducts = subscribeProducts(
      (allProducts) => {
        const wishlisted = allProducts.filter((p) => wishlist.includes(p.id));
        setWishlistProducts(wishlisted);
        setFetchingData(false);
      },
      (err) => {
        console.error('Error in real-time wishlist products:', err);
        setFetchingData(false);
      }
    );

    // Subscribe to user orders in real-time
    const unsubscribeOrders = subscribeUserOrders(
      user.uid,
      (userOrders) => {
        setOrders(userOrders);
      },
      (err) => {
        console.error('Error in real-time user orders:', err);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [user, wishlist]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password.");
      return;
    }
    setAuthSubmitting(true);
    try {
      await signIn(email.trim(), password.trim());
      toast.success("Welcome back to MK Fashion!", {
        icon: '🖤',
        style: { borderRadius: '12px' }
      });
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please verify your entries.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("All registration fields are required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setAuthSubmitting(true);
    try {
      await signUp(email.trim(), password.trim(), name.trim());
      toast.success("Account registered successfully! Welcome to the Circle.", {
        icon: '✨',
        style: { borderRadius: '12px' }
      });
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Email might already be taken.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const getStatusColor = (status: Order['orderStatus']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        <p className="text-xs text-gray-400 font-mono">Securing profile connection...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {!user ? (
        
        /* ================= AUTHENTICATION SPLIT SCREEN ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white/40 backdrop-blur-md border border-gray-100/50 rounded-3xl overflow-hidden shadow-xl max-w-5xl mx-auto">
          
          {/* Left Block: Creative brand editorial */}
          <div className="lg:col-span-5 bg-neutral-950 p-8 sm:p-12 text-white flex flex-col justify-between space-y-16 relative">
            <div className="absolute inset-0 opacity-40">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80"
                alt="MK editorial back"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black"></div>
            </div>
            
            <div className="relative space-y-2 z-10">
              <span className="font-mono text-[10px] font-bold tracking-widest text-neutral-400">MK CIRCLE MEMBERSHIP</span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
                Unlock your curated wardrobe
              </h2>
            </div>

            <div className="relative space-y-4 z-10 text-xs text-neutral-400 leading-relaxed font-light">
              <p>• Save tailored items to your permanent wishlist</p>
              <p>• Fast, tracked checkouts and free express carrier shipping</p>
              <p>• View complete history invoices and tracking records</p>
            </div>

            <div className="relative border-t border-white/10 pt-4 text-[10px] text-neutral-500 font-mono z-10">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500 inline mr-1.5" />
              Apple Design Standards e-Store
            </div>
          </div>

          {/* Right Block: Glassmorphic form sheets */}
          <div className="lg:col-span-7 p-8 sm:p-12 space-y-8">
            <div className="flex border-b border-gray-100 pb-2">
              <button
                onClick={() => setAuthMode('signin')}
                className={`flex-1 text-center pb-2 text-sm font-semibold tracking-wider transition-colors cursor-pointer uppercase ${
                  authMode === 'signin' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 text-center pb-2 text-sm font-semibold tracking-wider transition-colors cursor-pointer uppercase ${
                  authMode === 'signup' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                REGISTER
              </button>
            </div>

            {authMode === 'signin' ? (
              /* SIGN IN FORM */
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase font-mono">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase font-mono">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold py-3.5 rounded-xl tracking-widest uppercase flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ENTER ACCOUNT'}
                </button>
                
                <p className="text-[11px] text-gray-400 text-center font-mono pt-2">
                  Test account email: <strong className="text-gray-600">user@mkfashion.com</strong> / password: <strong className="text-gray-600">123456</strong>
                </p>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase font-mono">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sophia Loren"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase font-mono">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase font-mono">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Create security password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold py-3.5 rounded-xl tracking-widest uppercase flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CREATE COLLECTOR PROFILE'}
                </button>
              </form>
            )}
          </div>

        </div>
      ) : (
        
        /* ================= AUTHENTICATED PROFILE VIEW ================= */
        <div className="space-y-10">
          
          {/* User Header Block */}
          <div className="bg-neutral-50 rounded-3xl border border-neutral-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold font-sans">
                {profile?.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900">
                  Welcome, {profile?.displayName || 'Fashion Collector'}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-mono">
                  <span>{user.email}</span>
                  <span className="text-gray-300">•</span>
                  <span>Member since {new Date(profile?.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-3 rounded-xl tracking-wide transition-all"
                >
                  ADMIN PANELS
                </Link>
              )}
              <button
                onClick={signOut}
                className="flex-1 sm:flex-none inline-flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-3 rounded-xl tracking-wide transition-all"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                SIGN OUT
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-gray-100 gap-6 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'wishlist' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'
              }`}
            >
              <Heart className="w-4 h-4" />
              Wishlist Archive ({wishlist.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Order Tracking ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'details' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'
              }`}
            >
              <User className="w-4 h-4" />
              Collector Details
            </button>
          </div>

          {/* Tab Contents Frame */}
          <div>
            {fetchingData ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                <p className="text-xs text-gray-400 font-mono">Synchronizing collection files...</p>
              </div>
            ) : activeTab === 'wishlist' ? (
              /* WISHLIST TAB CONTAINER */
              wishlistProducts.length === 0 ? (
                <div className="py-20 border border-dashed border-gray-200 rounded-3xl text-center max-w-lg mx-auto space-y-4 px-6">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-800">Your wishlist archive is empty</h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                      Review garments specifications in our collections and tap hearts to save customized staples here.
                    </p>
                  </div>
                  <Link
                    to="/shop"
                    className="inline-block bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all"
                  >
                    DISCOVER COLLECTIONS
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-300">
                  {wishlistProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )
            ) : activeTab === 'orders' ? (
              /* ORDER HISTORY TAB CONTAINER */
              orders.length === 0 ? (
                <div className="py-20 border border-dashed border-gray-200 rounded-3xl text-center max-w-lg mx-auto space-y-4 px-6">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-800">No registered purchases found</h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                      Looks like you haven't processed any e-commerce orders with us yet.
                    </p>
                  </div>
                  <Link
                    to="/shop"
                    className="inline-block bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all"
                  >
                    SHOP IN THE CATALOG
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-100/80 rounded-2xl p-5 sm:p-6 shadow-sm divide-y divide-gray-100 space-y-4 animate-in fade-in duration-300"
                    >
                      {/* Order top banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 font-mono">ORDER CODE: {order.id}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Ordered on {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border tracking-wider uppercase font-mono ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>
                          <span className="text-sm font-bold text-gray-900 font-mono">Total: ${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Items row list */}
                      <div className="py-4 space-y-3.5">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex gap-4 items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={it.image}
                                alt={it.name}
                                className="w-12 h-15 object-cover rounded-lg bg-gray-50"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h4 className="text-xs sm:text-sm font-semibold text-gray-800 leading-tight">
                                  {it.name}
                                </h4>
                                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                  Size: {it.selectedSize} | Color: {it.selectedColor} | Qty: {it.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-gray-800 font-mono">${(it.price * it.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address and support note */}
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-gray-500">
                        <div className="space-y-1 border-r border-gray-50 pr-4">
                          <p className="font-bold text-gray-400 uppercase font-mono">DELIVERY ADDRESS</p>
                          <p className="font-semibold text-gray-800">{order.shippingAddress.fullName}</p>
                          <p>{order.shippingAddress.addressLine1} {order.shippingAddress.addressLine2}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                        </div>
                        <div className="space-y-2 flex flex-col justify-between">
                          <div>
                            <p className="font-bold text-gray-400 uppercase font-mono">ESTIMATED LOGISTICS</p>
                            {order.orderStatus === 'delivered' ? (
                              <p className="text-green-700 flex items-center gap-1.5 font-semibold mt-1">
                                <CheckCircle className="w-4 h-4 text-green-600" /> Package delivered securely. Thank you.
                              </p>
                            ) : (
                              <p className="leading-relaxed mt-1">
                                Your order is in the registry queue. Our tailoring and shipping partners operate at premium tempos. Transit codes will update via Firestore records.
                              </p>
                            )}
                          </div>
                          <div className="pt-2">
                            <Link
                              to={`/track/${order.id}`}
                              className="inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs tracking-wider uppercase shadow-sm transition-all cursor-pointer gap-1.5 font-mono"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-400" />
                              Track Order Live
                            </Link>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )
            ) : (
              /* COLLECTOR DETAILS CONFIG */
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-gray-900">Your Registry Account Credentials</h3>
                  <p className="text-xs text-gray-500">Managed safely via Firebase Authentication Services.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 uppercase font-mono">Full Name</span>
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-semibold text-gray-800">
                      {profile?.displayName}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 uppercase font-mono">Email Address</span>
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-semibold text-gray-800">
                      {user.email}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 uppercase font-mono">Member Account UID</span>
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-500 font-mono truncate">
                      {user.uid}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-gray-400 uppercase font-mono">Registry Database Code</span>
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-500 font-mono truncate">
                      firestore-ai-studio-member
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
