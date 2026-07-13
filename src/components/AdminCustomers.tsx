/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Heart, 
  ShoppingBag, 
  DollarSign, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Award,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Clipboard,
  User,
  CreditCard,
  Percent,
  Compass,
  FileText,
  Printer,
  X
} from 'lucide-react';
import { UserProfile, Order, Product } from '../types';
import toast from 'react-hot-toast';

interface AdminCustomersProps {
  users: UserProfile[];
  orders: Order[];
  products: Product[];
  isDarkMode: boolean;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({ 
  users, 
  orders, 
  products,
  isDarkMode 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'joined' | 'spent' | 'orders' | 'wishlist'>('spent');
  const [segmentFilter, setSegmentFilter] = useState<'All' | 'VIP' | 'Active' | 'Casual' | 'New' | 'Wishlist'>('All');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    users.length > 0 ? users[0].uid : null
  );
  const [dossierTab, setDossierTab] = useState<'profile' | 'orders' | 'wishlist' | 'addresses'>('profile');

  // helper to copy text
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`, { id: 'copy-cust' });
  };

  // Correlate metrics and categorize each user
  const enrichCustomerData = (u: UserProfile) => {
    const userOrders = orders.filter(o => o.userId === u.uid || o.email === u.email);
    const paidOrders = userOrders.filter(o => o.paymentStatus === 'paid');
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const wishlistItems = u.wishlist || [];

    // Extract unique shipping addresses used in orders
    const addressMap = new Map<string, Order['shippingAddress']>();
    userOrders.forEach(o => {
      const addr = o.shippingAddress;
      const key = `${addr.fullName}-${addr.addressLine1}-${addr.zipCode}`;
      if (!addressMap.has(key)) {
        addressMap.set(key, addr);
      }
    });
    const uniqueAddresses = Array.from(addressMap.values());

    // Extract latest address used (order with largest createdAt)
    let latestAddress: Order['shippingAddress'] | null = null;
    if (userOrders.length > 0) {
      const sortedOrders = [...userOrders].sort((a, b) => b.createdAt - a.createdAt);
      latestAddress = sortedOrders[0].shippingAddress;
    }

    // Determine Spend Segment / Tier
    let segment: 'VIP' | 'Active' | 'Casual' | 'New' = 'Casual';
    
    // Check if registered within last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const isNew = u.createdAt >= thirtyDaysAgo;

    if (totalSpent >= 500) {
      segment = 'VIP';
    } else if (userOrders.length >= 1) {
      segment = 'Active';
    } else if (isNew) {
      segment = 'New';
    }

    // Phone / zip extract for search fallback
    const phoneNumbers = Array.from(new Set(userOrders.map(o => o.shippingAddress.phone).filter(Boolean)));
    const zipCodes = Array.from(new Set(userOrders.map(o => o.shippingAddress.zipCode).filter(Boolean)));

    return {
      ...u,
      ordersList: userOrders,
      paidOrders,
      totalSpent,
      orderCount: userOrders.length,
      paidCount: paidOrders.length,
      wishlistCount: wishlistItems.length,
      uniqueAddresses,
      latestAddress,
      segment,
      phoneNumbers,
      zipCodes
    };
  };

  const enrichedUsers = users.map(enrichCustomerData);

  // Global Analytics Summary metrics
  const totalCustomers = enrichedUsers.length;
  const vipCustomers = enrichedUsers.filter(u => u.segment === 'VIP').length;
  const activeCustomers = enrichedUsers.filter(u => u.segment === 'Active').length;
  const casualCustomers = enrichedUsers.filter(u => u.segment === 'Casual').length;
  const newCustomers = enrichedUsers.filter(u => u.segment === 'New').length;
  const totalLTV = enrichedUsers.reduce((sum, u) => sum + u.totalSpent, 0);
  const avgLTV = totalCustomers > 0 ? totalLTV / totalCustomers : 0;
  
  const totalWishlistedItems = enrichedUsers.reduce((sum, u) => sum + u.wishlistCount, 0);
  const customersWithWishlist = enrichedUsers.filter(u => u.wishlistCount > 0).length;

  // Filter and faceted search
  const filteredUsers = enrichedUsers.filter(u => {
    const search = searchTerm.toLowerCase();
    const nameMatch = u.displayName?.toLowerCase().includes(search);
    const emailMatch = u.email?.toLowerCase().includes(search);
    const uidMatch = u.uid?.toLowerCase().includes(search);
    
    const phoneMatch = u.phoneNumbers.some(p => p.includes(searchTerm));
    const zipMatch = u.zipCodes.some(z => z.toLowerCase().includes(search));

    const matchesSearch = nameMatch || emailMatch || uidMatch || phoneMatch || zipMatch;

    if (!matchesSearch) return false;

    // Segment Filter
    if (segmentFilter === 'All') return true;
    if (segmentFilter === 'VIP') return u.segment === 'VIP';
    if (segmentFilter === 'Active') return u.segment === 'Active';
    if (segmentFilter === 'Casual') return u.segment === 'Casual';
    if (segmentFilter === 'New') return u.segment === 'New';
    if (segmentFilter === 'Wishlist') return u.wishlistCount > 0;

    return true;
  });

  // Sorting
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'spent') {
      return b.totalSpent - a.totalSpent;
    }
    if (sortBy === 'orders') {
      return b.orderCount - a.orderCount;
    }
    if (sortBy === 'wishlist') {
      return b.wishlistCount - a.wishlistCount;
    }
    // Default 'joined' - newest first
    return b.createdAt - a.createdAt;
  });

  // Selected customer deep correlation
  const selectedUser = sortedUsers.find(u => u.uid === selectedUserId) || (sortedUsers.length > 0 ? sortedUsers[0] : null);

  // Status badges colors for orders tab
  const getStatusBadgeStyles = (status: Order['orderStatus']) => {
    const norm = status.toLowerCase();
    if (norm === 'pending' || norm === 'processing') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (norm === 'confirmed') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (norm === 'packed') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    if (norm === 'shipped') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (norm === 'out for delivery') return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (norm === 'delivered') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  const getPaymentBadgeStyles = (status: Order['paymentStatus']) => {
    if (status === 'paid') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'pending') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  // Get Top Selling or Top saved wishlist items aggregate
  const getMostWishlistedProducts = () => {
    const counts: { [prodId: string]: number } = {};
    enrichedUsers.forEach(u => {
      (u.wishlist || []).forEach(pid => {
        counts[pid] = (counts[pid] || 0) + 1;
      });
    });

    const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return sortedIds.slice(0, 3).map(id => {
      const p = products.find(prod => prod.id === id);
      return {
        product: p,
        count: counts[id]
      };
    }).filter(item => item.product !== undefined);
  };

  const wishlistedRankings = getMostWishlistedProducts();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100/10 pb-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">Customer Database Dossier</h2>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            Registered customer profiles, total spending analytics, item wishlists, delivery address history, and individual logistics logs.
          </p>
        </div>
        <div className={`flex items-center gap-2 text-[11px] font-mono px-3.5 py-2 rounded-2xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-neutral-150 text-neutral-700'
        }`}>
          <Users className="w-4 h-4 text-purple-400" />
          <span className="font-bold">{totalCustomers} Registered Clients</span>
        </div>
      </div>

      {/* 2. Customer Database Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* LTV Spend Metrics */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
        }`}>
          <div>
            <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Financial Performance</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-lg font-black font-mono text-emerald-500">${totalLTV.toFixed(2)}</span>
              <span className="text-[10px] text-neutral-400">Total LTV</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] border-t border-neutral-100/5 pt-2 mt-auto">
            <span className="text-neutral-400">Avg LTV per Customer:</span>
            <span className="font-bold font-mono">${avgLTV.toFixed(2)}</span>
          </div>
        </div>

        {/* Wishlist Engagement Metrics */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
        }`}>
          <div>
            <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Wishlist Engagement</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-lg font-black font-mono text-red-400">{totalWishlistedItems}</span>
              <span className="text-[10px] text-neutral-400">Items saved</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] border-t border-neutral-100/5 pt-2 mt-auto">
            <span className="text-neutral-400">Saved Wishlists:</span>
            <span className="font-bold font-mono">{customersWithWishlist} ({Math.round(totalCustomers > 0 ? (customersWithWishlist/totalCustomers)*100 : 0)}%)</span>
          </div>
        </div>

        {/* Customer Segments distribution */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
        }`}>
          <div>
            <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Spender Tiers</span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-lg font-black font-mono text-purple-400">{vipCustomers}</span>
              <span className="text-[10px] text-neutral-400">VIPs ($500+)</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] border-t border-neutral-100/5 pt-2 mt-auto">
            <span className="text-neutral-400">Active vs New vs Casual:</span>
            <span className="font-bold font-mono text-neutral-400">
              {activeCustomers}A / {newCustomers}N / {casualCustomers}C
            </span>
          </div>
        </div>

        {/* Wishlist Top Saved ranking */}
        <div className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
        }`}>
          <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Top Wishlisted curation</span>
          <div className="space-y-1 overflow-hidden mt-0.5">
            {wishlistedRankings.length === 0 ? (
              <span className="text-[10px] text-neutral-500 italic block py-1">No wishlist logs yet.</span>
            ) : (
              wishlistedRankings.map(({ product, count }, idx) => (
                <div key={product?.id} className="flex items-center justify-between gap-1.5 text-[10px]">
                  <span className="truncate text-neutral-300 font-medium">
                    {idx+1}. {product?.name}
                  </span>
                  <span className="shrink-0 font-mono text-red-400 font-bold flex items-center gap-0.5">
                    <Heart className="w-2.5 h-2.5 fill-current" /> {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Advanced Search & Segment Filters */}
      <div className={`p-4 rounded-2xl border flex flex-col gap-4 text-xs ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
      }`}>
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Faceted text input */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone, ZIP code, or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none border ${
                isDarkMode ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-white border-neutral-250 text-neutral-900'
              }`}
            />
          </div>

          {/* Directory sorting */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <span className="text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`w-full md:w-auto px-3 py-2.5 rounded-xl outline-none border cursor-pointer font-medium ${
                isDarkMode ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-white border-neutral-250 text-neutral-900'
              }`}
            >
              <option value="spent">Lifetime Spend (LTV)</option>
              <option value="joined">Date Joined (Newest)</option>
              <option value="orders">Orders Placed (Count)</option>
              <option value="wishlist">Wishlist Items (Volume)</option>
            </select>
          </div>
        </div>

        {/* Segmentation quick buttons */}
        <div className="flex items-center gap-1.5 flex-wrap border-t border-neutral-100/5 pt-3 overflow-x-auto scrollbar-none">
          <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider mr-2">Quick Segments:</span>
          
          <button
            onClick={() => setSegmentFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer transition-all ${
              segmentFilter === 'All' 
                ? 'bg-black text-white border-black' 
                : isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850' : 'border-neutral-250 text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
          >
            All Clients ({enrichedUsers.length})
          </button>
          
          <button
            onClick={() => setSegmentFilter('VIP')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer transition-all flex items-center gap-1 ${
              segmentFilter === 'VIP' 
                ? 'bg-purple-600 text-white border-purple-600' 
                : isDarkMode ? 'border-zinc-800 text-purple-400 hover:text-purple-300 hover:bg-purple-950/10' : 'border-purple-200 text-purple-700 hover:text-purple-900 hover:bg-purple-50'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-yellow-500" />
            VIP Spenders ({vipCustomers})
          </button>

          <button
            onClick={() => setSegmentFilter('Active')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer transition-all flex items-center gap-1 ${
              segmentFilter === 'Active' 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : isDarkMode ? 'border-zinc-800 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/10' : 'border-emerald-200 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Active Buyers ({activeCustomers})
          </button>

          <button
            onClick={() => setSegmentFilter('Wishlist')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer transition-all flex items-center gap-1 ${
              segmentFilter === 'Wishlist' 
                ? 'bg-red-600 text-white border-red-600' 
                : isDarkMode ? 'border-zinc-800 text-red-400 hover:text-red-300 hover:bg-red-950/10' : 'border-red-200 text-red-600 hover:text-red-800 hover:bg-red-50'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            With Wishlist ({customersWithWishlist})
          </button>

          <button
            onClick={() => setSegmentFilter('New')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer transition-all flex items-center gap-1 ${
              segmentFilter === 'New' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : isDarkMode ? 'border-zinc-800 text-blue-400 hover:text-blue-300 hover:bg-blue-950/10' : 'border-blue-250 text-blue-600 hover:text-blue-800 hover:bg-blue-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Recent Signs ({newCustomers})
          </button>

          <button
            onClick={() => setSegmentFilter('Casual')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer transition-all ${
              segmentFilter === 'Casual' 
                ? 'bg-zinc-600 text-white border-zinc-600' 
                : isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850' : 'border-neutral-250 text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
          >
            Casual / Inactive ({casualCustomers})
          </button>
        </div>
      </div>

      {/* 4. Main Split Screen Panel: Left Ledger List, Right Detailed Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Customer ledger list */}
        <div className="lg:col-span-5 space-y-3 max-h-[640px] overflow-y-auto pr-2 scrollbar-thin">
          {sortedUsers.length === 0 ? (
            <div className={`p-10 text-center border rounded-2xl italic text-xs ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-850 text-zinc-500' : 'bg-neutral-50/50 border-neutral-150 text-neutral-400'
            }`}>
              No customer logs match the active filter criteria.
            </div>
          ) : (
            sortedUsers.map(u => {
              const isActive = u.uid === selectedUserId;
              
              // Segment color styles
              let segmentBadge = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
              if (u.segment === 'VIP') {
                segmentBadge = 'bg-purple-500/10 text-purple-400 border-purple-500/20 font-bold';
              } else if (u.segment === 'Active') {
                segmentBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold';
              } else if (u.segment === 'New') {
                segmentBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20 font-semibold';
              }

              return (
                <button
                  key={u.uid}
                  onClick={() => {
                    setSelectedUserId(u.uid);
                    setDossierTab('profile'); // Reset tab on selection change for cleaner UX
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer block relative overflow-hidden ${
                    isActive 
                      ? 'border-neutral-500 ring-1 ring-neutral-500 ' + (isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50')
                      : isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-neutral-150 hover:border-neutral-350'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.photoURL ? (
                        <img 
                          src={u.photoURL} 
                          alt="" 
                          className="w-7 h-7 rounded-full border border-neutral-200 shrink-0" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] font-mono uppercase shrink-0 ${
                          isDarkMode ? 'bg-purple-950/40 text-purple-400 border border-purple-900/40' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {u.displayName ? u.displayName.slice(0, 2) : 'CL'}
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-bold text-xs block truncate">{u.displayName || 'Anonymous Client'}</span>
                        <span className="text-[9px] text-neutral-400 font-mono block mt-0.5 truncate">{u.email}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs block text-emerald-500">${u.totalSpent.toFixed(2)}</span>
                      <span className="text-[9px] text-neutral-400 block mt-0.5">{u.orderCount} orders</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2 mt-2 pt-2 border-t border-neutral-100/5 text-[9px]">
                    <span className="text-neutral-400 font-mono">
                      Joined: {new Date(u.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {u.wishlistCount > 0 && (
                        <span className="text-red-400 font-mono font-bold flex items-center gap-0.5" title="Wishlisted items">
                          <Heart className="w-2.5 h-2.5 fill-current" /> {u.wishlistCount}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded border uppercase text-[8px] ${segmentBadge}`}>
                        {u.segment}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Deep-Dive Dossier Interactive Workspace */}
        <div className="lg:col-span-7">
          {!selectedUser ? (
            <div className={`p-12 text-center border rounded-3xl ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-neutral-150 text-neutral-400'
            }`}>
              Select a customer from the ledger list to analyze profiles, wishlist curations, financial spending, and shipping history.
            </div>
          ) : (
            <div className={`p-5 rounded-3xl border space-y-6 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
            }`}>
              
              {/* Header: Full profile display card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100/10 pb-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {selectedUser.photoURL ? (
                    <img 
                      src={selectedUser.photoURL} 
                      alt="" 
                      className="w-12 h-12 rounded-full border border-neutral-200 object-cover shrink-0" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg font-mono uppercase shrink-0 ${
                      isDarkMode ? 'bg-purple-950/40 text-purple-400 border border-purple-900/40' : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {selectedUser.displayName ? selectedUser.displayName.slice(0, 2) : 'CL'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold tracking-tight">{selectedUser.displayName || 'Anonymous Client'}</h3>
                      <span className={`inline-block border text-[8px] font-bold font-mono px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        selectedUser.segment === 'VIP' 
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/20' 
                          : selectedUser.segment === 'Active' 
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : selectedUser.segment === 'New'
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                              : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'
                      }`}>
                        {selectedUser.segment} Member
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono block mt-0.5 truncate">
                      Account UID: {selectedUser.uid}
                    </span>
                  </div>
                </div>

                {/* Contact Shortcut */}
                <a
                  href={`mailto:${selectedUser.email}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider bg-black text-white hover:bg-neutral-850 border border-zinc-800 transition-all text-center shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email Client
                </a>
              </div>

              {/* dossier tab select */}
              <div className="flex border-b border-neutral-100/5 pb-0.5 overflow-x-auto scrollbar-none gap-2">
                <button
                  onClick={() => setDossierTab('profile')}
                  className={`pb-2.5 px-2 text-[10px] font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
                    dossierTab === 'profile'
                      ? 'border-black text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Profile & Spending
                </button>
                <button
                  onClick={() => setDossierTab('orders')}
                  className={`pb-2.5 px-2 text-[10px] font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    dossierTab === 'orders'
                      ? 'border-black text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Order History ({selectedUser.orderCount})
                </button>
                <button
                  onClick={() => setDossierTab('wishlist')}
                  className={`pb-2.5 px-2 text-[10px] font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    dossierTab === 'wishlist'
                      ? 'border-black text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Wishlist ({selectedUser.wishlistCount})
                </button>
                <button
                  onClick={() => setDossierTab('addresses')}
                  className={`pb-2.5 px-2 text-[10px] font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
                    dossierTab === 'addresses'
                      ? 'border-black text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Addresses ({selectedUser.uniqueAddresses.length})
                </button>
              </div>

              {/* Dossier Tabs content render */}
              
              {/* TAB 1: Profile & Finances Deep Dive */}
              {dossierTab === 'profile' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Financial KPI stats bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-2xl border text-center ${
                      isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-neutral-50/50 border-neutral-150'
                    }`}>
                      <span className="text-[8px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">LTV Spend</span>
                      <span className="text-base font-black font-mono mt-1 block text-emerald-500">${selectedUser.totalSpent.toFixed(2)}</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl border text-center ${
                      isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-neutral-50/50 border-neutral-150'
                    }`}>
                      <span className="text-[8px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Avg Order (AOV)</span>
                      <span className="text-base font-black font-mono mt-1 block">
                        ${selectedUser.paidCount > 0 ? (selectedUser.totalSpent / selectedUser.paidCount).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className={`p-3.5 rounded-2xl border text-center ${
                      isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-neutral-50/50 border-neutral-150'
                    }`}>
                      <span className="text-[8px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Checkout freq</span>
                      <span className="text-base font-black font-mono mt-1 block text-purple-400">{selectedUser.orderCount} purchases</span>
                    </div>
                  </div>

                  {/* Account dossier particulars details */}
                  <div className={`p-4 rounded-2xl border space-y-4 text-xs ${
                    isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-neutral-50/50 border-neutral-150'
                  }`}>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider block border-b border-neutral-100/5 pb-2">
                      Registry Dossier Particulars
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-400 font-medium block">DisplayName:</span>
                        <p className="font-semibold">{selectedUser.displayName || 'No Name Set'}</p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-400 font-medium block">Contact email:</span>
                        <p className="font-mono text-neutral-300">{selectedUser.email}</p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-400 font-medium block">Registration Date:</span>
                        <p className="font-medium font-sans">
                          {new Date(selectedUser.createdAt).toLocaleDateString()} at {new Date(selectedUser.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-400 font-medium block">Client Tier status:</span>
                        <p className="font-semibold text-purple-400 font-sans uppercase">
                          {selectedUser.segment} tier ({selectedUser.totalSpent >= 500 ? 'Highly Valued Patron' : 'Retail Consumer'})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary of checkout success */}
                  <div className={`p-4 rounded-2xl border space-y-3.5 text-xs ${
                    isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-neutral-50/50 border-neutral-150'
                  }`}>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider block border-b border-neutral-100/5 pb-2">
                      Fulfillment & Transaction logs
                    </span>

                    <div className="flex justify-between items-center text-[11px] text-neutral-400">
                      <span>Total orders processed:</span>
                      <span className="font-mono font-bold text-neutral-200">{selectedUser.orderCount} orders</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-1">
                      <span>Successful (Paid) payments:</span>
                      <span className="font-mono font-bold text-emerald-400">{selectedUser.paidCount} payments</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-1">
                      <span>Unpaid or Failed attempts:</span>
                      <span className="font-mono font-bold text-rose-500">
                        {selectedUser.orderCount - selectedUser.paidCount} failed/pending
                      </span>
                    </div>

                    {selectedUser.latestAddress && (
                      <div className="border-t border-neutral-100/5 pt-3 mt-1.5 space-y-1">
                        <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase">Primary / Last delivery node:</span>
                        <p className="font-sans leading-relaxed text-neutral-300">
                          {selectedUser.latestAddress.fullName} — {selectedUser.latestAddress.addressLine1}, {selectedUser.latestAddress.city}, {selectedUser.latestAddress.state} {selectedUser.latestAddress.zipCode} ({selectedUser.latestAddress.phone})
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: Order History Lists */}
              {dossierTab === 'orders' && (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">Customer purchase orders ledger</span>
                  
                  {selectedUser.ordersList.length === 0 ? (
                    <div className={`p-10 text-center rounded-2xl border italic text-xs ${
                      isDarkMode ? 'bg-zinc-950/20 border-zinc-850 text-zinc-500' : 'bg-neutral-50/30 border-neutral-150 text-neutral-400'
                    }`}>
                      This customer has not completed any orders on this platform.
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
                      {selectedUser.ordersList.map((o) => (
                        <div key={o.id} className={`p-4 rounded-2xl border space-y-3 text-xs ${
                          isDarkMode ? 'bg-zinc-950/30 border-zinc-850' : 'bg-neutral-50/30 border-neutral-150'
                        }`}>
                          <div className="flex justify-between items-start pb-2 border-b border-neutral-100/5">
                            <div>
                              <span className="font-mono font-bold block text-neutral-300">Order #{o.id}</span>
                              <span className="text-[9px] text-neutral-400 font-mono mt-0.5 block">
                                Date: {new Date(o.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-sm block">${o.total.toFixed(2)}</span>
                              <div className="flex gap-1.5 items-center justify-end mt-1">
                                <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${getPaymentBadgeStyles(o.paymentStatus)}`}>
                                  {o.paymentStatus}
                                </span>
                                <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${getStatusBadgeStyles(o.orderStatus)}`}>
                                  {o.orderStatus}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Items breakdown mini list */}
                          <div className="space-y-1.5">
                            {o.items.map((it, i) => (
                              <div key={i} className="flex justify-between items-center text-[11px] gap-2">
                                <span className="truncate text-neutral-400">
                                  {it.name} <span className="font-mono text-[10px]">({it.selectedSize})</span>
                                </span>
                                <span className="shrink-0 font-mono text-neutral-500">
                                  Qty: {it.quantity} @ ${it.price}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Wishlist details resolved */}
              {dossierTab === 'wishlist' && (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">Customer Saved Wishlist curation</span>
                  
                  {selectedUser.wishlistCount === 0 ? (
                    <div className={`p-10 text-center rounded-2xl border italic text-xs ${
                      isDarkMode ? 'bg-zinc-950/20 border-zinc-850 text-zinc-500' : 'bg-neutral-50/30 border-neutral-150 text-neutral-400'
                    }`}>
                      This customer has no items in their wishlist folder.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
                      {selectedUser.wishlist.map(pid => {
                        const prod = products.find(p => p.id === pid);
                        if (!prod) {
                          return (
                            <div key={pid} className={`p-3 rounded-2xl border text-[11px] text-zinc-500 italic ${
                              isDarkMode ? 'bg-zinc-950/30 border-zinc-850' : 'bg-neutral-50/30 border-neutral-150'
                            }`}>
                              Product removed from catalog (ID: {pid.substring(0, 8)}...)
                            </div>
                          );
                        }

                        const lowStock = prod.stock <= 5;

                        return (
                          <div key={prod.id} className={`p-3 rounded-2xl border flex gap-3 items-center text-xs ${
                            isDarkMode ? 'bg-zinc-950/30 border-zinc-850' : 'bg-neutral-50/30 border-neutral-150'
                          }`}>
                            <img 
                              src={prod.images[0]} 
                              alt="" 
                              className="w-10 h-12 object-cover rounded bg-neutral-200 shrink-0" 
                              referrerPolicy="no-referrer" 
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-neutral-400 font-mono block uppercase">{prod.category}</span>
                              <h4 className="font-bold truncate text-[11px] leading-tight text-neutral-200">{prod.name}</h4>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="font-mono font-bold text-emerald-500">${prod.price.toFixed(2)}</span>
                                <span className={`text-[9px] font-mono font-bold uppercase ${lowStock ? 'text-red-400' : 'text-neutral-400'}`}>
                                  {prod.stock === 0 ? 'Out of Stock' : lowStock ? `Only ${prod.stock} Left` : 'In Stock'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Extracted shipping addresses */}
              {dossierTab === 'addresses' && (
                <div className="space-y-4 animate-fade-in">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">Customer Saved delivery addresses ledger</span>
                  
                  {selectedUser.uniqueAddresses.length === 0 ? (
                    <div className={`p-10 text-center rounded-2xl border italic text-xs ${
                      isDarkMode ? 'bg-zinc-950/20 border-zinc-850 text-zinc-500' : 'bg-neutral-50/30 border-neutral-150 text-neutral-400'
                    }`}>
                      This customer has no shipping address history. Place an order to register address keys.
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
                      {selectedUser.uniqueAddresses.map((addr, idx) => {
                        const isLatest = selectedUser.latestAddress && 
                          selectedUser.latestAddress.fullName === addr.fullName && 
                          selectedUser.latestAddress.addressLine1 === addr.addressLine1 && 
                          selectedUser.latestAddress.zipCode === addr.zipCode;

                        return (
                          <div key={idx} className={`p-4 rounded-2xl border text-xs space-y-2 relative overflow-hidden ${
                            isDarkMode ? 'bg-zinc-950/30 border-zinc-850' : 'bg-neutral-50/30 border-neutral-150'
                          }`}>
                            
                            {/* Latest Address Badge */}
                            {isLatest && (
                              <span className="absolute top-0 right-0 bg-emerald-500 text-black text-[8px] font-black font-mono px-2 py-0.5 rounded-bl uppercase tracking-wider">
                                Latest used
                              </span>
                            )}

                            <div className="flex justify-between items-start pr-16 border-b border-neutral-100/5 pb-2">
                              <div>
                                <h4 className="font-bold">{addr.fullName}</h4>
                                <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">Recipient</span>
                              </div>
                              <button
                                onClick={() => handleCopyText(`${addr.fullName}\n${addr.addressLine1}\n${addr.city}, ${addr.state} ${addr.zipCode}\nPhone: ${addr.phone}`, 'Address Label')}
                                className="p-1 hover:bg-neutral-500/10 rounded text-neutral-400 hover:text-white transition-all cursor-pointer shrink-0"
                                title="Copy Address Label"
                              >
                                <Clipboard className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-1 text-neutral-300">
                              <p className="flex items-start gap-1.5 leading-relaxed">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400 mt-0.5" />
                                <span>
                                  {addr.addressLine1}
                                  {addr.addressLine2 && <span className="block">{addr.addressLine2}</span>}
                                  <span className="block font-semibold text-neutral-200">
                                    {addr.city}, {addr.state} {addr.zipCode}
                                  </span>
                                </span>
                              </p>
                              
                              <p className="flex items-center gap-1.5 pt-1 text-[11px] text-neutral-400">
                                <Phone className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                                <span>Contact Phone: <strong className="text-neutral-300 font-mono">{addr.phone}</strong></span>
                              </p>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
