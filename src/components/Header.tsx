/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, User, Search, Menu, X, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { sanitizeString } from '../utils/security';

interface HeaderProps {
  onCartToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCartToggle }) => {
  const { user, profile, signOut, wishlist, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedQuery = sanitizeString(searchQuery);
    if (sanitizedQuery) {
      navigate(`/shop?search=${encodeURIComponent(sanitizedQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-[#0A0A0A]/70 border-b border-gray-100/50 dark:border-neutral-900/50 transition-colors duration-300 text-black dark:text-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Mobile Menu Icon */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-gray-700 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            id="mobile-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1" id="logo-link">
            <span className="font-sans text-xl sm:text-2xl font-semibold tracking-wider text-[#111111] dark:text-white">
              MK <span className="font-light text-[#6B7280] dark:text-[#D1D5DB]">FASHION</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="font-sans text-sm font-medium tracking-wide text-[#374151] dark:text-[#E5E7EB] hover:text-[#111111] dark:hover:text-white hover:border-b hover:border-black/50 dark:hover:border-white/50 pb-1 transition-colors">
              HOME
            </Link>
            <Link to="/shop" className="font-sans text-sm font-medium tracking-wide text-[#374151] dark:text-[#E5E7EB] hover:text-[#111111] dark:hover:text-white hover:border-b hover:border-black/50 dark:hover:border-white/50 pb-1 transition-colors">
              COLLECTIONS
            </Link>
            <Link to="/shop?category=Dresses" className="font-sans text-sm font-medium tracking-wide text-[#374151] dark:text-[#E5E7EB] hover:text-[#111111] dark:hover:text-white hover:border-b hover:border-black/50 dark:hover:border-white/50 pb-1 transition-colors">
              DRESSES
            </Link>
            <Link to="/shop?category=Outerwear" className="font-sans text-sm font-medium tracking-wide text-[#374151] dark:text-[#E5E7EB] hover:text-[#111111] dark:hover:text-white hover:border-b hover:border-black/50 dark:hover:border-white/50 pb-1 transition-colors">
              OUTERWEAR
            </Link>
            <Link to="/track" className="font-sans text-sm font-medium tracking-wide text-emerald-750 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:border-b hover:border-emerald-700 pb-1 transition-colors font-mono">
              TRACK ORDER
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-700 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-900 rounded-full transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              id="theme-toggle-btn"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              )}
            </button>

            {/* Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-700 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-900 rounded-full transition-all cursor-pointer"
              title="Search Products"
              id="search-toggle-btn"
            >
              <Search className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            </button>

            {/* Wishlist Link */}
            <Link
              to="/profile?tab=wishlist"
              className="p-2 text-gray-700 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-900 rounded-full transition-all relative hidden sm:inline-flex"
              title="Wishlist"
              id="wishlist-link"
            >
              <Heart className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full scale-90">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* User Profile / Login Dropdown */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="p-2 text-gray-700 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-900 rounded-full flex items-center space-x-1 transition-all cursor-pointer"
                    id="profile-dropdown-btn"
                  >
                    <User className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                    <span className="hidden lg:inline text-xs font-medium text-[#6B7280] dark:text-[#D1D5DB] max-w-[80px] truncate">
                      {profile?.displayName?.split(' ')[0] || 'Profile'}
                    </span>
                  </button>
                  
                  {isProfileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-neutral-900/95 backdrop-blur-md border border-gray-100 dark:border-neutral-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-250">
                        <div className="px-4 py-2 border-b border-gray-50 dark:border-neutral-800">
                          <p className="text-xs font-bold text-[#6B7280] dark:text-[#D1D5DB]">LOGGED IN AS</p>
                          <p className="text-sm font-semibold text-[#111111] dark:text-white truncate">{profile?.displayName || user.email}</p>
                        </div>
                        {isAdmin && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-[#374151] dark:text-[#E5E7EB] hover:bg-gray-50 dark:hover:bg-neutral-800/50 font-medium"
                          >
                            <Settings className="w-4 h-4 mr-2" /> Admin Panel
                          </Link>
                        )}
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-[#374151] dark:text-[#E5E7EB] hover:bg-gray-50 dark:hover:bg-neutral-800/50 font-medium"
                        >
                          <User className="w-4 h-4 mr-2" /> Account Details
                        </Link>
                        <Link
                          to="/profile?tab=orders"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-[#374151] dark:text-[#E5E7EB] hover:bg-gray-50 dark:hover:bg-neutral-800/50 font-medium"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" /> Order History
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            signOut();
                          }}
                          className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 font-medium border-t border-gray-50 dark:border-neutral-800"
                        >
                          <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/profile"
                  className="p-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-full flex items-center transition-all"
                  title="Sign In"
                  id="signin-btn"
                >
                  <User className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                </Link>
              )}
            </div>

            {/* Shopping Cart Toggle */}
            <button
              onClick={onCartToggle}
              className="p-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-full transition-all relative"
              title="Open Shopping Bag"
              id="cart-toggle-btn"
            >
              <ShoppingBag className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-black text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Sliding Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-gray-100 dark:border-neutral-900 z-50 shadow-lg px-4 py-6"
          >
            <div className="max-w-3xl mx-auto flex items-center gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center border-b border-black dark:border-white py-2">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search collections, linen dresses, cashmere..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-lg text-black dark:text-white outline-none placeholder:text-gray-400 font-sans font-light"
                  autoFocus
                />
              </form>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />
            {/* Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-neutral-950 shadow-2xl z-50 p-6 flex flex-col justify-between md:hidden border-r border-neutral-100 dark:border-neutral-900"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-neutral-900">
                  <span className="font-sans text-xl font-semibold tracking-wider text-black dark:text-white">
                    MK <span className="font-light text-gray-500 dark:text-neutral-400">FASHION</span>
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-black rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <nav className="flex flex-col space-y-1 mt-8">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-sans text-lg font-medium text-gray-800 hover:text-black dark:text-neutral-200 dark:hover:text-white py-3 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center min-h-[44px]"
                  >
                    HOME
                  </Link>
                  <Link
                    to="/shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-sans text-lg font-medium text-gray-800 hover:text-black dark:text-neutral-200 dark:hover:text-white py-3 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center min-h-[44px]"
                  >
                    ALL COLLECTIONS
                  </Link>
                  <Link
                    to="/shop?category=Dresses"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-sans text-lg font-medium text-gray-800 hover:text-black dark:text-neutral-200 dark:hover:text-white py-3 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center min-h-[44px]"
                  >
                    DRESSES
                  </Link>
                  <Link
                    to="/shop?category=Outerwear"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-sans text-lg font-medium text-gray-800 hover:text-black dark:text-neutral-200 dark:hover:text-white py-3 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center min-h-[44px]"
                  >
                    OUTERWEAR
                  </Link>
                  <Link
                    to="/track"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-sans text-lg font-medium text-emerald-700 hover:text-emerald-950 dark:text-emerald-450 dark:hover:text-emerald-300 font-mono py-3 px-2 rounded-xl hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-colors flex items-center min-h-[44px]"
                  >
                    TRACK ORDER LIVE
                  </Link>
                  <Link
                    to="/shop?category=Tops"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-sans text-lg font-medium text-gray-800 hover:text-black dark:text-neutral-200 dark:hover:text-white py-3 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center min-h-[44px]"
                  >
                    TOPS & KNITS
                  </Link>
                  <Link
                    to="/shop?category=Accessories"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-sans text-lg font-medium text-gray-800 hover:text-black dark:text-neutral-200 dark:hover:text-white py-3 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center min-h-[44px]"
                  >
                    ACCESSORIES
                  </Link>
                </nav>
              </div>

              <div className="border-t border-gray-100 pt-6">
                {user ? (
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700">
                        {profile?.displayName?.charAt(0) || user.email?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{profile?.displayName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-medium text-gray-600 hover:text-black py-1"
                    >
                      Account Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 py-1"
                      >
                        Admin Control Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
                      className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 pt-2 border-t border-gray-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white font-medium py-3 rounded-xl tracking-wide transition-all"
                  >
                    SIGN IN / REGISTER
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
