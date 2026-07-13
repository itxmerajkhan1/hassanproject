/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Printer, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Truck, 
  PackageCheck, 
  AlertCircle, 
  X, 
  ExternalLink,
  ChevronRight,
  Clipboard,
  RefreshCw,
  Coins
} from 'lucide-react';
import { Order } from '../types';
import { updateOrder } from '../services/dbService';
import toast from 'react-hot-toast';

interface AdminOrdersProps {
  orders: Order[];
  onOrderUpdated: () => void;
  isDarkMode: boolean;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onOrderUpdated,
  isDarkMode
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders.length > 0 ? orders[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Order['orderStatus']>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | Order['paymentStatus']>('All');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Synchronize first selection if list changes and previous selection no longer exists
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || (orders.length > 0 ? orders[0] : null);

  // Status List definitions for progress bar / quick actions
  const statusSteps: Order['orderStatus'][] = [
    'Pending',
    'Confirmed',
    'Packed',
    'Shipped',
    'Out For Delivery',
    'Delivered'
  ];

  // Helper to copy text to clipboard
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`, { id: 'copy' });
  };

  // Status Color Mapping Helper
  const getStatusBadgeStyles = (status: Order['orderStatus']) => {
    const norm = status.toLowerCase();
    if (norm === 'pending' || norm === 'processing') {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
    if (norm === 'confirmed') {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
    if (norm === 'packed') {
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
    if (norm === 'shipped') {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
    if (norm === 'out for delivery') {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
    if (norm === 'delivered') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    return 'bg-red-500/10 text-red-500 border-red-500/20'; // Cancelled
  };

  const getPaymentBadgeStyles = (status: Order['paymentStatus']) => {
    if (status === 'paid') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (status === 'pending') {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  // Filter computation
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shippingAddress.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shippingAddress.phone.includes(searchQuery) ||
      o.shippingAddress.zipCode.includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || o.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Action: Update Order Status
  const handleStatusChange = async (orderId: string, newStatus: Order['orderStatus']) => {
    try {
      await updateOrder(orderId, { orderStatus: newStatus });
      toast.success(`Order #${orderId} status updated to ${newStatus.toUpperCase()}`, { id: 'status' });
      onOrderUpdated();
    } catch (err) {
      toast.error('Failed to update order status in Firestore.');
    }
  };

  // Action: Update Payment Status
  const handlePaymentChange = async (orderId: string, newPayment: Order['paymentStatus']) => {
    try {
      await updateOrder(orderId, { paymentStatus: newPayment });
      toast.success(`Order #${orderId} payment marked as ${newPayment.toUpperCase()}`, { id: 'payment' });
      onOrderUpdated();
    } catch (err) {
      toast.error('Failed to update payment status in Firestore.');
    }
  };

  // Print Invoice Utility (FOOLPROOF POPUP INJECTOR - works beautifully inside sandbox frames!)
  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Popup blocker blocked the invoice preview. Please permit popups for this dashboard.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Atelier Maison - Invoice #${order.id}</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 50px; color: #18181b; background: #ffffff; line-height: 1.5; }
            .header-layout { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 45px; border-bottom: 2px solid #f4f4f5; padding-bottom: 30px; }
            .logo-wrap { font-size: 26px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #000000; }
            .meta-invoice { text-align: right; }
            .meta-invoice h1 { margin: 0 0 5px 0; font-size: 32px; font-weight: 300; letter-spacing: 1px; color: #71717a; }
            .meta-invoice p { margin: 3px 0; font-size: 13px; color: #52525b; font-family: monospace; }
            .block-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 45px; }
            .data-card h3 { margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #a1a1aa; border-bottom: 1px solid #f4f4f5; padding-bottom: 6px; font-weight: 700; }
            .data-card p { margin: 4px 0; font-size: 13px; color: #27272a; }
            table { width: 100%; border-collapse: collapse; margin: 35px 0; }
            th { background: #fafafa; text-align: left; padding: 14px 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #e4e4e7; color: #71717a; font-weight: 700; }
            td { padding: 14px 16px; border-bottom: 1px solid #f4f4f5; font-size: 13px; color: #27272a; }
            .text-right { text-align: right; }
            .summary-flex { display: flex; justify-content: flex-end; margin-top: 30px; }
            .summary-table { width: 320px; }
            .summary-table td { padding: 8px 16px; border: none; font-size: 13px; color: #52525b; }
            .summary-table tr.total-row td { border-top: 2px solid #18181b; font-weight: 900; font-size: 16px; color: #000000; }
            .invoice-footer { text-align: center; margin-top: 80px; font-size: 11px; color: #71717a; border-top: 1px solid #f4f4f5; padding-top: 25px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header-layout">
            <div>
              <div class="logo-wrap">Atelier Maison</div>
              <p style="font-size: 11px; color: #71717a; margin: 6px 0 0 0; font-weight: 500;">Premium Couture & Minimal Curations</p>
              <p style="font-size: 11px; color: #a1a1aa; margin: 2px 0 0 0;">VAT ID: FR8932098432</p>
            </div>
            <div class="meta-invoice">
              <h1>INVOICE</h1>
              <p style="font-size: 14px; font-weight: 700; color: #18181b;">Order ID: #${order.id}</p>
              <p>Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p>Payment Mode: Card Secured</p>
            </div>
          </div>

          <div class="block-grid">
            <div class="data-card">
              <h3>Bill To</h3>
              <p><strong>${order.shippingAddress.fullName}</strong></p>
              <p>${order.shippingAddress.addressLine1}</p>
              ${order.shippingAddress.addressLine2 ? `<p>${order.shippingAddress.addressLine2}</p>` : ''}
              <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
              <p style="margin-top: 8px;"><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
              <p><strong>Email:</strong> ${order.email}</p>
            </div>
            <div class="data-card">
              <h3>Shipment & Payment Status</h3>
              <p><strong>Logistics Stage:</strong> <span style="text-transform: uppercase; font-family: monospace; font-weight: bold;">${order.orderStatus}</span></p>
              <p><strong>Payment Outcome:</strong> <span style="text-transform: uppercase; font-family: monospace; font-weight: bold; color: ${order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'};">${order.paymentStatus}</span></p>
              <p><strong>Carrier Terms:</strong> Free Standard Home Logistics</p>
              <p style="margin-top: 8px; font-size: 12px; color: #71717a; font-style: italic;">Transactions processed with end-to-end client-side encryption.</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Design Piece Description</th>
                <th style="width: 120px;">Selected Size</th>
                <th style="width: 120px;" class="text-right">Unit Price</th>
                <th style="width: 100px;" class="text-right">Quantity</th>
                <th style="width: 140px;" class="text-right">Item Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    <strong style="color: #000000;">${item.name}</strong>
                    <div style="font-size: 10px; color: #71717a; margin-top: 2px;">Color: ${item.selectedColor || 'Default'} | SKU: ${item.productId.substring(0, 8).toUpperCase()}</div>
                  </td>
                  <td><span style="font-family: monospace; background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${item.selectedSize}</span></td>
                  <td class="text-right">$${item.price.toFixed(2)}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right"><strong>$${(item.price * item.quantity).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-flex">
            <table class="summary-table">
              <tr>
                <td>Retail Subtotal:</td>
                <td class="text-right">$${order.total.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Shipping & Handling:</td>
                <td class="text-right" style="color: #10b981;">FREE</td>
              </tr>
              <tr>
                <td>Duties & Sales Tax:</td>
                <td class="text-right" style="color: #71717a;">$0.00</td>
              </tr>
              <tr class="total-row">
                <td>Invoice Total:</td>
                <td class="text-right">$${order.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="invoice-footer">
            <p>Thank you for your patronage. Your piece is crafted with utmost care and ethical responsibility.</p>
            <p>For support, exchanges, or styling guides, contact concierge@ateliermaison.com. Terms and conditions apply.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generate Styled Text File Invoice (Standard local file generation matching user request)
  const handleDownloadInvoiceData = (order: Order) => {
    const timestamp = new Date(order.createdAt).toISOString().split('T')[0];
    let invoiceContent = `====================================================
               ATELIER MAISON COUTURE
====================================================
INVOICE RECEIPT / PROOF OF PURCHASE
Order Reference: ${order.id}
Date Processed : ${new Date(order.createdAt).toLocaleString()}
Client Email   : ${order.email}

----------------- SHIPPING DETAILS -----------------
Recipient Name : ${order.shippingAddress.fullName}
Phone Contact  : ${order.shippingAddress.phone}
Address Line   : ${order.shippingAddress.addressLine1}
City / State   : ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}

---------------- STATUS & LOGISTICS ----------------
Fulfillment Stage: ${order.orderStatus.toUpperCase()}
Payment Status   : ${order.paymentStatus.toUpperCase()}

------------------ PURCHASED ITEMS -----------------
`;

    order.items.forEach((item, index) => {
      invoiceContent += `${index + 1}. ${item.name}
   Size: ${item.selectedSize} | Color: ${item.selectedColor || 'Default'}
   Qty: ${item.quantity} @ $${item.price.toFixed(2)} each
   Total: $${(item.price * item.quantity).toFixed(2)}\n\n`;
    });

    invoiceContent += `----------------- PRICING RECAP --------------------
Subtotal         : $${order.total.toFixed(2)}
Shipping Fees    : FREE
Estimated Duties : $0.00
----------------------------------------------------
TOTAL AMOUNT PAID: $${order.total.toFixed(2)}
====================================================
Thank you for your business. For concierge care, email
concierge@ateliermaison.com.
`;

    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Atelier_Invoice_${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Receipt document file downloaded successfully!");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Tab Header & Dashboard Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100/10 pb-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">Atelier Order Logistics Hub</h2>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            Administer customer orders, modify payment statuses, advance shipping stages, and export high-contrast print invoices.
          </p>
        </div>
      </div>

      {/* Mini metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'}`}>
          <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Logistics Queue</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-black font-mono">{orders.length}</span>
            <span className="text-[10px] text-neutral-400">Total orders</span>
          </div>
        </div>
        <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'}`}>
          <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Pending Actions</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-black font-mono text-amber-500">
              {orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'processing').length}
            </span>
            <span className="text-[10px] text-neutral-400">Awaiting confirmation</span>
          </div>
        </div>
        <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'}`}>
          <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Transit Stage</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-black font-mono text-purple-400">
              {orders.filter(o => o.orderStatus === 'Shipped' || o.orderStatus === 'Out For Delivery' || o.orderStatus === 'shipped').length}
            </span>
            <span className="text-[10px] text-neutral-400">With carrier</span>
          </div>
        </div>
        <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'}`}>
          <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider block">Awaiting Funds</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-black font-mono text-rose-500">
              {orders.filter(o => o.paymentStatus !== 'paid').length}
            </span>
            <span className="text-[10px] text-neutral-400">Unpaid / pending</span>
          </div>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-4 text-xs ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
      }`}>
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, email, zip code, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none border ${
              isDarkMode ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-white border-neutral-250 text-neutral-900'
            }`}
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-neutral-400 font-mono text-[10px] uppercase">Logistics:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`w-full md:w-auto px-3 py-2 rounded-xl outline-none border cursor-pointer font-medium ${
              isDarkMode ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-white border-neutral-250 text-neutral-900'
            }`}
          >
            <option value="All">All Stages</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Out For Delivery">Out For Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-neutral-400 font-mono text-[10px] uppercase">Payment:</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className={`w-full md:w-auto px-3 py-2 rounded-xl outline-none border cursor-pointer font-medium ${
              isDarkMode ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-white border-neutral-250 text-neutral-900'
            }`}
          >
            <option value="All">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Main Split Screen Panel: Left List, Right Detailed Interactive Workcard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Order Ledger List */}
        <div className="lg:col-span-5 space-y-3 max-h-[640px] overflow-y-auto pr-2 scrollbar-thin">
          {filteredOrders.length === 0 ? (
            <div className={`p-8 text-center border rounded-2xl italic ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-850 text-zinc-500' : 'bg-neutral-50/50 border-neutral-150 text-neutral-400'
            }`}>
              No orders found matching parameters.
            </div>
          ) : (
            filteredOrders.map(o => {
              const isActive = o.id === selectedOrderId;
              return (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer block relative overflow-hidden ${
                    isActive 
                      ? 'border-neutral-500 ring-1 ring-neutral-500 ' + (isDarkMode ? 'bg-zinc-850' : 'bg-neutral-50')
                      : isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-neutral-150 hover:border-neutral-350'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div>
                      <span className="font-mono font-bold text-xs">ORDER #{o.id}</span>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-mono font-bold text-sm text-right block">
                      ${o.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2 text-[11px]">
                    <div className="truncate">
                      <p className={`font-semibold truncate ${isDarkMode ? 'text-zinc-200' : 'text-neutral-800'}`}>
                        {o.shippingAddress.fullName}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {o.items.length} item{o.items.length !== 1 ? 's' : ''} • {o.shippingAddress.city}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${getStatusBadgeStyles(o.orderStatus)}`}>
                        {o.orderStatus}
                      </span>
                      <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${getPaymentBadgeStyles(o.paymentStatus)}`}>
                        {o.paymentStatus}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Side: High-Contrast Logistics Interactive Workcard */}
        <div className="lg:col-span-7">
          {!selectedOrder ? (
            <div className={`p-12 text-center border rounded-3xl ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-neutral-150 text-neutral-400'
            }`}>
              Select an order from the list to manage logistics, view customers, change payments and print invoices.
            </div>
          ) : (
            <div className={`p-5 rounded-3xl border space-y-6 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-150'
            }`}>
              
              {/* Card Title Header with Instant Print Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-neutral-400 uppercase">Fulfillment Workspace</span>
                    <span className={`inline-block border text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${getStatusBadgeStyles(selectedOrder.orderStatus)}`}>
                      {selectedOrder.orderStatus}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight font-sans mt-0.5">Order #{selectedOrder.id}</h3>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Created on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Interactive Invoice Generation suite */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Print Invoice */}
                  <button
                    onClick={() => handlePrintInvoice(selectedOrder)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider border cursor-pointer transition-all ${
                      isDarkMode 
                        ? 'border-zinc-800 bg-zinc-950 hover:bg-zinc-850 text-zinc-300 hover:text-white' 
                        : 'border-neutral-250 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-black'
                    }`}
                    title="Render printer-friendly layout"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Invoice
                  </button>

                  {/* Download PDF/Text Invoice */}
                  <button
                    onClick={() => handleDownloadInvoiceData(selectedOrder)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider bg-black text-white hover:bg-neutral-800 border border-zinc-700 cursor-pointer transition-all"
                    title="Export high-fidelity invoice receipt"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Download Invoice
                  </button>
                </div>
              </div>

              {/* 1. Interactive Pipeline status timeline */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">Fulfillment stage timeline</span>
                
                {/* Horizontal slider timeline */}
                <div className="grid grid-cols-6 gap-1 relative pt-4 pb-2">
                  {statusSteps.map((step, idx) => {
                    const orderIdx = statusSteps.indexOf(selectedOrder.orderStatus as any);
                    const isCompleted = orderIdx >= idx;
                    const isCurrent = selectedOrder.orderStatus === step;

                    return (
                      <button
                        key={step}
                        onClick={() => handleStatusChange(selectedOrder.id, step)}
                        className={`text-center flex flex-col items-center group relative cursor-pointer focus:outline-none`}
                        title={`Click to mark order status as ${step}`}
                      >
                        {/* Connecting line */}
                        {idx < 5 && (
                          <div className={`absolute top-2.5 left-1/2 w-full h-[2px] -z-10 ${
                            orderIdx > idx ? 'bg-neutral-200' : isDarkMode ? 'bg-zinc-800' : 'bg-neutral-100'
                          }`} />
                        )}

                        {/* Visual indicator knot */}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent 
                            ? 'bg-neutral-100 border-black scale-110 shadow' 
                            : isCompleted 
                              ? 'bg-black border-black text-white' 
                              : isDarkMode 
                                ? 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700' 
                                : 'bg-white border-neutral-200 text-neutral-400 hover:border-neutral-300'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          )}
                        </div>

                        {/* Small dynamic text badge */}
                        <span className={`text-[8px] font-mono mt-1.5 font-bold transition-all block text-center truncate w-full max-w-[85px] ${
                          isCurrent 
                            ? isDarkMode ? 'text-white' : 'text-black'
                            : 'text-neutral-400 group-hover:text-neutral-200'
                        }`}>
                          {step}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Fast Cancel Button */}
                {selectedOrder.orderStatus !== 'Cancelled' && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'Cancelled')}
                      className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 font-mono text-[9px] font-bold uppercase cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      Force Cancel Order
                    </button>
                  </div>
                )}
              </div>

              {/* Grid block for: Customer & Payment controllers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Panel A: Customer Profile Details */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-neutral-50/50 border-neutral-150'
                }`}>
                  <div className="flex items-center justify-between border-b border-neutral-100/10 pb-2">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Customer Details</span>
                    <button
                      onClick={() => handleCopyText(`${selectedOrder.shippingAddress.fullName}\n${selectedOrder.shippingAddress.addressLine1}\n${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.state} ${selectedOrder.shippingAddress.zipCode}\nPhone: ${selectedOrder.shippingAddress.phone}`, 'Shipping label')}
                      className="p-1 hover:bg-neutral-500/10 rounded text-neutral-400 hover:text-white transition-all cursor-pointer"
                      title="Copy Address Label"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <h4 className="font-bold">{selectedOrder.shippingAddress.fullName}</h4>
                      <p className="text-[10px] text-neutral-400 mt-0.5">UID: {selectedOrder.userId}</p>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-neutral-400">
                      <a href={`mailto:${selectedOrder.email}`} className="flex items-center gap-1.5 hover:text-white truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedOrder.email}</span>
                      </a>
                      <a href={`tel:${selectedOrder.shippingAddress.phone}`} className="flex items-center gap-1.5 hover:text-white">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedOrder.shippingAddress.phone}</span>
                      </a>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <span>{selectedOrder.shippingAddress.addressLine1}</span>
                          {selectedOrder.shippingAddress.addressLine2 && <span className="block">{selectedOrder.shippingAddress.addressLine2}</span>}
                          <span className="block">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel B: Money & Payment status override */}
                <div className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between ${
                  isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-neutral-50/50 border-neutral-150'
                }`}>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider block border-b border-neutral-100/10 pb-2">
                      Payment Registry
                    </span>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-neutral-400 font-sans">Retail Total:</span>
                      <span className="text-xl font-mono font-black">${selectedOrder.total.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-neutral-400 font-sans">Payment outcome:</span>
                      <span className={`inline-block border text-[8px] font-bold font-mono px-2 py-0.5 rounded uppercase ${getPaymentBadgeStyles(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Interactively change payment status */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[8px] font-mono font-bold uppercase text-neutral-400">Modify Payment:</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => handlePaymentChange(selectedOrder.id, 'paid')}
                        className={`text-[9px] font-bold font-mono py-1 rounded border uppercase cursor-pointer ${
                          selectedOrder.paymentStatus === 'paid'
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850' : 'border-neutral-250 text-neutral-500 hover:text-black hover:bg-neutral-50'
                        }`}
                      >
                        Paid
                      </button>
                      <button
                        onClick={() => handlePaymentChange(selectedOrder.id, 'pending')}
                        className={`text-[9px] font-bold font-mono py-1 rounded border uppercase cursor-pointer ${
                          selectedOrder.paymentStatus === 'pending'
                            ? 'bg-amber-500 text-black border-amber-500'
                            : isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850' : 'border-neutral-250 text-neutral-500 hover:text-black hover:bg-neutral-50'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handlePaymentChange(selectedOrder.id, 'failed')}
                        className={`text-[9px] font-bold font-mono py-1 rounded border uppercase cursor-pointer ${
                          selectedOrder.paymentStatus === 'failed'
                            ? 'bg-rose-500 text-white border-rose-500'
                            : isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850' : 'border-neutral-250 text-neutral-500 hover:text-black hover:bg-neutral-50'
                        }`}
                      >
                        Failed
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* 3. Items breakdown overview */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">Purchased Designs Breakdown</span>
                <div className="space-y-2 border border-neutral-100/5 rounded-2xl p-3">
                  {selectedOrder.items.map((it, index) => (
                    <div key={index} className="flex justify-between items-center gap-3 text-xs border-b border-neutral-100/5 last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={it.image} 
                          alt="" 
                          className="w-8 h-10 object-cover rounded bg-neutral-200 shrink-0" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="truncate">
                          <h4 className="font-semibold truncate text-[11px]">{it.name}</h4>
                          <div className="flex gap-2 text-[9px] text-neutral-400 font-mono uppercase mt-0.5">
                            <span>Size: {it.selectedSize}</span>
                            <span>Color: {it.selectedColor || 'Default'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold block">${(it.price * it.quantity).toFixed(2)}</span>
                        <span className="text-[9px] font-mono text-neutral-400">
                          {it.quantity} x ${it.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
