/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  ShoppingBag, 
  ArrowUpRight,
  PackageCheck,
  Percent,
  Eye,
  MapPin,
  Calendar,
  FileSpreadsheet,
  FileDown
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
import toast from 'react-hot-toast';

interface AdminChartsProps {
  orders: Order[];
  products: Product[];
  isDarkMode: boolean;
}

export const AdminCharts: React.FC<AdminChartsProps> = ({ orders, products, isDarkMode }) => {
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'geography'>('sales');

  // 1. Calculate Daily Sales Data for the last 15 days
  const get15DaysSalesData = () => {
    const data = [];
    // Anchor time on simulated date July 13, 2026
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

  // 2. Revenue by Month (Monthly Sales)
  const getMonthlySalesData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = 2026;

    return months.map((month, index) => {
      const monthOrders = paidOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getUTCFullYear() === currentYear && d.getUTCMonth() === index;
      });

      const totalRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);
      const totalVolume = monthOrders.length;

      return {
        name: month,
        Revenue: Math.round(totalRevenue),
        Orders: totalVolume
      };
    });
  };

  const monthlySalesData = getMonthlySalesData();

  // 3. Apparel Category Sales Performance
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

  // 4. Product Sales Leaderboard Top 5
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

  // 5. Most Viewed Products (top 5 by views count)
  const getMostViewedProducts = () => {
    return [...products]
      .filter(p => (p.views || 0) > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  };

  const mostViewedProducts = getMostViewedProducts();

  // 6. Orders by City
  const getOrdersByCityData = () => {
    const cityStats: Record<string, { city: string; count: number; revenue: number }> = {};

    paidOrders.forEach(o => {
      const city = o.shippingAddress?.city || 'Unknown';
      if (!cityStats[city]) {
        cityStats[city] = { city, count: 0, revenue: 0 };
      }
      cityStats[city].count += 1;
      cityStats[city].revenue += o.total;
    });

    return Object.values(cityStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map(c => ({
        name: c.city,
        Revenue: Math.round(c.revenue),
        Orders: c.count
      }));
  };

  const citySalesData = getOrdersByCityData();

  // Export to Excel (CSV)
  const handleExportExcel = () => {
    if (orders.length === 0) {
      toast.error("No transaction logs available to export.");
      return;
    }

    const headers = ["Order ID", "Date", "Customer Email", "Total Amount ($)", "Items Purchased", "Shipping City", "Payment Status", "Order Status"];
    const rows = orders.map(o => [
      o.id,
      new Date(o.createdAt).toLocaleDateString(),
      o.email,
      o.total.toFixed(2),
      o.items.reduce((sum, item) => sum + item.quantity, 0),
      o.shippingAddress?.city || 'N/A',
      o.paymentStatus,
      o.orderStatus
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MK_Fashion_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Excel CSV report downloaded successfully!", { icon: '📊' });
  };

  // Export to PDF (Custom format printable window)
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to export executive PDF report.");
      return;
    }
    
    const reportDate = new Date().toLocaleDateString();
    const totalRev = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalVolume = orders.length;
    
    const html = `
      <html>
        <head>
          <title>MK FASHION - Executive Business Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 35px; }
            .title { font-size: 26px; font-weight: 800; letter-spacing: 3px; color: #111; }
            .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #777; margin-top: 4px; }
            .meta { font-size: 11px; color: #555; text-align: right; line-height: 1.6; }
            .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 45px; }
            .kpi-card { border: 1px solid #e5e5e5; padding: 20px; border-radius: 12px; background: #fafafa; }
            .kpi-title { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 6px; font-weight: bold; letter-spacing: 1px; }
            .kpi-value { font-size: 22px; font-weight: 800; font-family: monospace; color: #111; }
            h3 { font-size: 15px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size: 11px; }
            th { background: #f5f5f5; text-align: left; padding: 10px 12px; border-bottom: 1px solid #ccc; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            td { padding: 10px 12px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; }
            .footer { text-align: center; margin-top: 60px; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 25px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">MK FASHION</div>
              <div class="subtitle">Atelier backoffice analytics report</div>
            </div>
            <div class="meta">
              Report Date: <strong>${reportDate}</strong><br>
              Auditor Identity: <strong>Admin Backoffice</strong><br>
              System State: <strong>ONLINE / ACTIVE</strong>
            </div>
          </div>
          
          <div class="kpis">
            <div class="kpi-card">
              <div class="kpi-title">Total Revenue</div>
              <div class="kpi-value">$${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Total Orders Logs</div>
              <div class="kpi-value">${totalVolume}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Active Products Registry</div>
              <div class="kpi-value">${products.length}</div>
            </div>
          </div>
          
          <h3>Recent Order Invoices</h3>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Email</th>
                <th>Destination City</th>
                <th class="text-right">Total Charge ($)</th>
                <th>Payment Status</th>
                <th>Logistics State</th>
              </tr>
            </thead>
            <tbody>
              ${orders.slice(0, 15).map(o => `
                <tr>
                  <td class="font-mono">${o.id}</td>
                  <td>${o.email}</td>
                  <td>${o.shippingAddress?.city || 'N/A'}</td>
                  <td class="font-mono text-right">$${o.total.toFixed(2)}</td>
                  <td style="color: ${o.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'}; font-weight: bold;">${o.paymentStatus.toUpperCase()}</td>
                  <td>${o.orderStatus}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3>Premium Product views leaderboard</h3>
          <table>
            <thead>
              <tr>
                <th>SKU ID</th>
                <th>Design Label</th>
                <th>Category</th>
                <th class="text-right">Current Stock</th>
                <th class="text-right">Estimated Views</th>
              </tr>
            </thead>
            <tbody>
              ${products.slice(0, 10).map(p => `
                <tr>
                  <td class="font-mono">${p.id}</td>
                  <td>${p.name}</td>
                  <td>${p.category}</td>
                  <td class="font-mono text-right">${p.stock}</td>
                  <td class="font-mono text-right">${p.views || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            © ${new Date().getFullYear()} MK Fashion Private Atelier Client backoffice report. Confidential.
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Color schemes for charts
  const barColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100/10 pb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Business Intel & Statistics</h2>
          <p className="text-xs text-neutral-400">
            Realtime insights on sales curves, geographical demand, and product performance metrics.
          </p>
        </div>
        
        {/* Export Button Drawer */}
        <div className="flex items-center gap-2">
          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all duration-250 cursor-pointer ${
              isDarkMode 
                ? 'bg-[#18181B] border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white' 
                : 'bg-white border border-neutral-200 text-gray-700 hover:bg-neutral-50 hover:text-black'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>EXPORT EXCEL</span>
          </button>
          
          <button
            id="btn-export-pdf"
            onClick={handleExportPDF}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all duration-250 cursor-pointer ${
              isDarkMode 
                ? 'bg-zinc-100 hover:bg-zinc-200 text-black' 
                : 'bg-zinc-900 hover:bg-black text-white'
            }`}
          >
            <FileDown className="w-4 h-4" />
            <span>EXPORT EXECUTIVE PDF</span>
          </button>
        </div>
      </div>

      {/* Analytics Category Tabs Selector */}
      <div className="flex border-b border-neutral-100/10 gap-4">
        <button
          id="tab-sales"
          onClick={() => setActiveTab('sales')}
          className={`pb-3 text-xs font-semibold tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'sales'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span className="flex items-center gap-1.5 uppercase">
            <TrendingUp className="w-4 h-4" />
            Sales Velocity
          </span>
        </button>

        <button
          id="tab-products"
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-xs font-semibold tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'products'
              ? 'border-purple-500 text-purple-500 font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span className="flex items-center gap-1.5 uppercase">
            <ShoppingBag className="w-4 h-4" />
            Product Engagement
          </span>
        </button>

        <button
          id="tab-geography"
          onClick={() => setActiveTab('geography')}
          className={`pb-3 text-xs font-semibold tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'geography'
              ? 'border-blue-500 text-blue-500 font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span className="flex items-center gap-1.5 uppercase">
            <MapPin className="w-4 h-4" />
            Geographic Stats
          </span>
        </button>
      </div>

      {/* Grid of charts based on selection */}
      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Daily Revenue */}
          <div className={`p-6 rounded-3xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
          }`}>
            <div className="space-y-1 mb-6">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Daily Sales Revenue
              </span>
              <h3 className="text-sm font-bold font-mono">15-Day Revenue Velocity ($)</h3>
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

          {/* Chart 2: Monthly Sales Performance */}
          <div className={`p-6 rounded-3xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
          }`}>
            <div className="space-y-1 mb-6">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Monthly Revenue (Revenue by Month)
              </span>
              <h3 className="text-sm font-bold font-mono">Sales performance across 2026 ($)</h3>
            </div>

            <div className="h-72 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {monthlySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#3b82f6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Selling Products */}
          <div className={`p-6 rounded-3xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
          }`}>
            <div className="space-y-1 mb-6">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5 text-amber-500" />
                Top Selling Products
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

          {/* Most Viewed Products */}
          <div className={`p-6 rounded-3xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
          }`}>
            <div className="space-y-1 mb-6">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-purple-500" />
                Most Viewed Products
              </span>
              <h3 className="text-sm font-bold font-mono">Top 5 Highly Engaged/Viewed Creations</h3>
            </div>

            <div className="space-y-4">
              {mostViewedProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400 italic font-sans">No products with registered views. Start exploring the boutique.</div>
              ) : (
                mostViewedProducts.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono font-bold text-neutral-400 w-4">#{index + 1}</span>
                      <img src={p.images[0]} alt="" className="w-8 h-10 object-cover rounded bg-neutral-200" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate max-w-[150px] sm:max-w-[200px]">{p.name}</p>
                        <p className="text-[9px] text-neutral-400 font-mono uppercase">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold flex items-center gap-1 justify-end">
                        <Eye className="w-3 h-3 text-neutral-400" />
                        <span>{p.views || 0} clicks</span>
                      </p>
                      <p className="text-[10px] text-neutral-400">Stock: {p.stock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Category Revenue Distribution */}
          <div className={`p-6 rounded-3xl border lg:col-span-2 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
          }`}>
            <div className="space-y-1 mb-6">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-pink-500" />
                Category Performance Breakdown
              </span>
              <h3 className="text-sm font-bold font-mono">Total Revenue generated by clothing collections ($)</h3>
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
                  <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'geography' && (
        <div className="grid grid-cols-1 gap-8">
          
          {/* Orders by City Chart */}
          <div className={`p-6 rounded-3xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-neutral-150 text-gray-800'
          }`}>
            <div className="space-y-1 mb-6">
              <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                Orders by City (Geographical Distribution)
              </span>
              <h3 className="text-sm font-bold font-mono">Top Sales Volume Cities & Cumulative Revenue</h3>
            </div>

            {citySalesData.length === 0 ? (
              <div className="py-20 text-center text-xs text-neutral-400 italic">No geographic distribution logs available yet. Paid checkouts will establish regional stats.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                
                {/* Bar Chart Representation */}
                <div className="lg:col-span-2 h-72 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={citySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]}>
                        {citySalesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Detailed Regional Revenue</h4>
                  <div className="space-y-3">
                    {citySalesData.map((item, idx) => (
                      <div key={item.name} className="flex justify-between items-center text-xs border-b border-neutral-100/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 font-mono text-neutral-500 font-bold">#{idx+1}</span>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold">${item.Revenue.toLocaleString()}</p>
                          <p className="text-[10px] text-neutral-400">{item.Orders} orders</p>
                        </div>
                      </div>
                    ))}
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
