/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  History, 
  Plus, 
  Minus, 
  RefreshCw, 
  Search, 
  FileText, 
  Filter,
  CheckCircle2,
  Inbox
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { updateProduct, getInventoryLogs, addInventoryLog } from '../services/dbService';
import { Product, InventoryLog } from '../types';
import toast from 'react-hot-toast';

interface AdminInventoryProps {
  products: Product[];
  onProductUpdated: () => void;
  isDarkMode: boolean;
}

export const AdminInventory: React.FC<AdminInventoryProps> = ({
  products,
  onProductUpdated,
  isDarkMode
}) => {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'purchase' | 'manual_restock' | 'manual_adjustment' | 'add_product' | 'delete_product'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Load Inventory History Logs from Firestore
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const fetchedLogs = await getInventoryLogs();
      setLogs(fetchedLogs);
    } catch (err) {
      console.error("Error fetching inventory logs:", err);
      toast.error("Failed to sync inventory history log from Firestore.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [products]);

  // Calculations
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStockItems = products.filter(p => p.stock === 0);
  const averageStock = products.length > 0 ? Math.round(totalStock / products.length) : 0;

  // Category Stock Chart Data
  const categoriesMap: { [key: string]: number } = {};
  products.forEach(p => {
    categoriesMap[p.category] = (categoriesMap[p.category] || 0) + p.stock;
  });
  const chartData = Object.keys(categoriesMap).map(cat => ({
    name: cat,
    Stock: categoriesMap[cat]
  }));

  // Quick Manual Stock Incrementor / Decrementor
  const handleQuickStockUpdate = async (id: string, currentStock: number, change: number, name: string) => {
    const updatedStock = Math.max(0, currentStock + change);
    try {
      await updateProduct(id, { stock: updatedStock });
      
      // Log manual stock modification
      await addInventoryLog({
        productId: id,
        productName: name,
        changeType: change > 0 ? 'manual_restock' : 'manual_adjustment',
        quantityChanged: change,
        oldStock: currentStock,
        newStock: updatedStock,
        notes: change > 0 ? 'Quick stock restock (+)' : 'Quick stock adjustment (-)'
      });

      toast.success(`Updated "${name}" stock to ${updatedStock}`, { id: "quick-stock", duration: 1500 });
      onProductUpdated(); // Triggers re-fetch of products in parent component
    } catch (err) {
      toast.error(`Failed to adjust stock for ${name}`);
    }
  };

  // Filter products by stock status
  const filteredProducts = products.filter(p => {
    if (stockStatusFilter === 'low') return p.stock > 0 && p.stock <= 5;
    if (stockStatusFilter === 'out') return p.stock === 0;
    return true;
  });

  // Filter inventory logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = logFilter === 'all' || log.changeType === logFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100/10 pb-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">Atelier Inventory Dashboard</h2>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            Durable real-time tracking, low stock alerts, and append-only audit logs backed by Google Firestore.
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loadingLogs}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider border cursor-pointer transition-all ${
            isDarkMode 
              ? 'border-zinc-850 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white' 
              : 'border-neutral-250 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-black'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
          {loadingLogs ? 'Syncing...' : 'Sync Logs'}
        </button>
      </div>

      {/* 4-Column Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card: Total Stock */}
        <div className={`p-4 rounded-3xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono uppercase text-neutral-400 tracking-wider">Stock Volume</span>
            <div className={`p-2 rounded-2xl ${isDarkMode ? 'bg-zinc-950 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black font-mono leading-none">{totalStock}</h3>
            <p className="text-[10px] text-neutral-400 font-sans mt-1.5">
              Across all catalog items ({products.length} designs)
            </p>
          </div>
        </div>

        {/* Card: Low Stock Alerts */}
        <button 
          onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            stockStatusFilter === 'low'
              ? 'ring-2 ring-amber-500/50 bg-amber-500/5 border-amber-500/20'
              : isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-neutral-150 hover:border-neutral-350'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono uppercase text-neutral-400 tracking-wider">Low Stock alerts</span>
            <div className={`p-2 rounded-2xl ${
              lowStockItems.length > 0 
                ? 'bg-amber-500/10 text-amber-500' 
                : isDarkMode ? 'bg-zinc-950 text-neutral-500' : 'bg-neutral-50 text-neutral-400'
            }`}>
              <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black font-mono leading-none text-amber-500">{lowStockItems.length}</h3>
            <p className="text-[10px] text-neutral-400 font-sans mt-1.5 flex items-center justify-between">
              <span>Items at 5 units or less</span>
              {stockStatusFilter === 'low' && <span className="font-mono text-[9px] uppercase font-bold text-amber-500">[Filtered]</span>}
            </p>
          </div>
        </button>

        {/* Card: Out of Stock */}
        <button 
          onClick={() => setStockStatusFilter(stockStatusFilter === 'out' ? 'all' : 'out')}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            stockStatusFilter === 'out'
              ? 'ring-2 ring-red-500/50 bg-red-500/5 border-red-500/20'
              : isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-neutral-150 hover:border-neutral-350'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono uppercase text-neutral-400 tracking-wider">Out of Stock</span>
            <div className={`p-2 rounded-2xl ${
              outOfStockItems.length > 0 
                ? 'bg-red-500/10 text-red-500' 
                : isDarkMode ? 'bg-zinc-950 text-neutral-500' : 'bg-neutral-50 text-neutral-400'
            }`}>
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black font-mono leading-none text-red-500">{outOfStockItems.length}</h3>
            <p className="text-[10px] text-neutral-400 font-sans mt-1.5 flex items-center justify-between">
              <span>Immediate restock needed</span>
              {stockStatusFilter === 'out' && <span className="font-mono text-[9px] uppercase font-bold text-red-500">[Filtered]</span>}
            </p>
          </div>
        </button>

        {/* Card: Stock Health Index */}
        <div className={`p-4 rounded-3xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono uppercase text-neutral-400 tracking-wider">Avg stock / item</span>
            <div className={`p-2 rounded-2xl ${isDarkMode ? 'bg-zinc-950 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black font-mono leading-none">{averageStock}</h3>
            <p className="text-[10px] text-neutral-400 font-sans mt-1.5">
              Healthy distributed inventory
            </p>
          </div>
        </div>

      </div>

      {/* Middle row: Chart & Quick Alert Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category breakdown visualizer */}
        <div className={`lg:col-span-7 p-5 rounded-3xl border ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
        }`}>
          <div className="mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Stock Density by Category</h3>
            <p className="text-[10px] text-neutral-400 font-sans mt-0.5">Stock count breakdown per retail category.</p>
          </div>

          <div className="h-64 w-full text-xs font-mono">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 italic">No category data to visualize.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#27272a" : "#f4f4f5"} />
                  <XAxis dataKey="name" stroke="#888888" tickLine={false} tick={{ fontSize: 9 }} />
                  <YAxis stroke="#888888" tickLine={false} tick={{ fontSize: 9 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#18181b' : '#ffffff', 
                      borderColor: isDarkMode ? '#27272a' : '#e4e4e7',
                      color: isDarkMode ? '#f4f4f5' : '#09090b',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      borderRadius: '12px'
                    }} 
                  />
                  <Bar dataKey="Stock" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isDarkMode ? '#ffffff' : '#000000'} 
                        fillOpacity={0.85 - (index * 0.08)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Real-time Alerts Action Panel */}
        <div className={`lg:col-span-5 p-5 rounded-3xl border flex flex-col justify-between ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Critical Stock Status</h3>
                <p className="text-[10px] text-neutral-400 font-sans mt-0.5">Requires replenishment attention.</p>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setStockStatusFilter('all')} 
                  className={`text-[9px] font-bold font-mono px-2 py-1 rounded-lg border uppercase ${
                    stockStatusFilter === 'all' 
                      ? 'bg-black text-white border-black' 
                      : isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-neutral-250 text-neutral-500 hover:text-black'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setStockStatusFilter('low')} 
                  className={`text-[9px] font-bold font-mono px-2 py-1 rounded-lg border uppercase ${
                    stockStatusFilter === 'low' 
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                      : isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-neutral-250 text-neutral-500 hover:text-black'
                  }`}
                >
                  Low
                </button>
                <button 
                  onClick={() => setStockStatusFilter('out')} 
                  className={`text-[9px] font-bold font-mono px-2 py-1 rounded-lg border uppercase ${
                    stockStatusFilter === 'out' 
                      ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                      : isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-neutral-250 text-neutral-500 hover:text-black'
                  }`}
                >
                  Out
                </button>
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[190px] pr-1.5 scrollbar-thin">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400 italic">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1.5 animate-pulse" />
                  <p className="text-xs font-semibold">Stock status is perfect!</p>
                  <p className="text-[9px] text-neutral-500 mt-0.5">No products meet current filter criteria.</p>
                </div>
              ) : (
                filteredProducts.map(p => {
                  const isOut = p.stock === 0;
                  const isLow = p.stock > 0 && p.stock <= 5;
                  return (
                    <div 
                      key={p.id} 
                      className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                        isOut 
                          ? 'bg-red-500/5 border-red-500/10' 
                          : isLow 
                            ? 'bg-amber-500/5 border-amber-500/10' 
                            : isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-neutral-50/50 border-neutral-150'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img 
                          src={p.images[0]} 
                          alt="" 
                          className="w-7 h-9 object-cover rounded bg-neutral-200 shrink-0" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="truncate">
                          <h4 className={`font-semibold truncate ${isDarkMode ? 'text-zinc-100' : 'text-neutral-900'}`}>{p.name}</h4>
                          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">
                            SKU: {p.sku || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Stock label status */}
                        {isOut ? (
                          <span className="bg-red-500/10 text-red-500 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full uppercase">Out</span>
                        ) : isLow ? (
                          <span className="bg-amber-500/10 text-amber-500 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full uppercase">{p.stock} left</span>
                        ) : (
                          <span className="bg-zinc-500/10 text-zinc-400 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full uppercase">{p.stock} units</span>
                        )}

                        {/* Adjust controls */}
                        <div className="flex items-center gap-1 bg-black/10 dark:bg-black/40 rounded-lg p-0.5">
                          <button
                            onClick={() => handleQuickStockUpdate(p.id, p.stock, -1, p.name)}
                            className="p-1 hover:bg-black/25 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                            title="Decrease Stock"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleQuickStockUpdate(p.id, p.stock, 1, p.name)}
                            className="p-1 hover:bg-black/25 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                            title="Increase Stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-neutral-100/10 pt-3 mt-3 text-[10px] text-neutral-400 font-sans flex items-center justify-between">
            <span>Direct manual overrides immediately save to Firestore.</span>
          </div>
        </div>

      </div>

      {/* Durable Inventory History Ledger */}
      <div className={`p-5 rounded-3xl border ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Durable Inventory Audit History</h3>
              <p className="text-[10px] text-neutral-400 font-sans mt-0.5">Read-only real-time transaction ledger of stock movements.</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2 text-xs font-sans">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search logs by product, SKU, order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-8.5 pr-4 py-1.5 rounded-xl text-xs focus:outline-none border w-full sm:w-[220px] ${
                  isDarkMode ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-white border-neutral-250 text-neutral-900'
                }`}
              />
            </div>

            {/* Change Type Filter select */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as any)}
                className={`px-3 py-1.5 rounded-xl text-xs outline-none border cursor-pointer ${
                  isDarkMode ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-white border-neutral-250 text-neutral-900'
                }`}
              >
                <option value="all">All Operations</option>
                <option value="purchase">Orders / Purchases</option>
                <option value="manual_restock">Manual Restocks (+)</option>
                <option value="manual_adjustment">Manual Deductions (-)</option>
                <option value="add_product">Product Additions</option>
                <option value="delete_product">Product Deletions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-100/10">
          <table className="w-full text-xs text-left divide-y divide-neutral-100/10 font-sans">
            <thead className={`text-[10px] font-bold font-mono text-neutral-400 uppercase tracking-wider ${
              isDarkMode ? 'bg-zinc-950' : 'bg-neutral-50'
            }`}>
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Product design</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3 text-right">Adjustment</th>
                <th className="py-2.5 px-3 text-right">Transition (Old → New)</th>
                <th className="py-2.5 px-3">Transaction Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400 italic">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Inbox className="w-8 h-8 text-neutral-600 mb-1" />
                      <span>No inventory history matches filters.</span>
                      <p className="text-[9px] text-neutral-500">Checkout operations or catalog updates will auto-append logs here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  // Style configurations based on operation type
                  let typeLabel = '';
                  let typeStyle = '';
                  let qtyPrefix = '';
                  let qtyStyle = '';

                  switch (log.changeType) {
                    case 'purchase':
                      typeLabel = 'Purchase deduction';
                      typeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                      qtyPrefix = '';
                      qtyStyle = 'text-blue-500';
                      break;
                    case 'manual_restock':
                      typeLabel = 'Manual Restock';
                      typeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      qtyPrefix = '+';
                      qtyStyle = 'text-emerald-500 font-bold';
                      break;
                    case 'manual_adjustment':
                      typeLabel = 'Manual Adjust';
                      typeStyle = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                      qtyPrefix = log.quantityChanged > 0 ? '+' : '';
                      qtyStyle = log.quantityChanged > 0 ? 'text-emerald-500 font-semibold' : 'text-amber-500';
                      break;
                    case 'add_product':
                      typeLabel = 'Product Added';
                      typeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                      qtyPrefix = '+';
                      qtyStyle = 'text-purple-500 font-bold';
                      break;
                    case 'delete_product':
                      typeLabel = 'Product Deleted';
                      typeStyle = 'bg-red-500/10 text-red-400 border-red-500/20';
                      qtyPrefix = '';
                      qtyStyle = 'text-red-500';
                      break;
                    default:
                      typeLabel = log.changeType;
                      typeStyle = 'bg-neutral-500/10 text-zinc-400 border-neutral-500/20';
                      qtyPrefix = '';
                      qtyStyle = 'text-zinc-300';
                  }

                  return (
                    <tr key={log.id} className={isDarkMode ? 'hover:bg-zinc-850/40' : 'hover:bg-neutral-50/50'}>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-neutral-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-zinc-100 max-w-[150px] truncate" title={log.productName}>
                          {log.productName}
                        </div>
                        <span className="text-[9px] font-mono text-neutral-400 block truncate">
                          ID: {log.productId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block border text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${typeStyle}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${qtyStyle}`}>
                        {qtyPrefix}{log.quantityChanged}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-neutral-400">
                        {log.oldStock} <span className="text-neutral-500">→</span> <span className="text-zinc-200 font-bold">{log.newStock}</span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400 max-w-[150px] truncate" title={log.notes || '—'}>
                        {log.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
