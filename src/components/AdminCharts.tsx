/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  ShoppingBag, 
  ArrowUpRight,
  PackageCheck,
  Percent,
  TrendingDown
} from 'lucide-react';
import { Order, Product } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';

interface AdminChartsProps {
  orders: Order[];
  products: Product[];
  isDarkMode: boolean;
}

export const AdminCharts: React.FC<AdminChartsProps> = ({ orders, products, isDarkMode }) => {
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');

  // 1. Calculate Daily Sales Data for the last 15 days
  const get15DaysSalesData = () => {
    const data = [];
    const simulatedTime = new Date('2026-07-13T12:19:56-07:00').getTime();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    for (let i = 14; i >= 0; i--) {
      const date = new Date(simulatedTime - i * ONE_DAY_MS);
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const dayOrders = paidOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getUTCFullYear() === date.getUTCFullYear() &&
               d.getUTCMonth() === date.getUTCMonth() &&
               d.getUTCDate() === date.getUTCDate();
      });

      const totalRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const totalVolume = dayOrders.length;

      data.push({
        name: label,
        Revenue: Math.round(totalRevenue),
        Orders: totalVolume
      });
    }
    return data;
  };

  const dailySalesData = get15DaysSalesData();

  // 2. Apparel Category Sales Performance
  const getCategorySalesData = () => {
    const categories = ['Dresses', 'Tops', 'Outerwear', 'Activewear', 'Accessories'];
    return categories.map(cat => {
      const revenue = paidOrders.reduce((sum, o) => {
        const catSum = o.items.reduce((acc, item) => {
          const matchingProduct = products.find(p => p.id === item.productId);
          if (matchingProduct && matchingProduct.category === cat) {
            return acc + (item.price * item.quantity);
          }
          return acc;
        }, 0);
        return sum + catSum;
      }, 0);

      const count = paidOrders.reduce((sum, o) => {
        const catCount = o.items.reduce((acc, item) => {
          const matchingProduct = products.find(p => p.id === item.productId);
          if (matchingProduct && matchingProduct.category === cat) {
            return acc + item.quantity;
          }
          return acc;
        }, 0);
        return sum + catCount;
      }, 0);

      return {
        name: cat,
        Revenue: Math.round(revenue),
        Items: count
      };
    });
  };

  const categoryData = getCategorySalesData();

  // 3. Order Status Distribution counts
  const getOrderStatusData = () => {
    const statuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'];
    const counts = statuses.map(st => {
      const count = orders.filter(o => o.orderStatus === st).length;
      return {
        name: st,
        Count: count
      };
    });
    // Remove empty ones for cleaner chart representation
    return counts.filter(c => c.Count > 0);
  };

  const statusData = getOrderStatusData();

  // 4. Product Sales Registry Table Top 5
  const getTopSellingProducts = () => {
    const productStats: Record<string, { name: string; quantity: number; revenue: number; image: string; category: string }> = {};
    
    paidOrders.forEach(o => {
      o.items.forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const cat = prod ? prod.category : 'General';
        
        if (!productStats[it.productId]) {
          productStats[it.productId] = {
            name: it.name,
            quantity: 0,
            revenue: 0,
            image: it.image,
            category: cat
          };
        }
        productStats[it.productId].quantity += it.quantity;
        productStats[it.productId].revenue += it.price * it.quantity;
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const topProducts = getTopSellingProducts();

  // Color schemes for charts
  const barColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div className="border-b border-neutral-100/10 pb-4">
        <h2 className="text-lg font-bold font-sans tracking-tight">Business Intel & Statistics</h2>
        <p className="text-xs text-neutral-400 font-sans">
          Deep analysis of sales velocity, collection categories, logistics distribution, and catalog performers.
        </p>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Sales Curve over last 15 days */}
        <div className={`p-6 rounded-3xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
        }`}>
          <div className="space-y-1 mb-6">
            <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              15-Day Sales Curve
            </span>
            <h3 className="text-sm font-bold font-mono">Store Revenue velocity ($)</h3>
          </div>

          <div className="h-72 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorChartsRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorChartsRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Revenue Performance */}
        <div className={`p-6 rounded-3xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
        }`}>
          <div className="space-y-1 mb-6">
            <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              Category Breakdown
            </span>
            <h3 className="text-sm font-bold font-mono">Revenue & Pieces Sold by Collection Category</h3>
          </div>

          <div className="h-72 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Order Status Distribution */}
        <div className={`p-6 rounded-3xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
        }`}>
          <div className="space-y-1 mb-6">
            <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
              <PieChart className="w-3.5 h-3.5 text-purple-500" />
              Logistics Statistics
            </span>
            <h3 className="text-sm font-bold font-mono">Order volume by active Logistics state</h3>
          </div>

          {statusData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-neutral-400 italic">
              No orders logged for status distribution statistics.
            </div>
          ) : (
            <div className="h-72 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#27272a" : "#f4f4f5"} />
                  <XAxis 
                    type="number"
                    stroke={isDarkMode ? "#71717a" : "#a1a1aa"} 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    stroke={isDarkMode ? "#71717a" : "#a1a1aa"} 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? "#18181b" : "#ffffff", 
                      borderColor: isDarkMode ? "#27272a" : "#e4e4e7",
                      borderRadius: "12px",
                      color: isDarkMode ? "#f4f4f5" : "#18181b"
                    }} 
                  />
                  <Bar dataKey="Count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 4 / Table: Top Performing Products */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
        }`}>
          <div>
            <div className="space-y-1 mb-6">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5 text-amber-500" />
                Product Leaderboard
              </span>
              <h3 className="text-sm font-bold font-mono">Top 5 Best-Selling Premium Designs</h3>
            </div>

            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400 italic">No items sold yet. Leaders will populate upon paid checkouts.</div>
              ) : (
                topProducts.map((p, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono font-bold text-neutral-400 w-4">#{index + 1}</span>
                      <img src={p.image} alt="" className="w-8 h-10 object-cover rounded bg-neutral-200" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate max-w-[150px] sm:max-w-[200px]">{p.name}</p>
                        <p className="text-[9px] text-neutral-400 font-mono uppercase">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold">{p.quantity} sold</p>
                      <p className="text-[10px] text-emerald-500">+${p.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`border-t pt-4 mt-6 flex justify-between items-center text-[11px] font-mono ${
            isDarkMode ? 'border-zinc-850' : 'border-neutral-100'
          }`}>
            <span className="text-neutral-400">Paid Checkout Ratio</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              100% Secure Flow
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
