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
  deleteReview
} from '../services/dbService';
import { Product, Order, Review } from '../types';
import { Loader2, Plus, Trash2, Edit2, Package, ShoppingBag, BarChart3, TrendingUp, CheckCircle, RefreshCw, X, AlertCircle, Eye, EyeOff, ShieldAlert, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export const Admin: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'reviews'>('products');
  const [loading, setLoading] = useState(true);

  // Lightbox Modal for review images
  const [selectedModalImage, setSelectedModalImage] = useState<string | null>(null);

  // Form States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New Product Form Inputs
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Dresses');
  const [newProdPrice, setNewProdPrice] = useState(150);
  const [newProdOrigPrice, setNewProdOrigPrice] = useState(150);
  const [newProdStock, setNewProdStock] = useState(15);
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80');
  const [newProdSizes, setNewProdSizes] = useState<string[]>(['S', 'M', 'L']);
  const [newProdColors, setNewProdColors] = useState<{name: string, hex: string}[]>([
    { name: "Alabaster", hex: "#F2EFE9" },
    { name: "Midnight Black", hex: "#1A1A1A" }
  ]);
  const [newProdIsFeatured, setNewProdIsFeatured] = useState(true);
  const [newProdIsNew, setNewProdIsNew] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);

      const fetchedOrders = await getAllOrders();
      setOrders(fetchedOrders);

      const fetchedReviews = await getAllReviews();
      setReviews(fetchedReviews);
    } catch (err) {
      console.error('Error fetching admin details:', err);
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdDesc.trim() || !newProdImage.trim()) {
      toast.error("Please fill in all core fields.");
      return;
    }

    setSubmitting(true);
    const generatedId = `prod-${Date.now()}`;
    const productPayload: Product = {
      id: generatedId,
      name: newProdName.trim(),
      description: newProdDesc.trim(),
      price: Number(newProdPrice),
      originalPrice: Number(newProdOrigPrice) > Number(newProdPrice) ? Number(newProdOrigPrice) : undefined,
      category: newProdCategory,
      images: [newProdImage.trim()],
      sizes: newProdSizes,
      colors: newProdColors,
      rating: 5.0,
      reviewCount: 0,
      stock: Number(newProdStock),
      isFeatured: newProdIsFeatured,
      isNewArrival: newProdIsNew,
      createdAt: Date.now()
    };

    try {
      await addProduct(productPayload);
      toast.success(`"${newProdName}" added successfully to Firestore!`, { icon: '📦' });
      
      // Reset form
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice(150);
      setNewProdOrigPrice(150);
      setNewProdStock(15);
      setIsAddProductOpen(false);
      
      // Re-fetch
      await fetchAdminData();
    } catch (err) {
      toast.error("Failed to append product to Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from Firestore?`)) return;
    try {
      await deleteProduct(id);
      toast.success(`Removed "${name}" from e-store registry.`);
      await fetchAdminData();
    } catch (err) {
      toast.error("Failed to delete from Firestore.");
    }
  };

  const handleUpdateStock = async (id: string, currentStock: number, change: number) => {
    const updatedStock = Math.max(0, currentStock + change);
    try {
      await updateProduct(id, { stock: updatedStock });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: updatedStock } : p))
      );
      toast.success("Stock level updated", { id: "stock-success", duration: 1000 });
    } catch (err) {
      toast.error("Failed to update stock in Firestore.");
    }
  };

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

  const handleApproveReview = async (reviewId: string) => {
    try {
      await approveReview(reviewId);
      toast.success("Review approved successfully! Product aggregate metrics updated.", { icon: '⭐️' });
      // Refresh registry
      const updatedReviews = await getAllReviews();
      setReviews(updatedReviews);
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve review.");
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete/reject this review?")) return;
    try {
      await deleteReview(reviewId);
      toast.success("Review deleted and removed from e-store.");
      // Refresh registry
      const updatedReviews = await getAllReviews();
      setReviews(updatedReviews);
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject and delete review.");
    }
  };

  // Aggregated analytics metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const totalItemsSold = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.items.reduce((acc, it) => acc + it.quantity, 0), 0);

  if (authLoading || loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        <p className="text-xs text-gray-400 font-mono">Synchronizing admin dashboard with Firestore logs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      
      {/* Top title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold tracking-widest text-red-600 font-mono uppercase">
            ESTORE SECURE BACKOFFICE
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 font-sans">
            Admin Control Panel
          </h1>
        </div>

        <button
          onClick={() => setIsAddProductOpen(true)}
          className="inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white font-semibold px-4 py-3 rounded-xl text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Product
        </button>
      </div>

      {/* 1. Metric Bento Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Rev Metric */}
        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-700 rounded-full flex items-center justify-center border border-green-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase font-mono">Store Revenue</p>
            <h3 className="text-xl font-bold text-gray-900 font-mono">${totalRevenue.toFixed(2)}</h3>
          </div>
        </div>

        {/* Orders metric */}
        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center border border-blue-100">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase font-mono">Total Orders</p>
            <h3 className="text-xl font-bold text-gray-900 font-mono">{orders.length} orders</h3>
          </div>
        </div>

        {/* Products catalog count */}
        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center border border-purple-100">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase font-mono">Catalog Count</p>
            <h3 className="text-xl font-bold text-gray-900 font-mono">{products.length} designs</h3>
          </div>
        </div>

        {/* Items Sold */}
        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-50 text-yellow-700 rounded-full flex items-center justify-center border border-yellow-100">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase font-mono">Total Items Sold</p>
            <h3 className="text-xl font-bold text-gray-900 font-mono">{totalItemsSold} items</h3>
          </div>
        </div>

      </div>

      {/* 2. Tab Navigation bar */}
      <div className="flex border-b border-gray-150 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-black text-black'
              : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          Product Registry ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-black text-black'
              : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          Customer Logistics ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'border-black text-black'
              : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          Reviews Moderation ({reviews.length})
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="space-y-6">
        {activeTab === 'products' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-50 pb-2">
              PRODUCT REGISTRY ({products.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-500 font-sans divide-y divide-gray-150">
                <thead className="bg-gray-50 text-gray-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">Piece</th>
                    <th scope="col" className="px-3 py-2.5">Category</th>
                    <th scope="col" className="px-3 py-2.5">Price</th>
                    <th scope="col" className="px-3 py-2.5">Rating</th>
                    <th scope="col" className="px-3 py-2.5">Stock Controls</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                        <div className="flex items-center gap-2">
                          <img src={p.images[0]} alt="" className="w-7 h-9 object-cover rounded bg-gray-150" referrerPolicy="no-referrer" />
                          <span className="truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold uppercase font-mono text-[10px] text-gray-400">{p.category}</td>
                      <td className="px-3 py-3 font-semibold text-gray-900 font-mono">${p.price}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 text-amber-500 font-mono font-bold">
                          <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                          {p.rating} <span className="text-gray-400 font-normal">({p.reviewCount})</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStock(p.id, p.stock, -1)}
                            className="p-1 px-2 border rounded-md hover:bg-gray-50 text-gray-400 hover:text-black font-semibold cursor-pointer"
                          >
                            -
                          </button>
                          <span className={`font-semibold min-w-[20px] text-center font-mono text-xs ${p.stock === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                            {p.stock}
                          </span>
                          <button
                            onClick={() => handleUpdateStock(p.id, p.stock, 1)}
                            className="p-1 px-2 border rounded-md hover:bg-gray-50 text-gray-400 hover:text-black font-semibold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-50 pb-2">
              CUSTOMER LOGISTICS ({orders.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-gray-400 italic">No checkout orders registered in system yet.</div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="border border-gray-150 p-5 rounded-2xl space-y-3 text-xs bg-neutral-50/50">
                    <div className="flex justify-between font-mono items-center border-b border-gray-100 pb-2">
                      <span className="font-bold text-gray-400">ID: {o.id}</span>
                      <span className="font-bold text-gray-950 font-mono">${o.total.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 space-y-1">
                      <p>Client: <strong className="text-gray-800 font-sans">{o.shippingAddress.fullName}</strong> ({o.email})</p>
                      <p>Phone: <strong className="text-gray-800">{o.shippingAddress.phone}</strong></p>
                      <div className="pt-1.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase font-mono block mb-1">Purchased Designs</span>
                        <div className="space-y-1">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-gray-600">
                              <span className="truncate max-w-[180px]">• {it.name} ({it.selectedSize})</span>
                              <span className="font-mono">Qty: {it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Order Status Select Controls */}
                    <div className="pt-2 border-t border-gray-150 flex justify-between items-center gap-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">Logistics Status</span>
                      <select
                        value={o.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                        className="bg-white border border-gray-250 rounded-lg text-[10px] font-bold font-mono uppercase px-2 py-1 outline-none text-gray-750 cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out For Delivery">Out For Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="processing">Processing (Legacy)</option>
                        <option value="shipped">Shipped (Legacy)</option>
                        <option value="delivered">Delivered (Legacy)</option>
                        <option value="cancelled">Cancelled (Legacy)</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase font-mono tracking-wider">
                  REVIEWS MODERATOR QUEUE ({reviews.length})
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Approve pending reviews to publish them publicly and include them in the average rating metrics, or reject/delete inappropriate ones.
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-bold font-mono text-[10px] uppercase">
                  {reviews.filter(r => !r.approved).length} Pending Moderation
                </span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-12 text-center bg-neutral-50 rounded-2xl">No customer reviews submitted yet.</p>
            ) : (
              <div className="space-y-6 divide-y divide-gray-100">
                {reviews.map((rev, idx) => {
                  const linkedProduct = products.find(p => p.id === rev.productId);
                  return (
                    <div key={rev.id} className={`space-y-3 ${idx > 0 ? 'pt-6' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{rev.userName}</span>
                            {rev.isVerifiedPurchase && (
                              <span className="bg-emerald-50 text-emerald-850 border border-emerald-150 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-full">
                                Verified Purchase
                              </span>
                            )}
                            {rev.approved ? (
                              <span className="bg-green-50 text-green-800 border border-green-150 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-full">
                                Approved
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-800 border border-amber-150 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-full">
                                Pending Approval
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 font-mono">
                            Review ID: {rev.id} | Product: <span className="text-black font-semibold">{linkedProduct?.name || rev.productId}</span>
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(rev.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current text-amber-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>

                      {/* Comment */}
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-sans bg-neutral-50 p-3 rounded-xl border border-neutral-100 whitespace-pre-line">
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
                              className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 hover:border-black hover:shadow-sm transition-all cursor-zoom-in flex-shrink-0"
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
                            className="bg-black hover:bg-neutral-800 text-white font-mono text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve & Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleRejectReview(rev.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-mono text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
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
      </div>

      {/* Lightbox Fullscreen Modal for admin review images view */}
      {selectedModalImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedModalImage(null)}>
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

      {/* 3. Sliding Product Creation Overlay Modals */}
      {isAddProductOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={() => setIsAddProductOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 w-full sm:max-w-lg bg-white shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-right duration-350">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-400 uppercase font-mono">CREATE CATALOGUE PRODUCT</span>
              <button onClick={() => setIsAddProductOpen(false)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="Linen Cowl Maxi Dress"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Editorial Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Draped using fine Biological Flax Linen, bias cut seams..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase font-mono">Collection Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-black text-sm"
                  >
                    <option value="Dresses">Dresses</option>
                    <option value="Tops">Tops</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Activewear">Activewear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase font-mono">Archive Stock Level</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase font-mono">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-400 uppercase font-mono">Original Price (For Sale, $)</label>
                  <input
                    type="number"
                    required
                    value={newProdOrigPrice}
                    onChange={(e) => setNewProdOrigPrice(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-400 uppercase font-mono">Image Asset Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-mono"
                />
              </div>

              {/* Flags checks */}
              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdIsFeatured}
                    onChange={(e) => setNewProdIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black accent-black"
                  />
                  <span>Featured Piece</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdIsNew}
                    onChange={(e) => setNewProdIsNew(e.target.checked)}
                    className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black accent-black"
                  />
                  <span>New Arrival</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold py-4 rounded-xl tracking-widest uppercase flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-4"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'APPEND PRODUCT'}
              </button>

            </form>
          </div>
        </>
      )}

    </div>
  );
};
