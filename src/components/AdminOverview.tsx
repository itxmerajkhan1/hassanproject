/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  Users, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle,
  Star,
  CheckCircle,
  Eye,
  Activity,
  ArrowDownRight
} from 'lucide-react';
import { Order, Product, Review, UserProfile } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdminOverviewProps {
  orders: Order[];
  products: Product[];
  reviews: Review[];
  users: UserProfile[];
  totalRevenue: number;
  onNavigate: (section: 'overview' | 'sales' | 'orders' | 'products' | 'customers' | 'reviews' | 'notifications') => void;
  onApproveReview: (id: string) => void;
  onRejectReview: (id: string) => void;
  isDarkMode: boolean;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  orders,
  products,
  reviews,
  users,
  totalRevenue,
  onNavigate,
  onApproveReview,
  onRejectReview,
  isDarkMode
}) => {
  // Simulated simulated date July 13, 2026
  const simulatedTime = new Date('2026-07-13T12:19:56-07:00').getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // 1. Today's orders (orders created within the same calendar day July 13, 2026, or last 24h)
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate.getUTCFullYear() === 2026 && 
           orderDate.getUTCMonth() === 6 && // July is index 6
           orderDate.getUTCDate() === 13;
  });

  const todaySales = todayOrders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  // 2. Low stock items
  const lowStockItems = products.filter(p => p.stock <= 5);

  // 3. Pending reviews
  const pendingReviews = reviews.filter(r => !r.approved);

  // 4. Calculate 7-day sales breakdown for Recharts AreaChart
  const getLast7DaysData = () => {
    const data = [];
    // July 7 to July 13, 2026
    for (let i = 6; i >= 0; i--) {
      const date = new Date(simulatedTime - i * ONE_DAY_MS);
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const dayOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getUTCFullYear() === date.getUTCFullYear() &&
               d.getUTCMonth() === date.getUTCMonth() &&
               d.getUTCDate() === date.getUTCDate() &&
               o.paymentStatus === 'paid';
      });

      const total = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const count = dayOrders.length;

      data.push({
        name: label,
        Revenue: Math.round(total),
        Orders: count
      });
    }
    return data;
  };

  const chartData = getLast7DaysData();

  // 5. Recent 5 orders
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner Message */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDarkMode 
          ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
          : 'bg-neutral-50 border-neutral-100 text-gray-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">Welcome to MK Fashion Backoffice</h2>
            <p className="text-xs text-neutral-400 font-sans">
              E-Store operations are running optimally. All payment systems are online and secure.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold ${
              isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-gray-600 border border-neutral-200'
            }`}>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulated: 2026-07-13 12:19</span>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Revenue */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
          isDarkMode 
            ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' 
            : 'bg-white border-neutral-150 hover:border-neutral-300'
        }`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Total Sales (Revenue)</p>
              <h3 className="text-2xl font-black font-mono tracking-tight">${totalRevenue.toFixed(2)}</h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDarkMode ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] font-mono">
            <span className="text-emerald-500 font-bold flex items-center">
              +14.2% <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
            <span className="text-neutral-400">vs last week</span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Card 2: Today's Orders */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
          isDarkMode 
            ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' 
            : 'bg-white border-neutral-150 hover:border-neutral-300'
        }`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Today's Orders</p>
              <h3 className="text-2xl font-black font-mono tracking-tight">{todayOrders.length} orders</h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDarkMode ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40' : 'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] font-mono">
            <span className="text-blue-500 font-bold">
              ${todaySales.toFixed(2)}
            </span>
            <span className="text-neutral-400">revenue generated today</span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Card 3: Total Customers */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
          isDarkMode 
            ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' 
            : 'bg-white border-neutral-150 hover:border-neutral-300'
        }`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Active Customers</p>
              <h3 className="text-2xl font-black font-mono tracking-tight">{users.length} profiles</h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDarkMode ? 'bg-purple-950/40 text-purple-400 border border-purple-900/40' : 'bg-purple-50 text-purple-700 border border-purple-100'
            }`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] font-mono">
            <span className="text-purple-500 font-bold flex items-center">
              +4 new <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
            <span className="text-neutral-400">registered recently</span>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Card 4: Catalog Products */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
          isDarkMode 
            ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' 
            : 'bg-white border-neutral-150 hover:border-neutral-300'
        }`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Product Inventory</p>
              <h3 className="text-2xl font-black font-mono tracking-tight">{products.length} items</h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDarkMode ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono">
            {lowStockItems.length > 0 ? (
              <span className="text-amber-500 font-bold flex items-center animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {lowStockItems.length} low stock warnings
              </span>
            ) : (
              <span className="text-emerald-500 font-bold flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> All stock levels healthy
              </span>
            )}
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
        </div>

      </div>

      {/* Main Section: Chart & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Recharts Sales area chart (7 columns) */}
        <div className={`lg:col-span-8 p-6 rounded-3xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
        }`}>
          <div className="flex items-center justify-between border-b border-neutral-100/10 pb-4 mb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-red-500" />
                7-Day Sales Volume
              </span>
              <h3 className="text-sm font-bold font-mono">Store Revenue Evolution</h3>
            </div>
            <button 
              onClick={() => onNavigate('sales')}
              className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 hover:underline ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-black'
              }`}
            >
              Advanced Charts <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDarkMode ? "#10b981" : "#10b981"} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={isDarkMode ? "#10b981" : "#10b981"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#27272a" : "#f4f4f5"} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDarkMode ? "#71717a" : "#a1a1aa"} 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke={isDarkMode ? "#71717a" : "#a1a1aa"} 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "#18181b" : "#ffffff", 
                    borderColor: isDarkMode ? "#27272a" : "#e4e4e7",
                    borderRadius: "12px",
                    color: isDarkMode ? "#f4f4f5" : "#18181b"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="Revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quick Action approval queue (4 columns) */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
        } flex flex-col justify-between`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100/10 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  Review Approvals
                </span>
                <h3 className="text-sm font-bold font-mono">Moderator Inbox</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                pendingReviews.length > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {pendingReviews.length} pending
              </span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {pendingReviews.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-400 italic">
                  No reviews pending moderation. E-store is fully approved.
                </div>
              ) : (
                pendingReviews.slice(0, 3).map((rev) => (
                  <div key={rev.id} className={`p-3 rounded-2xl border text-xs space-y-2 ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-800/80' : 'bg-neutral-50 border-neutral-200/50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold truncate max-w-[120px]">{rev.userName}</span>
                      <span className="font-mono text-[10px] text-amber-500">★ {rev.rating}.0</span>
                    </div>
                    <p className="text-[11px] line-clamp-2 text-neutral-400 italic">"{rev.comment}"</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => onApproveReview(rev.id)}
                        className="flex-1 bg-black hover:bg-neutral-800 text-white font-mono text-[9px] font-bold py-1.5 rounded-lg uppercase tracking-wide cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onRejectReview(rev.id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-mono text-[9px] font-bold py-1.5 rounded-lg uppercase tracking-wide cursor-pointer text-center"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('reviews')}
            className={`w-full py-3.5 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider border text-center transition-all cursor-pointer mt-4 ${
              isDarkMode 
                ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-300' 
                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-gray-700'
            }`}
          >
            Moderate All Reviews ({reviews.length})
          </button>
        </div>

      </div>

      {/* Bottom Section: Recent Orders Table */}
      <div className={`p-6 rounded-3xl border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
      }`}>
        <div className="flex items-center justify-between border-b border-neutral-100/10 pb-4 mb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">
              Recent Activity Stream
            </span>
            <h3 className="text-sm font-bold font-mono">Recently Placed Orders</h3>
          </div>
          <button 
            onClick={() => onNavigate('orders')}
            className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 hover:underline ${
              isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-black'
            }`}
          >
            Manage Logistics <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left divide-y divide-neutral-100/10 font-sans">
            <thead className="text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Purchased items</th>
                <th className="py-3 px-3">Total Cost</th>
                <th className="py-3 px-3">Logistics Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100/5">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-neutral-400 italic">No checkout orders registered in system yet.</td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id} className={isDarkMode ? 'hover:bg-zinc-850/50' : 'hover:bg-neutral-50/50'}>
                    <td className="py-3 px-3 font-mono font-bold text-neutral-400">#{o.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold leading-tight">{o.shippingAddress.fullName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{o.email}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-neutral-400">
                      {new Date(o.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3 font-sans font-medium text-neutral-400 truncate max-w-[200px]" title={o.items.map(it => `${it.name} (${it.selectedSize})`).join(', ')}>
                      {o.items.map(it => `${it.name} x${it.quantity}`).join(', ')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">${o.total.toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-full ${
                        o.orderStatus === 'Delivered' || o.orderStatus === 'delivered'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : o.orderStatus === 'Cancelled' || o.orderStatus === 'cancelled'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : o.orderStatus === 'Shipped' || o.orderStatus === 'shipped'
                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {o.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
