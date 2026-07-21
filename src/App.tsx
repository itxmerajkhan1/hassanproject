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
