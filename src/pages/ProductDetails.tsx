/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Heart, ShoppingBag, ArrowLeft, RefreshCw, Sparkles, Check, Truck, ShieldAlert, Share2 } from 'lucide-react';
import { getProduct, getProducts, incrementProductViews, subscribeProduct, subscribeProducts } from '../services/dbService';
import { Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ReviewSection } from '../components/ReviewSection';
import { ProductCard } from '../components/ProductCard';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, wishlist, toggleWishlistItem } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);

  useSEO({
    title: product ? `${product.name} | Luxury Apparel` : 'Atelier Design',
    description: product ? `${product.description.slice(0, 150)}... Buy premium couture pieces at MK Fashion Atelier.` : 'View premium unstitched embroidered chiffon pieces, formal wear, and handmade leather items.'
  });

  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  
  // Custom choice selections
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'care'>('details');

  // Zoom on Hover states
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ transformOrigin: 'center' });
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)'
    });
  };

  const handleShare = () => {
    if (!product) return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: url,
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Product link copied to clipboard!', {
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Increment views once when ID changes
    incrementProductViews(id).catch(console.error);

    // Subscribe to product in real-time
    const unsubscribeProduct = subscribeProduct(
      id,
      (fetchedProduct) => {
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          setActiveImage((prev) => prev || fetchedProduct.images[0]);
          setSelectedSize((prev) => prev || fetchedProduct.sizes[0] || '');
          setSelectedColor((prev) => prev || fetchedProduct.colors[0] || null);

          // Fetch recommendations
          getProducts().then((all) => {
            const categoryMatches = all
              .filter((p) => p.category === fetchedProduct.category && p.id !== fetchedProduct.id)
              .slice(0, 4);
            setRecommended(categoryMatches);
          }).catch(console.error);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error with real-time product subscription:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeProduct();
    };
  }, [id]);

  const handleWishlistToggle = async () => {
    if (!product) return;
    if (!user) {
      toast.error('Please sign in to wishlist this item.', {
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });
      navigate('/profile');
      return;
    }

    try {
      await toggleWishlistItem(product.id);
      const isFav = wishlist.includes(product.id);
      if (isFav) {
        toast.success(`Removed "${product.name}" from your wishlist.`, { icon: '🤍' });
      } else {
        toast.success(`Saved "${product.name}" to your wishlist.`, { icon: '❤️' });
      }
    } catch (error: any) {
      toast.error(error.message || "Wishlist error.");
    }
  };

  const handleAddToBag = () => {
    if (!product || !selectedColor) return;
    
    if (product.stock <= 0) {
      toast.error("This product is sold out.");
      return;
    }

    addToCart(product, quantity, selectedSize, selectedColor);
    
    toast.success(
      <div className="flex flex-col gap-1 text-left">
        <span className="font-semibold text-xs">Added to Shopping Bag</span>
        <span className="text-[11px] text-gray-500 font-medium">
          {product.name} ({selectedSize} / {selectedColor.name})
        </span>
      </div>,
      {
        icon: '🛍️',
        style: {
          borderRadius: '16px',
          padding: '12px 16px',
          background: '#FFFFFF',
          color: '#111111',
          border: '1px solid #EAEAEA',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-gray-300" />
        <p className="text-xs text-gray-400 font-mono tracking-wider uppercase">Loading garment specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">Garment Specification Not Found</h2>
        <p className="text-xs text-gray-400">
          The requested fashion piece code is not loaded in our collections registry.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-3.5 rounded-xl uppercase tracking-wider transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO COLLECTIONS
        </Link>
      </div>
    );
  }

  const isFavorited = wishlist.includes(product.id);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      
      {/* Breadcrumb Path & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-mono">
          <Link to="/" className="hover:text-black">HOME</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/shop" className="hover:text-black">COLLECTIONS</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium truncate max-w-[120px] sm:max-w-xs">{product.name.toUpperCase()}</span>
        </div>
        <Link
          to="/shop"
          className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </Link>
      </div>

      {/* Product Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        
        {/* Left Side: Images presentation (5 Columns) */}
        <div className="lg:col-span-6 flex flex-col md:flex-row-reverse gap-4">
          
          {/* Main Visual Screen with Zoom on Hover */}
          <div 
            className="flex-1 aspect-[3/4] bg-gray-50/50 border border-gray-100 rounded-2xl overflow-hidden relative shadow-sm cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => {
              setIsZoomed(false);
              setZoomStyle({ transformOrigin: 'center', transform: 'scale(1)' });
            }}
          >
            <img
              src={activeImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              style={isZoomed ? zoomStyle : {}}
              className="w-full h-full object-cover transition-transform duration-100 ease-out"
            />
            {product.isNewArrival && (
              <span className="absolute top-4 left-4 bg-black text-white text-[10px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-widest font-mono">
                New Arrival
              </span>
            )}
          </div>

          {/* Secondary Thumbnail Rib (Vertical/Horizontal depending on screen) */}
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-2.5 pb-1 md:pb-0 scrollbar-none md:w-20 lg:w-24">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-16 h-20 sm:w-20 sm:h-24 md:w-full object-cover rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border-2 transition-all ${
                  activeImage === img ? 'border-black scale-[1.02]' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>

        </div>

        {/* Right Side: Meta Details & Selections (6 Columns) */}
        <div className="lg:col-span-6 space-y-6 sm:space-y-8 flex flex-col justify-between">
          
          {/* Top Info Block */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest uppercase text-black font-sans bg-gray-100 px-2.5 py-1 rounded">
                  {product.brand}
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-xs font-semibold tracking-widest uppercase text-gray-400 font-mono">
                  {product.category} COLLECTION
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 font-sans">
                {product.name}
              </h1>
            </div>

            {/* Stars summary & fast review jump */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center text-yellow-400 gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= Math.round(product.rating) ? 'fill-current' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="font-semibold text-gray-800 font-sans">{product.rating}</span>
              <span className="text-gray-300">|</span>
              <a href="#reviews-anchor" className="text-gray-500 hover:text-black font-medium transition-colors">
                {product.reviewCount} customer journals
              </a>
            </div>

            {/* Price Tags */}
            <div className="flex items-baseline space-x-3.5">
              <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-base text-gray-400 line-through font-medium font-mono">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Editorial Description Text */}
            <p className="text-sm text-gray-600 leading-relaxed font-light">
              {product.description}
            </p>

            {/* Premium Technical Specifications Sheet */}
            <div className="grid grid-cols-2 gap-4 py-3.5 px-4 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-mono">
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px] tracking-wider">Atelier Fabric</span>
                <span className="text-gray-800 font-sans font-medium">{product.fabric}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px] tracking-wider">Registry SKU</span>
                <span className="text-gray-800 font-medium">{product.sku}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px] tracking-wider">Stock Level</span>
                <span className="text-gray-800 font-medium">{product.stock} units in archive</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px] tracking-wider">Availability Status</span>
                <span className={`font-semibold uppercase tracking-wider text-[11px] ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Selections Sheet */}
          <div className="space-y-6 pt-6 border-t border-gray-100">
            
            {/* 1. Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono flex justify-between">
                  <span>GARMENT COLOR</span>
                  <span className="text-gray-700">{selectedColor?.name}</span>
                </span>
                <div className="flex items-center gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        selectedColor?.hex === color.hex
                          ? 'border-black ring-2 ring-black/10 scale-110'
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      title={color.name}
                    >
                      <span
                        className="w-6 h-6 rounded-full inline-block shadow-inner border border-black/5"
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono flex justify-between">
                  <span>TAILORED SIZE</span>
                  <span className="text-gray-700">{selectedSize}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider border uppercase transition-all ${
                        selectedSize === sz
                          ? 'bg-black border-black text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Stock Level Alert */}
            {isLowStock && (
              <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-3 text-xs flex items-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Only {product.stock} items remaining in our archive. Secure your fit soon!</span>
              </div>
            )}

            {isOutOfStock && (
              <div className="bg-neutral-50 border border-neutral-100 text-neutral-600 rounded-xl p-3 text-xs flex items-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span>This item is temporarily fully archived. Check back soon for stock releases.</span>
              </div>
            )}

            {/* 4. Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToBag}
                disabled={isOutOfStock}
                className={`flex-1 text-white font-sans text-xs font-bold py-4 rounded-xl tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-gray-300 border-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-black hover:bg-neutral-800 shadow-md shadow-black/10 hover:shadow-lg'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {isOutOfStock ? 'SOLD OUT' : 'ADD TO BAG'}
              </button>

              <button
                onClick={handleWishlistToggle}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isFavorited
                    ? 'bg-red-50 border-red-100 text-red-500'
                    : 'bg-white border-gray-200 text-gray-400 hover:text-black hover:border-gray-400'
                }`}
                title="Toggle Wishlist"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-4 rounded-xl border bg-white border-gray-200 text-gray-400 hover:text-black hover:border-gray-400 transition-all cursor-pointer"
                title="Share product link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Small Feature List Accordion Tab */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            
            {/* Accordion Tabs selectors */}
            <div className="flex space-x-6 text-xs font-bold font-mono tracking-wider text-gray-400 border-b border-gray-50 pb-2">
              <button
                onClick={() => setActiveTab('details')}
                className={`uppercase transition-colors ${activeTab === 'details' ? 'text-black border-b border-black pb-2' : 'hover:text-gray-700'}`}
              >
                Composition
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`uppercase transition-colors ${activeTab === 'shipping' ? 'text-black border-b border-black pb-2' : 'hover:text-gray-700'}`}
              >
                Delivery
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`uppercase transition-colors ${activeTab === 'care' ? 'text-black border-b border-black pb-2' : 'hover:text-gray-700'}`}
              >
                Tailoring Care
              </button>
            </div>

            {/* Accordion Content rendering with dynamic fields */}
            <div className="text-xs text-gray-500 leading-relaxed font-light min-h-[48px]">
              {activeTab === 'details' && (
                <div className="space-y-1.5">
                  <p>• <strong className="font-semibold text-gray-700">Atelier Brand:</strong> {product.brand}</p>
                  <p>• <strong className="font-semibold text-gray-700">Fabrication:</strong> {product.fabric}</p>
                  <p>• <strong className="font-semibold text-gray-700">Unique SKU:</strong> {product.sku}</p>
                  <p>• Cut on precise pattern lines designed to drape fluidly around natural contours.</p>
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="space-y-2">
                  <p className="flex items-start gap-1.5"><Truck className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0 mt-0.5" /> <span>{product.shippingInfo}</span></p>
                  <p className="border-t border-gray-100 pt-2"><strong className="font-semibold text-gray-700">Return Policy:</strong> {product.returnPolicy}</p>
                </div>
              )}
              {activeTab === 'care' && (
                <div className="space-y-1.5">
                  <p className="font-semibold text-gray-700 uppercase tracking-wider text-[10px] mb-1 font-mono">Composition Care Instruction:</p>
                  <p>{product.careInstructions}</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Review Section Grid Anchor */}
      <div id="reviews-anchor" className="pt-8 border-t border-gray-100">
        <ReviewSection product={product} onReviewAdded={() => {}} />
      </div>

      {/* Recommended Items Carousel */}
      {recommended.length > 0 && (
        <div className="pt-16 border-t border-gray-100 space-y-8">
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-400 font-mono">Style Combinations</span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 font-sans">
              Complete the Aesthetic
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
