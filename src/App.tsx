/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Components
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetails } from './pages/ProductDetails';
import { Profile } from './pages/Profile';
import { Checkout } from './pages/Checkout';
import { Admin } from './pages/Admin';
import { OrderTracking } from './pages/OrderTracking';

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
      <AuthProvider>
        <CartProvider>
          {/* Automatic scroll to top helper */}
          <ScrollToTop />
          
          <div className="min-h-screen bg-white text-black flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
            
            {/* Nav Header */}
            <Header onCartToggle={() => setIsCartOpen(true)} />

            {/* Sliding Cart Drawer Panel */}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            {/* Main Pages Content Frame */}
            <main className="flex-grow animate-in fade-in duration-500">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/track" element={<OrderTracking />} />
                <Route path="/track/:orderId" element={<OrderTracking />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>

            {/* Premium Footer */}
            <Footer />

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
    </BrowserRouter>
  );
}
