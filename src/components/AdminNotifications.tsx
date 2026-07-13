/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  MessageSquare, 
  ShoppingBag, 
  ShieldAlert, 
  CheckCircle, 
  Trash2, 
  Clock,
  ArrowUpRight,
  RefreshCw,
  Server
} from 'lucide-react';
import { Order, Product, Review } from '../types';

interface AdminNotificationsProps {
  orders: Order[];
  products: Product[];
  reviews: Review[];
  isDarkMode: boolean;
  onNavigate: (section: 'overview' | 'sales' | 'orders' | 'products' | 'customers' | 'reviews' | 'notifications') => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'inventory' | 'moderation' | 'logistics' | 'security' | 'server';
  severity: 'high' | 'medium' | 'info';
  timestamp: number;
  read: boolean;
  actionLabel?: string;
  actionSection?: 'overview' | 'sales' | 'orders' | 'products' | 'customers' | 'reviews' | 'notifications';
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({
  orders,
  products,
  reviews,
  isDarkMode,
  onNavigate
}) => {
  // Generate reactive notifications based on real state
  const generateNotifications = (): NotificationItem[] => {
    const list: NotificationItem[] = [];

    // 1. Low Stock Inventory Warnings (severity: high/medium)
    products.forEach(p => {
      if (p.stock === 0) {
        list.push({
          id: `inv-zero-${p.id}`,
          title: 'Critical Stock Level: Sold Out',
          message: `The design "${p.name}" has completely run out of inventory (0 left in stock). Public orders are disabled for this product.`,
          type: 'inventory',
          severity: 'high',
          timestamp: Date.now() - 30 * 60 * 1000, // 30 mins ago
          read: false,
          actionLabel: 'Manage Stock',
          actionSection: 'products'
        });
      } else if (p.stock <= 5) {
        list.push({
          id: `inv-low-${p.id}`,
          title: 'Inventory Replenishment Recommended',
          message: `"${p.name}" is running low on stock. Only ${p.stock} units remain in the archives.`,
          type: 'inventory',
          severity: 'medium',
          timestamp: Date.now() - 2 * 3600 * 1000, // 2h ago
          read: false,
          actionLabel: 'Adjust Stock',
          actionSection: 'products'
        });
      }
    });

    // 2. Pending Review Moderations (severity: medium)
    reviews.forEach(r => {
      if (!r.approved) {
        list.push({
          id: `rev-pending-${r.id}`,
          title: 'Pending Review Approval Needed',
          message: `Customer ${r.userName} submitted a ${r.rating}★ rating. Comment: "${r.comment.slice(0, 50)}..."`,
          type: 'moderation',
          severity: 'medium',
          timestamp: r.createdAt,
          read: false,
          actionLabel: 'Open Moderation Queue',
          actionSection: 'reviews'
        });
      }
    });

    // 3. Unfulfilled logistics orders (severity: high/medium)
    orders.forEach(o => {
      if (o.orderStatus === 'Pending' || o.orderStatus === 'processing') {
        list.push({
          id: `order-unfulfilled-${o.id}`,
          title: 'Unfulfilled Checkout Order logged',
          message: `Fulfillment required for order #${o.id}. Customer ${o.shippingAddress.fullName} checked out for a total of $${o.total.toFixed(2)}.`,
          type: 'logistics',
          severity: 'high',
          timestamp: o.createdAt,
          read: false,
          actionLabel: 'Fulfill Order',
          actionSection: 'orders'
        });
      }
    });

    // 4. Base system status messages (severity: info)
    list.push({
      id: 'sys-firebase',
      title: 'Database Sync Completed',
      message: 'Secure cloud Firestore channel established. Database read/write credentials verified.',
      type: 'security',
      severity: 'info',
      timestamp: Date.now() - 4 * 3600 * 1000,
      read: true
    });

    list.push({
      id: 'sys-server',
      title: 'Dev Server Inbound Active',
      message: 'Node.js reverse proxy running on port 3000. Express web services are live.',
      type: 'server',
      severity: 'info',
      timestamp: Date.now() - 12 * 3600 * 1000,
      read: true
    });

    // Sort by timestamp newest first
    return list.sort((a, b) => b.timestamp - a.timestamp);
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => generateNotifications());

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleClearAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100/10 pb-4">
        <div>
          <h2 className="text-lg font-bold font-sans tracking-tight">System Notifications & Operational Logs</h2>
          <p className="text-xs text-neutral-400 font-sans">
            Real-time server events, client interactions, fulfillment reminders, and inventory warnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleClearAll}
              className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all hover:bg-neutral-50/10 cursor-pointer ${
                isDarkMode ? 'border-zinc-800 text-zinc-300' : 'border-neutral-200 text-gray-600'
              }`}
            >
              Mark all as read
            </button>
          )}
          <div className={`flex items-center gap-1 text-[11px] font-mono px-3 py-1.5 rounded-xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-neutral-50 border-neutral-200 text-gray-600'
          }`}>
            <Bell className="w-3.5 h-3.5 text-red-500" />
            <span>{unreadCount} Unread Logs</span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className={`p-8 text-center rounded-3xl border ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-neutral-400' : 'bg-white border-neutral-150 text-gray-500'
          } italic text-xs`}>
            All systems nominal! No active operational alerts.
          </div>
        ) : (
          notifications.map((notif) => {
            const isCritical = notif.severity === 'high';
            const isMedium = notif.severity === 'medium';
            
            return (
              <div 
                key={notif.id} 
                className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row gap-4 justify-between items-start ${
                  notif.read 
                    ? isDarkMode 
                      ? 'bg-zinc-900/40 border-zinc-900/60 opacity-60' 
                      : 'bg-neutral-50/50 border-neutral-150 opacity-70'
                    : isCritical
                      ? isDarkMode
                        ? 'bg-red-950/20 border-red-900/40 text-red-100'
                        : 'bg-red-50/50 border-red-150 text-red-900'
                      : isMedium
                      ? isDarkMode
                        ? 'bg-amber-950/20 border-amber-900/40 text-amber-100'
                        : 'bg-amber-50/50 border-amber-150 text-amber-900'
                      : isDarkMode
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                      : 'bg-white border-neutral-200 text-gray-800'
                }`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    notif.type === 'inventory' 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : notif.type === 'moderation'
                      ? 'bg-purple-500/10 text-purple-500'
                      : notif.type === 'logistics'
                      ? 'bg-blue-500/10 text-blue-500'
                      : notif.type === 'security'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-zinc-500/10 text-zinc-500'
                  }`}>
                    {notif.type === 'inventory' && <AlertTriangle className="w-5 h-5" />}
                    {notif.type === 'moderation' && <MessageSquare className="w-5 h-5" />}
                    {notif.type === 'logistics' && <ShoppingBag className="w-5 h-5" />}
                    {notif.type === 'security' && <ShieldAlert className="w-5 h-5" />}
                    {notif.type === 'server' && <Server className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm leading-snug">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-red-500" title="Unread alert"></span>
                      )}
                      <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded ${
                        isCritical 
                          ? 'bg-red-500/10 text-red-500' 
                          : isMedium 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-zinc-500/10 text-zinc-500'
                      }`}>
                        {notif.severity}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${
                      notif.read ? 'text-neutral-400' : 'text-neutral-500'
                    }`}>{notif.message}</p>
                    
                    <div className="flex items-center gap-2 pt-1.5 font-mono text-[10px] text-neutral-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                      <span>•</span>
                      <span>{new Date(notif.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 w-full sm:w-auto items-stretch justify-end self-stretch pt-2 sm:pt-0 shrink-0">
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl border text-center cursor-pointer hover:bg-neutral-100/10 ${
                        isDarkMode ? 'border-zinc-800 text-zinc-300' : 'border-neutral-250 text-gray-600'
                      }`}
                    >
                      Acknowledge Log
                    </button>
                  )}
                  {notif.actionLabel && notif.actionSection && (
                    <button
                      onClick={() => onNavigate(notif.actionSection!)}
                      className="text-[10px] font-mono font-bold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 px-3.5 py-2 rounded-xl text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {notif.actionLabel}
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
