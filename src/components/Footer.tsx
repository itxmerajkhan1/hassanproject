/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { addNewsletterSubscriber } from '../services/dbService';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsSubmitting(true);
      await addNewsletterSubscriber(email.trim());
      toast.success("Welcome to MK Private Circle! You have successfully subscribed to luxury updates.", {
        icon: '✨',
        style: {
          borderRadius: '12px',
          background: '#1A1A1A',
          color: '#fff',
        }
      });
      setEmail('');
    } catch (err) {
      console.error(err);
      toast.error("Could not complete subscription. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#0A0A0A] text-[#E5E5E5] border-t border-neutral-900 pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-950">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <span className="text-xl font-bold tracking-widest text-white">
                MK <span className="font-light text-neutral-400">FASHION</span>
              </span>
            </Link>
            <p className="text-xs text-[#E5E7EB] max-w-sm leading-relaxed">
              We define modern fashion through a meticulous lens of minimalism, premium tailoring, and luxurious fabrics. Guided by sustainable practices, we bring you seasonal wardrobe staples of exceptional quality.
            </p>
            <div className="flex items-center space-x-2 text-xs text-[#D1D5DB] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500/80" />
              <span>Apple-inspired luxury aesthetic</span>
            </div>
            {/* Social Media Links */}
            <div className="pt-2 flex items-center space-x-3">
              {/* Social links stay same */}
              {/* Instagram */}
              <a
                href="https://instagram.com/mkfashion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-neutral-800 flex items-center justify-center text-[#D1D5DB] hover:text-white hover:border-neutral-500 transition-all cursor-pointer"
                title="Follow MK on Instagram"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://facebook.com/mkfashion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-neutral-800 flex items-center justify-center text-[#D1D5DB] hover:text-white hover:border-neutral-500 transition-all cursor-pointer"
                title="Follow MK on Facebook"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a
                href="https://tiktok.com/@mkfashion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-neutral-800 flex items-center justify-center text-[#D1D5DB] hover:text-white hover:border-neutral-500 transition-all cursor-pointer"
                title="Follow MK on TikTok"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.14 1.05 1.15 2.52 1.83 4.04 1.95v3.83a9.23 9.23 0 01-5.63-2.02v8.52a8.6 8.6 0 01-1.63 5.06c-1.67 2.22-4.52 3.53-7.25 3.14-3.13-.44-5.83-2.94-6.38-6.04-.69-3.9 1.8-7.79 5.74-8.49 1.07-.19 2.17-.08 3.21.28v3.96c-.95-.31-2-.32-2.94-.04-1.68.51-2.85 2.19-2.67 3.94.19 1.8 1.75 3.16 3.54 2.94 1.66-.21 2.91-1.68 2.81-3.34.02-3.87.01-7.74.02-11.61.01-.08.01-.15.01-.28z"/>
                </svg>
              </a>
              {/* Pinterest */}
              <a
                href="https://pinterest.com/mkfashion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-neutral-800 flex items-center justify-center text-[#D1D5DB] hover:text-white hover:border-neutral-500 transition-all cursor-pointer"
                title="Follow MK on Pinterest"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.41 7.61 11.162-.102-.947-.195-2.4-.04-3.434.14-.93.905-3.897.905-3.897s-.23-.46-.23-1.142c0-1.072.622-1.872 1.397-1.872.66 0 .98.495.98 1.088 0 .662-.42 1.652-.638 2.57-.18.765.34 1.387 1.096 1.387 1.314 0 2.324-1.383 2.324-3.38 0-1.767-1.272-3.003-3.08-3.003-2.1 0-3.332 1.575-3.332 3.203 0 .634.244 1.314.548 1.685.06.073.069.137.05.21-.056.23-.18.73-.205.83-.033.14-.11.17-.25.105-1.127-.525-1.83-2.18-1.83-3.51 0-2.86 2.08-5.485 5.99-5.485 3.144 0 5.586 2.24 5.586 5.232 0 3.12-1.964 5.632-4.694 5.632-1.19 0-2.31-.62-2.69-1.347l-.736 2.8c-.267 1.026-1 2.315-1.492 3.114 1.12.345 2.312.535 3.55.535 6.622 0 11.988-5.368 11.988-11.988C24.005 5.368 18.64 0 12.017 0z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase mb-4">Customer Care</h4>
            <ul className="space-y-2 text-xs text-[#D1D5DB]">
              <li><Link to="/track" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact-us" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/return-policy" className="hover:text-white transition-colors">Return Policy</Link></li>
              <li><Link to="/exchange-policy" className="hover:text-white transition-colors">Exchange Policy</Link></li>
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase mb-4">Collections</h4>
            <ul className="space-y-2 text-xs text-[#D1D5DB]">
              <li><Link to="/shop?category=Dresses" className="hover:text-white transition-colors">Satin Slip Dresses</Link></li>
              <li><Link to="/shop?category=Outerwear" className="hover:text-white transition-colors">Cashmere Coats</Link></li>
              <li><Link to="/shop?category=Tops" className="hover:text-white transition-colors">Ribbed Merino Knits</Link></li>
              <li><Link to="/shop?category=Accessories" className="hover:text-white transition-colors">Italian Leather Accessories</Link></li>
            </ul>
          </div>

          {/* Newsletter Sign Up */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase mb-4">MK Private Circle</h4>
            <p className="text-xs text-[#E5E7EB] mb-3 leading-relaxed">
              Join our mailing list for priority access to seasonal lookbooks and private sales.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                required
                disabled={isSubmitting}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg py-2 text-xs tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'JOINING...' : 'JOIN THE CLUB'}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#D1D5DB] font-mono">
          <p>© {new Date().getFullYear()} MK Fashion Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
