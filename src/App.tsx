/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { hasCredentials, missingCredentials } from './firebase';
import { Database, Key, ShieldAlert, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

// Components
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { AtelierConcierge } from './components/AtelierConcierge';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const ProductDetails = lazy(() => import('./pages/ProductDetails').then(m => ({ default: m.ProductDetails })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const OrderTracking = lazy(() => import('./pages/OrderTracking').then(m => ({ default: m.OrderTracking })));
const Policies = lazy(() => import('./pages/Policies').then(m => ({ default: m.Policies })));

const LuxuryLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">Atelier Loading...</span>
    </div>
  </div>
);

// Helper to scroll to viewport top upon navigation triggers
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [pathname]);

  return null;
};

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  if (!hasCredentials) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-[#0A0A0A] dark:text-[#E5E5E5] flex flex-col justify-center items-center p-4 transition-colors duration-300 font-sans">
          <div className="max-w-2xl w-full bg-white dark:bg-neutral-900/45 border border-neutral-100 dark:border-neutral-850 p-8 sm:p-12 rounded-3xl shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
            {/* Header Section */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-2xl mb-2">
                <Database className="w-8 h-8 animate-pulse text-amber-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-sans text-neutral-950 dark:text-white">
                Firebase Database Setup Required
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                To establish a secure Admin Authentication system, persistent Firestore collections, and media Storage, please configure your new Firebase project.
              </p>
            </div>

            {/* Missing Variables List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-400">Environment Key</span>
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-400">Status</span>
              </div>
              
              <div className="divide-y divide-neutral-50 dark:divide-neutral-800/40 font-mono text-xs">
                {[
                  { name: 'VITE_FIREBASE_API_KEY', desc: 'API Key' },
                  { name: 'VITE_FIREBASE_AUTH_DOMAIN', desc: 'Auth Domain' },
                  { name: 'VITE_FIREBASE_PROJECT_ID', desc: 'Project ID' },
                  { name: 'VITE_FIREBASE_STORAGE_BUCKET', desc: 'Storage Bucket' },
                  { name: 'VITE_FIREBASE_MESSAGING_SENDER_ID', desc: 'Messaging Sender ID' },
                  { name: 'VITE_FIREBASE_APP_ID', desc: 'App ID' }
                ].map((item) => {
                  const isMissing = missingCredentials.includes(item.name);
                  return (
                    <div key={item.name} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Key className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] text-neutral-400 italic hidden sm:inline">{item.desc}</span>
                        {isMissing ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-150 dark:border-amber-900/30">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            MISSING
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            CONFIGURED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actionable Copy/Configure Guide */}
            <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-150/40 dark:border-neutral-800/40 rounded-2xl p-5 space-y-3">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Required Actions
              </h2>
              <ol className="list-decimal list-inside text-xs text-neutral-500 dark:text-neutral-400 space-y-2 leading-relaxed">
                <li>Create or open your Firebase Project.</li>
                <li>Go to Project Settings, add a Web App, and copy the config credentials.</li>
                <li>Provide the environment variables listed above in the workspace secrets or `.env` file.</li>
              </ol>
            </div>

            <div className="text-center pt-2">
              <p className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                AWAITING CUSTOMER CREDENTIALS. PLEASE PROVIDE THE CONFIGURATION TO PROCEED.
              </p>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            {/* Automatic scroll to top helper */}
            <ScrollToTop />
            
            <div className="min-h-screen bg-white text-black dark:bg-[#0A0A0A] dark:text-[#E5E5E5] flex flex-col justify-between selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
              
              {/* Nav Header */}
              <Header onCartToggle={() => setIsCartOpen(true)} />

              {/* Sliding Cart Drawer Panel */}
              <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

              {/* Main Pages Content Frame */}
              <main className="flex-grow animate-in fade-in duration-500">
                <Suspense fallback={<LuxuryLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/admin/products" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/admin/orders" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/admin/customers" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/admin/analytics" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/track" element={<OrderTracking />} />
                    <Route path="/track/:orderId" element={<OrderTracking />} />
                    <Route path="/policies" element={<Policies />} />
                    <Route path="/about-us" element={<Policies />} />
                    <Route path="/about" element={<Policies />} />
                    <Route path="/contact-us" element={<Policies />} />
                    <Route path="/contact" element={<Policies />} />
                    <Route path="/faq" element={<Policies />} />
                    <Route path="/return-policy" element={<Policies />} />
                    <Route path="/returns" element={<Policies />} />
                    <Route path="/exchange-policy" element={<Policies />} />
                    <Route path="/exchanges" element={<Policies />} />
                    <Route path="/shipping-policy" element={<Policies />} />
                    <Route path="/shipping" element={<Policies />} />
                    <Route path="/privacy-policy" element={<Policies />} />
                    <Route path="/privacy" element={<Policies />} />
                    <Route path="/terms-conditions" element={<Policies />} />
                    <Route path="/terms" element={<Policies />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </Suspense>
              </main>

              {/* Premium Footer */}
              <Footer />

              {/* Floating Concierge & Back to Top Widget */}
              <AtelierConcierge />

              {/* Rich notifications layer */}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  className: 'font-sans text-xs font-semibold',
                  duration: 4000,
                  style: {
                    background: '#FFFFFF',
                    color: '#1A1A1A',
                    border: '1px solid #F1F1F1',
                    borderRadius: '14px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
                  }
                }}
              />
            </div>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
