/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success("Welcome to MK Private Circle! You have successfully subscribed to luxury updates.", {
        icon: '✨',
        style: {
          borderRadius: '12px',
          background: '#1A1A1A',
          color: '#fff',
        }
      });
      setEmail('');
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
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              We define modern fashion through a meticulous lens of minimalism, premium tailoring, and luxurious fabrics. Guided by sustainable practices, we bring you seasonal wardrobe staples of exceptional quality.
            </p>
            <div className="flex items-center space-x-2 text-xs text-neutral-500 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500/80" />
              <span>Apple-inspired luxury aesthetic</span>
            </div>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase mb-4">Customer Care</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><Link to="/profile" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Premium Fitting Services</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Exchanges & Easy Returns</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Custom Tailoring Inquiry</a></li>
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase mb-4">Collections</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><Link to="/shop?category=Dresses" className="hover:text-white transition-colors">Satin Slip Dresses</Link></li>
              <li><Link to="/shop?category=Outerwear" className="hover:text-white transition-colors">Cashmere Coats</Link></li>
              <li><Link to="/shop?category=Tops" className="hover:text-white transition-colors">Ribbed Merino Knits</Link></li>
              <li><Link to="/shop?category=Accessories" className="hover:text-white transition-colors">Italian Leather Accessories</Link></li>
            </ul>
          </div>

          {/* Newsletter Sign Up */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase mb-4">MK Private Circle</h4>
            <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
              Join our mailing list for priority access to seasonal lookbooks and private sales.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              />
              <button
                type="submit"
                className="w-full bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg py-2 text-xs tracking-wider transition-all"
              >
                JOIN THE CLUB
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 font-mono">
          <p>© {new Date().getFullYear()} MK Fashion Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-neutral-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neutral-300 transition-colors">Sitemap</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
