/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Grid, RefreshCw, ChevronRight } from 'lucide-react';
import { getProducts } from '../services/dbService';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ["All", "Dresses", "Tops", "Outerwear", "Unstitched", "Pret", "Formal", "Luxury Lawn", "Wedding", "Summer", "Accessories"];

export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'featured' | 'sale'>(
    (searchParams.get('filter') as any) || 'all'
  );
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(600);
  const [selectedSize, setSelectedSize] = useState<string>('All');

  // Extra criteria
  const [selectedColor, setSelectedColor] = useState<string>('All');
  const [selectedFabric, setSelectedFabric] = useState<string>('All');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load Products from Firestore
  useEffect(() => {
    let active = true;
    const fetchShopProducts = async () => {
      setLoading(true);
      try {
        const fetched = await getProducts();
        if (active) {
          setProducts(fetched);
        }
      } catch (err) {
        console.error('Error fetching shop products:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchShopProducts();
    return () => {
      active = false;
    };
  }, []);

  // Sync state with URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && CATEGORIES.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    } else if (!categoryParam) {
      setSelectedCategory('All');
    }

    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }

    const filterParam = searchParams.get('filter');
    if (filterParam === 'new' || filterParam === 'featured' || filterParam === 'sale') {
      setActiveTab(filterParam);
    } else {
      setActiveTab('all');
    }
  }, [searchParams]);

  // Handle live filtering logic
  useEffect(() => {
    let results = [...products];

    // Category Filter
    if (selectedCategory !== 'All') {
      results = results.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.fabric && p.fabric.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // Tab Type Filter (New, Featured, Sale)
    if (activeTab === 'new') {
      results = results.filter((p) => p.isNewArrival);
    } else if (activeTab === 'featured') {
      results = results.filter((p) => p.isFeatured);
    } else if (activeTab === 'sale') {
      results = results.filter((p) => p.originalPrice && p.originalPrice > p.price);
    }

    // Size Filter
    if (selectedSize !== 'All') {
      results = results.filter((p) => p.sizes.includes(selectedSize));
    }

    // Color Filter
    if (selectedColor !== 'All') {
      results = results.filter((p) =>
        p.colors?.some((c) => c.name.toLowerCase().includes(selectedColor.toLowerCase()))
      );
    }

    // Fabric Filter
    if (selectedFabric !== 'All') {
      results = results.filter((p) =>
        p.fabric?.toLowerCase().includes(selectedFabric.toLowerCase())
      );
    }

    // Stock Status / Availability Filter
    if (onlyInStock) {
      results = results.filter((p) => p.stock > 0);
    }

    // Price Filter
    results = results.filter((p) => p.price <= priceRange);

    // Sorting Logic
    if (sortBy === 'price-asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      results.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'best-selling') {
      results.sort((a, b) => b.reviewCount - a.reviewCount);
    } else {
      // default: newest or order
      results.sort((a, b) => b.createdAt - a.createdAt);
    }

    setFilteredProducts(results);
  }, [products, selectedCategory, searchQuery, activeTab, selectedSize, selectedColor, selectedFabric, onlyInStock, priceRange, sortBy]);

  // Suggestions dynamic generator
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const matches = new Set<string>();

    products.forEach((p) => {
      if (p.name.toLowerCase().includes(q)) {
        matches.add(p.name);
      }
      if (p.category.toLowerCase().includes(q)) {
        matches.add(p.category);
      }
      if (p.fabric && p.fabric.toLowerCase().includes(q)) {
        if (p.fabric.toLowerCase().includes('cashmere')) matches.add('Cashmere');
        else if (p.fabric.toLowerCase().includes('silk')) matches.add('Silk');
        else if (p.fabric.toLowerCase().includes('linen')) matches.add('Linen');
        else if (p.fabric.toLowerCase().includes('cotton')) matches.add('Cotton');
      }
      if (p.brand && p.brand.toLowerCase().includes(q)) {
        matches.add(p.brand);
      }
    });

    setSuggestions(Array.from(matches).slice(0, 5));
  }, [searchQuery, products]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  const handleTabChange = (tab: 'all' | 'new' | 'featured' | 'sale') => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'all') {
      newParams.delete('filter');
    } else {
      newParams.set('filter', tab);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setActiveTab('all');
    setSortBy('featured');
    setPriceRange(600);
    setSelectedSize('All');
    setSelectedColor('All');
    setSelectedFabric('All');
    setOnlyInStock(false);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* Header Path & Banner */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-mono">
          <span>MK FASHION</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">COLLECTIONS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight font-sans">
          The Curated Catalog
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xl font-light">
          Browse through our modern seasonal clothing lines, tailored with elegant cuts and designed for lasting modular wardrobes.
        </p>
      </div>

      {/* Categories Scroller (Apple Horizontal Pill Bar) */}
      <div className="flex overflow-x-auto pb-3 gap-2 border-b border-gray-100 scrollbar-none scroll-smooth">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-black text-white shadow-md shadow-black/10'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Filter Action Strip */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50 border border-gray-100 p-4 rounded-2xl">
        
        {/* Left Side: Secondary Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100/80 w-full md:w-auto">
          {(["all", "new", "featured", "sale"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
            >
              {tab === 'all' ? 'All Pieces' : tab === 'new' ? 'New Arrivals' : tab === 'featured' ? 'Staples' : 'On Sale'}
            </button>
          ))}
        </div>

        {/* Right Side: Filters, Search and Sorting Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Search box within shop */}
          <div className="relative flex-1 md:w-56 lg:w-64 max-w-md">
            <input
              type="text"
              placeholder="Search in catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-black transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            
            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl mt-1.5 shadow-xl z-50 overflow-hidden divide-y divide-gray-50 max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer text-gray-700 hover:text-black font-medium"
                    >
                      <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Extra filters panel */}
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`p-2 px-3 border rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isFilterPanelOpen || selectedSize !== 'All' || selectedColor !== 'All' || selectedFabric !== 'All' || onlyInStock || priceRange < 600
                ? 'bg-black border-black text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ADJUSTMENT</span>
          </button>

          {/* Sorting Select */}
          <div className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl text-xs font-semibold px-3 py-2.5 pr-8 outline-none focus:border-black transition-colors appearance-none text-gray-700 cursor-pointer"
            >
              <option value="featured">Newest releases</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="best-selling">Best Selling</option>
              <option value="rating">Top Rated</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 pointer-events-none" />
          </div>

        </div>
      </div>

      {/* Expandable Advanced Filters Panel */}
      <AnimatePresence>
        {isFilterPanelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-gray-50/20 border border-gray-100 rounded-2xl px-6 py-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              
              {/* Max Price Range Slider & Stock Toggle */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-400 uppercase font-mono">Max Price</span>
                    <span className="font-semibold text-gray-900 font-mono">${priceRange}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="600"
                    step="25"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>$100</span>
                    <span>$600</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase font-mono">Archive In-Stock</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={onlyInStock} 
                      onChange={(e) => setOnlyInStock(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                  </label>
                </div>
              </div>

              {/* Size Buttons */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase font-mono block">Filter by Size</span>
                <div className="flex flex-wrap gap-1.5">
                  {["All", "XS", "S", "M", "L", "XL", "One Size"].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric Buttons */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase font-mono block">Filter by Fabric</span>
                <div className="flex flex-wrap gap-1.5">
                  {["All", "Silk", "Linen", "Cashmere", "Wool", "Cotton", "Velvet"].map((fab) => (
                    <button
                      key={fab}
                      onClick={() => setSelectedFabric(fab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        selectedFabric === fab
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {fab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase font-mono block">Filter by Color</span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-none">
                  {["All", "Camel", "Charcoal", "Alabaster", "Champagne", "Emerald", "Black", "Ivory", "Oatmeal", "Sage", "Crimson", "Navy", "Tan", "Taupe", "White", "Beige", "Blue", "Gold"].map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(col)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        selectedColor === col
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset all filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid List Products */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-300 mx-auto" />
          <p className="text-xs text-gray-400 font-mono">Retrieving live collection catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-gray-50/50 border border-gray-100 rounded-3xl py-16 px-6 text-center space-y-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Grid className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-800">No collections match your criteria</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Try resetting your adjustment filters, adjusting the price caps, or searching for other keywords.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="animate-in fade-in duration-300">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
