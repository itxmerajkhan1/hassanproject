/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Clock, 
  ShieldCheck, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Search, 
  ArrowLeft, 
  Loader2, 
  RefreshCw, 
  XCircle, 
  FileText, 
  Calendar, 
  DollarSign, 
  ShoppingBag,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOrder, getUserOrders } from '../services/dbService';
import { Order } from '../types';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

// 1. Defining tracking timeline milestones
const STATUS_STEPS = [
  { name: 'Pending', label: 'Order Pending', desc: 'Awaiting atelier verification and billing check', icon: Clock },
  { name: 'Confirmed', label: 'Order Confirmed', desc: 'Secure database logged & textiles allocated', icon: ShieldCheck },
  { name: 'Packed', label: 'Atelier Packed', desc: 'Bespoke pieces hand-crafted, ironed & packed', icon: Package },
  { name: 'Shipped', label: 'In Transit', desc: 'Dispatched with premium global express courier', icon: Truck },
  { name: 'Out For Delivery', label: 'Out for Delivery', desc: 'Local logistics agent has secured your bundle', icon: MapPin },
  { name: 'Delivered', label: 'Package Received', desc: 'Delivered and signed at registered destination', icon: CheckCircle }
];

export const OrderTracking: React.FC = () => {
  useSEO({
    title: 'Order Status & Consignment Tracking',
    description: 'Track the status and physical delivery of your MK Fashion Atelier orders with real-time updates.'
  });

  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search input and tracking states
  const [searchInput, setSearchInput] = useState(orderId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Quick lookups for logged in users
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);

  // Normalize legacy database states to match new status timeline nodes
  const getNormalizedStatus = (status: string): string => {
    switch (status) {
      case 'processing': return 'Confirmed';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status; // Already normalized
    }
  };

  // Fetch individual order to track
  const fetchOrderDetails = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const fetchedOrder = await getOrder(id.trim());
      if (fetchedOrder) {
        setOrder(fetchedOrder);
        setSearchInput(fetchedOrder.id);
      } else {
        setOrder(null);
        toast.error("Order ID not found in database registry.");
      }
    } catch (err) {
      console.error('Error loading order tracking:', err);
      toast.error("An error occurred while tracking this order.");
    } finally {
      setLoading(false);
    }
  };

  // On mount or URL parameter changes, load order automatically
  useEffect(() => {
    if (orderId) {
      setSearchInput(orderId);
      fetchOrderDetails(orderId);
    } else {
      setOrder(null);
      setHasSearched(false);
    }
  }, [orderId]);

  // Load past orders for quick single-click lookups if logged in
  useEffect(() => {
    if (!user) {
      setMyOrders([]);
      return;
    }
    const loadMyOrders = async () => {
      setLoadingMyOrders(true);
      try {
        const list = await getUserOrders(user.uid);
        setMyOrders(list);
      } catch (err) {
        console.error('Error loading user orders list:', err);
      } finally {
        setLoadingMyOrders(false);
      }
    };
    loadMyOrders();
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      toast.error("Please enter a valid Order ID.");
      return;
    }
    navigate(`/track/${searchInput.trim()}`);
  };

  // Calculate timeline values
  const currentStatus = order ? getNormalizedStatus(order.orderStatus) : '';
  const isCancelled = currentStatus === 'Cancelled';
  
  // Find index of current status node in steps list
  const activeStepIndex = STATUS_STEPS.findIndex(step => step.name === currentStatus);
  
  // If active is, say, Delivered (index 5 of 5), progress is 100%. If cancelled, we show a special layout.
  const progressPercent = isCancelled 
    ? 0 
    : activeStepIndex === -1 
      ? 0 
      : (activeStepIndex / (STATUS_STEPS.length - 1)) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      
      {/* 1. Page Title & Search Input Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-8 gap-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold tracking-widest text-emerald-600 font-mono uppercase block">
            REAL-TIME LOGISTICS PANEL
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 font-sans">
            Secure Order Tracking
          </h1>
          <p className="text-xs text-gray-500 font-mono">
            Direct real-time query interface sync'd with our Firebase databases.
          </p>
        </div>

        {/* Tracking Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Enter Order Code (e.g. order-104928)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-neutral-50 border border-gray-200 focus:bg-white focus:border-black rounded-2xl pl-12 pr-28 py-3.5 text-xs font-mono outline-none transition-all placeholder:text-gray-400"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black hover:bg-neutral-800 text-white font-mono text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'QUERY NOW'}
          </button>
        </form>
      </div>

      {/* 2. Primary layout body split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side Column: Order search details & timeline (8 Columns) */}
        <div className="lg:col-span-8 space-y-8">
          
          {loading ? (
            /* Loading State card */
            <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center space-y-4 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-800" />
              <p className="text-xs text-gray-400 font-mono">Quering Firestore registries for #{searchInput}...</p>
            </div>
          ) : !hasSearched ? (
            /* Initial splash prompt state */
            <div className="bg-neutral-50 border border-neutral-100 rounded-3xl p-10 sm:p-12 text-center space-y-5 max-w-2xl mx-auto">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-sans">No order queried</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Enter your 12-character unique order code above or select one from your personal archive below to track progress.
                </p>
              </div>
            </div>
          ) : !order ? (
            /* No order found error block */
            <div className="bg-white border border-red-100 rounded-3xl p-10 sm:p-12 text-center space-y-4 shadow-sm max-w-xl mx-auto">
              <XCircle className="w-12 h-12 text-red-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-800 uppercase font-mono">Query Unsuccessful</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  No registered dispatch matching <strong className="text-gray-800">#{searchInput}</strong> was located. Please double-check the billing invoice code sent via mail or dashboard.
                </p>
              </div>
            </div>
          ) : (
            /* ================= THE RICH ACTIVE TRACKING VIEW ================= */
            <div className="space-y-8">
              
              {/* STATUS HEADER INFO BOX */}
              <div className="bg-white border border-gray-150/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-black" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">TRACKING INVOICE</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight font-sans">
                    Order #{order.id}
                  </h2>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Created: {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1 font-mono text-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CURRENT LOGISTICS GATE</span>
                  {isCancelled ? (
                    <span className="bg-red-50 text-red-700 border border-red-100 font-bold px-3 py-1 rounded-full text-[11px] tracking-wider uppercase block">
                      Cancelled
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-3 py-1 rounded-full text-[11px] tracking-wider uppercase block">
                      {order.orderStatus}
                    </span>
                  )}
                  <span className="text-gray-900 font-semibold mt-1">Charged: ${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* TIMELINE PROGRESS VISUALIZATION */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-10">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider">
                    Transit Progress Timeline
                  </h3>
                  {!isCancelled && (
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Live Sync'd
                    </span>
                  )}
                </div>

                {isCancelled ? (
                  /* Special Alert if Cancelled */
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 text-center space-y-3">
                    <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-red-900 uppercase font-mono">Transaction Cancelled</h4>
                      <p className="text-xs text-red-600 max-w-md mx-auto leading-relaxed">
                        This order has been officially cancelled by management or customer request. No further logistics milestones are registered. Refunds are routed back via the initial gateways.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Progress Timeline with animations */
                  <div className="relative pt-4 pb-4">
                    
                    {/* Horizontal Progress Line (Hidden on small screens, shown on desktop md:) */}
                    <div className="hidden md:block absolute top-[43px] left-[5%] right-[5%] h-1 bg-neutral-100 rounded-full z-0">
                      <motion.div 
                        className="h-full bg-neutral-900 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </div>

                    {/* Timeline Nodes container (Desktop Horizontal, Mobile Vertical layout) */}
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-6 gap-8 md:gap-4">
                      {STATUS_STEPS.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isCompleted = idx < activeStepIndex;
                        const isActiveNode = idx === activeStepIndex;
                        const isFuture = idx > activeStepIndex;

                        return (
                          <div key={idx} className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3">
                            
                            {/* Animated circle node */}
                            <div className="relative flex-shrink-0">
                              <motion.div
                                className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                  isActiveNode 
                                    ? 'bg-neutral-950 text-white border-neutral-950 shadow-md ring-4 ring-neutral-100' 
                                    : isCompleted
                                      ? 'bg-neutral-100 text-neutral-800 border-neutral-200' 
                                      : 'bg-white text-gray-300 border-gray-150'
                                }`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1, duration: 0.4 }}
                              >
                                <StepIcon className={`w-5 h-5 ${isActiveNode ? 'animate-pulse' : ''}`} />
                              </motion.div>

                              {/* Tiny checkbox index indicator */}
                              {isCompleted && (
                                <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono shadow-sm">
                                  ✓
                                </span>
                              )}
                            </div>

                            {/* Node Metadata texts */}
                            <div className="space-y-1">
                              <h4 className={`text-xs font-semibold leading-tight ${isActiveNode ? 'text-neutral-900 font-bold' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                                {step.label}
                              </h4>
                              <p className="text-[10px] text-gray-400 leading-relaxed md:max-w-[120px] md:mx-auto">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Vertical connector line for small mobile screens (hidden on desktop) */}
                    <div className="md:hidden absolute top-[43px] bottom-0 left-[27px] w-0.5 bg-neutral-100 -z-10">
                      <div 
                        className="w-full bg-neutral-900 transition-all duration-1000 ease-out"
                        style={{ height: `${progressPercent}%` }}
                      />
                    </div>

                  </div>
                )}
              </div>

              {/* DETAILED ARTICLE LIST */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider block">
                  Couture Package Inventory
                </span>
                
                <div className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-3 sm:py-4 flex gap-4 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-13 object-cover rounded bg-gray-50 border border-gray-100"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-800 leading-tight">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            Size: {item.selectedSize} | Color: {item.selectedColor} | Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-800 font-mono">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHIPPING ADRESS & METRIC DETAIL FOOTER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Shipping Location Card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
                  <p className="font-bold text-gray-400 uppercase font-mono tracking-wider">SHIPPING LOCATION</p>
                  <div className="space-y-1 text-gray-600 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                    <p className="font-bold text-gray-900 text-sm">{order.shippingAddress.fullName}</p>
                    <p className="mt-0.5">{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-2 pt-2 border-t border-gray-100">
                      Phone: {order.shippingAddress.phone}
                    </p>
                  </div>
                </div>

                {/* Gateway Audit Card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
                  <p className="font-bold text-gray-400 uppercase font-mono tracking-wider">GATEWAY AUDIT STATUS</p>
                  <div className="space-y-1.5 text-gray-600 bg-neutral-50 p-4 rounded-xl border border-neutral-100 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Status:</span>
                      <span className="font-bold text-gray-900 uppercase bg-neutral-200 px-1.5 rounded">{order.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Client Account:</span>
                      <span className="font-bold text-gray-900 truncate max-w-[150px]">{order.userId.startsWith('guest') ? 'Guest Patron' : 'Registered Collector'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Invoice:</span>
                      <span className="font-bold text-gray-900 text-sm">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-150 flex flex-col gap-1 text-[10px] text-gray-400 font-sans italic leading-relaxed">
                      * All records are locked securely in global Firestore nodes with SSL protection.
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Right Side Column: User profile quick lookup (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white border border-gray-150/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-50 pb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-neutral-800" />
              Patron Profile Lookups
            </h3>

            {user ? (
              /* If logged in, show list of their orders to click and track */
              <div className="space-y-3">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Welcome back. Tap any order from your past history archive below to load its interactive progress timeline instantly.
                </p>

                {loadingMyOrders ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                  </div>
                ) : myOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No checkout orders registered yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                    {myOrders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => navigate(`/track/${o.id}`)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center text-xs font-mono group cursor-pointer ${
                          order?.id === o.id 
                            ? 'bg-neutral-50 border-black/30 ring-2 ring-neutral-50' 
                            : 'bg-white hover:bg-neutral-50/50 border-gray-100'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900 group-hover:text-black">#{o.id}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="font-bold text-gray-900">${o.total.toFixed(2)}</p>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide inline-block ${
                            o.orderStatus === 'Delivered' || o.orderStatus === 'delivered'
                              ? 'bg-green-50 text-green-700'
                              : o.orderStatus === 'Cancelled' || o.orderStatus === 'cancelled'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}>
                            {o.orderStatus}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in CTA */
              <div className="space-y-4 text-xs">
                <p className="text-gray-500 leading-relaxed">
                  Sign in to your MK Fashion profile to view your complete personal purchase registry and load single-click trackers.
                </p>
                <Link
                  to="/profile"
                  className="w-full inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white font-mono text-[10px] font-bold py-3 rounded-xl uppercase tracking-wider transition-colors"
                >
                  SIGN IN TO PROFILE
                </Link>
              </div>
            )}
          </div>

          {/* Customer Service / Guarantees card */}
          <div className="bg-neutral-50 border border-neutral-100 rounded-3xl p-5 sm:p-6 space-y-3 text-xs text-gray-500">
            <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-widest block">
              Atelier Logistics Assurances
            </span>
            <ul className="space-y-2 leading-relaxed list-disc list-inside">
              <li>Verified security tracking through robust cloud systems.</li>
              <li>Bespoke packaging includes high-grade protective dust bags and luxury boxing.</li>
              <li>Returns accepted within 14 calendar days from delivered status confirmation.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
