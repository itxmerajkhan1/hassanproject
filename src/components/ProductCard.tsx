/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Eye } from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user, wishlist, toggleWishlistItem } = useAuth();
  const navigate = useNavigate();
  const [isWishlisting, setIsWishlisting] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isFavorited = wishlist.includes(product.id);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to save items to your wishlist.", {
        id: "wishlist-error",
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });
      navigate('/profile');
      return;
    }

    setIsWishlisting(true);
    try {
      await toggleWishlistItem(product.id);
      if (isFavorited) {
        toast.success(`Removed "${product.name}" from your wishlist.`, {
          icon: '🤍',
          style: { borderRadius: '12px' }
        });
      } else {
        toast.success(`Saved "${product.name}" to your wishlist.`, {
          icon: '❤️',
          style: { borderRadius: '12px' }
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update wishlist.");
    } finally {
      setIsWishlisting(false);
    }
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isOutOfStock = product.stock <= 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group relative flex flex-col bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm border border-gray-100/40 dark:border-zinc-800/40 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      id={`product-card-${product.id}`}
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[3/4] w-full bg-gray-50 dark:bg-zinc-950 overflow-hidden">
        
        {/* Dynamic Multi-Image Gallery Hover */}
        <img
          src={hovered && product.images[1] ? product.images[1] : product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Wishlist Button Overlay */}
        <button
          onClick={handleWishlistClick}
          disabled={isWishlisting}
          className={`absolute top-4 right-4 p-2.5 rounded-full border border-gray-100/50 dark:border-zinc-800/50 backdrop-blur-md transition-all shadow-sm ${
            isFavorited
              ? 'bg-red-50 dark:bg-red-950/50 text-red-500 border-red-100 dark:border-red-900/50'
              : 'bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-900 text-gray-400 dark:text-neutral-400 hover:text-black dark:hover:text-white'
          }`}
          title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''} ${isWishlisting ? 'animate-pulse' : ''}`} />
        </button>

        {/* Sale / New Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
          {product.isNewArrival && (
            <span className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
              New
            </span>
          )}
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
              Sale
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-neutral-800 text-neutral-300 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
              Sold Out
            </span>
          )}
        </div>

        {/* Hover Action Sheet */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300 text-[#111111] dark:text-white">
            <Eye className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Meta Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#D1D5DB] tracking-wider uppercase font-mono">
            {product.category}
          </span>
          <h3 className="text-sm font-medium text-[#111111] dark:text-white group-hover:text-[#111111] dark:group-hover:text-white leading-tight transition-colors line-clamp-1">
            {product.name}
          </h3>
          
          {/* Reviews Rating summary */}
          <div className="flex items-center space-x-1.5 pt-0.5">
            <div className="flex items-center text-yellow-400">
              <Star className="w-3 h-3 fill-current" />
            </div>
            <span className="text-xs font-semibold text-[#374151] dark:text-[#E5E7EB] font-sans">{product.rating}</span>
            <span className="text-xs text-[#6B7280] dark:text-[#D1D5DB] font-sans">({product.reviewCount})</span>
          </div>
        </div>

        {/* Price Tag */}
        <div className="flex items-baseline space-x-2 mt-3 pt-2 border-t border-gray-50 dark:border-zinc-800/50">
          <span className="text-sm font-bold text-[#111111] dark:text-white">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-xs text-[#6B7280] dark:text-[#D1D5DB] line-through font-medium">
              ${product.originalPrice?.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
