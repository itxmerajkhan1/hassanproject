/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Heart, 
  ShoppingBag, 
  Star, 
  Flame, 
  Clock, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  MessageCircle, 
  ArrowUpRight,
  ShieldCheck,
  Check,
  Percent
} from 'lucide-react';
import { getProducts } from '../services/dbService';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

// Curated Luxury Editorial Banner Slides
const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&auto=format&fit=crop&q=80",
    collection: "Unstitched Chiffon Edit",
    title: "Sartorial Needlework",
    subtitle: "Meticulously woven zari and delicate gold embroidery on sheer, floating silks.",
    cta: "Shop Unstitched",
    link: "/shop?category=Unstitched"
  },
  {
    image: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=1600&auto=format&fit=crop&q=80",
    collection: "Premium Ready-To-Wear",
    title: "Pure Silk Pret",
    subtitle: "Effortless, contemporary silhouettes draped from biological linens and fluid Italian satin.",
    cta: "Explore Pret",
    link: "/shop?category=Pret"
  },
  {
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600&auto=format&fit=crop&q=80",
    collection: "The Evening Bridal Edit",
    title: "Wedding Heritage",
    subtitle: "Heavy hand-embellished zardozi and crystalline details on crimson jamawar fabrics.",
    cta: "View Wedding Wear",
    link: "/shop?category=Wedding"
  }
];

// Luxury Verified Testimonials
const CUSTOMER_REVIEWS = [
  {
    name: "Alizeh Shah",
    role: "Verified Atelier Client",
    comment: "The Zari Embroidered Organza suit is absolutely breathtaking. The heavy needlework is flawless, and the sheer silk dupatta drapes like liquid light.",
    rating: 5,
    initials: "AS"
  },
  {
    name: "Mariam K.",
    role: "Fashion Curator",
    comment: "I purchased two pieces from the Luxury Lawn series and the cotton is incredibly fine and breathable. The custom laser cut details on the sleeves feel haute couture.",
    rating: 5,
    initials: "MK"
  },
  {
    name: "Zainab Rizvi",
    role: "Collector",
    comment: "The Midnight Velvet Kaftan is the pinnacle of quiet luxury. It holds a beautiful structure while walking, preserving a majestic silence in any room.",
    rating: 5,
    initials: "ZR"
  }
];

// Mock Instagram Feed with high-fashion imagery
const INSTAGRAM_POSTS = [
  { id: 1, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80", likes: "1.4k", comments: 112 },
  { id: 2, image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80", likes: "2.1k", comments: 94 },
  { id: 3, image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&auto=format&fit=crop&q=80", likes: "1.8k", comments: 85 },
  { id: 4, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80", likes: "3.2k", comments: 241 },
  { id: 5, image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80", likes: "2.5k", comments: 130 },
  { id: 6, image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=500&auto=format&fit=crop&q=80", likes: "1.9k", comments: 72 }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideTimeout = useRef<NodeJS.Timeout | null>(null);

  // Flash Sale Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submittingNews, setSubmittingNews] = useState(false);

  // Fetch all products on mount
  useEffect(() => {
    let active = true;
    const fetchHomeProducts = async () => {
      try {
        const allProducts = await getProducts();
        if (active) {
          setProducts(allProducts);
        }
      } catch (err) {
        console.error('Error fetching home products:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchHomeProducts();
    return () => {
      active = false;
    };
  }, []);

  // Slider Automatic Transitions
  useEffect(() => {
    startSlideTimer();
    return () => {
      stopSlideTimer();
    };
  }, [currentSlide]);

  const startSlideTimer = () => {
    stopSlideTimer();
    slideTimeout.current = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
  };

  const stopSlideTimer = () => {
    if (slideTimeout.current) clearTimeout(slideTimeout.current);
  };

  // Flash Sale Countdown Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset timer to keep demo active
          return { hours: 4, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Newsletter Handler
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setSubmittingNews(true);
    // Simulate luxury API response
    await new Promise((res) => setTimeout(res, 800));
    setSubmittingNews(false);
    setSubscribed(true);
    toast.success("Welcome to MK Private Circle.", {
      icon: '✨',
      style: { borderRadius: '12px', background: '#111111', color: '#FFFFFF' }
    });
    setNewsletterEmail('');
  };

  // Dynamic Product Filter Helper
  const getCategoryProducts = (categoryName: string, limit = 4) => {
    return products
      .filter((p) => p.category.toLowerCase() === categoryName.toLowerCase())
      .slice(0, limit);
  };

  const getNewArrivals = (limit = 4) => {
    return products.filter((p) => p.isNewArrival).slice(0, limit);
  };

  const getBestSellers = (limit = 4) => {
    // Highly rated and reviewed
    return [...products]
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, limit);
  };

  const getFlashSaleProducts = (limit = 3) => {
    // Products with markdown discounts
    return products
      .filter((p) => p.originalPrice && p.originalPrice > p.price)
      .slice(0, limit);
  };

  const getTrendingProducts = (limit = 4) => {
    return products.filter((p) => p.isFeatured).slice(0, limit);
  };

  // Scroll to section helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 text-black">

      {/* SECTION 1: PREMIUM HERO BANNER SLIDER */}
      <section className="relative h-[85vh] sm:h-[90vh] w-full bg-neutral-950 overflow-hidden flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            {/* Background Image with Ken Burns Zoom Effect */}
            <motion.img
              src={HERO_SLIDES[currentSlide].image}
              alt={HERO_SLIDES[currentSlide].title}
              referrerPolicy="no-referrer"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1.02 }}
              transition={{ duration: 6, ease: "easeOut" }}
              className="w-full h-full object-cover object-center opacity-60"
            />
            {/* Elegant dark vignette gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Slides Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 text-white">
          <div className="max-w-2xl space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-300 font-mono"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
              <span>{HERO_SLIDES[currentSlide].collection}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="text-4xl sm:text-6xl font-light tracking-tight leading-[1.1] font-sans"
            >
              {HERO_SLIDES[currentSlide].title.split(" ")[0]}{" "}
              <span className="font-semibold text-white">
                {HERO_SLIDES[currentSlide].title.split(" ").slice(1).join(" ")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-sm sm:text-base text-neutral-300 leading-relaxed font-light max-w-lg"
            >
              {HERO_SLIDES[currentSlide].subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                to={HERO_SLIDES[currentSlide].link}
                className="inline-flex items-center justify-center bg-white text-black hover:bg-neutral-100 text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-xl transition-all shadow-lg shadow-white/5"
              >
                {HERO_SLIDES[currentSlide].cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <button
                onClick={() => scrollToSection("featured-collections")}
                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-xl transition-all"
              >
                Atelier Catalog
              </button>
            </motion.div>
          </div>
        </div>

        {/* Controls - Left & Right Arrows */}
        <button
          onClick={() => {
            setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
            startSlideTimer();
          }}
          className="absolute left-4 sm:left-6 p-3 bg-black/20 hover:bg-black/50 border border-white/10 text-white rounded-full backdrop-blur-sm transition-all"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
            startSlideTimer();
          }}
          className="absolute right-4 sm:right-6 p-3 bg-black/20 hover:bg-black/50 border border-white/10 text-white rounded-full backdrop-blur-sm transition-all"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Navigation Dot Indicators */}
        <div className="absolute bottom-8 inset-x-0 flex justify-center space-x-2.5 z-20">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSlide(idx);
                startSlideTimer();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>


      {/* SECTION 2: NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 font-mono">
              FRESH LAUNCHED COUTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 font-sans">
              New <span className="font-semibold">Arrivals</span>
            </h2>
          </div>
          <Link
            to="/shop?filter=new"
            className="text-xs font-semibold text-black flex items-center gap-1.5 hover:gap-2.5 transition-all group border-b border-black/20 pb-0.5"
          >
            VIEW NEW RELEASES
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[3/4] bg-gray-100 rounded-2xl w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {getNewArrivals().map((product) => (
              <div key={product.id} className="group-hover:scale-[1.02] transition-transform duration-500">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>


      {/* SECTION 3: BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 font-mono">
              ESTEEMED LUXURY STAPLES
            </span>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 font-sans">
              Best <span className="font-semibold">Sellers</span>
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-black flex items-center gap-1.5 hover:gap-2.5 transition-all group border-b border-black/20 pb-0.5"
          >
            EXPLORE BEST SELLERS
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[3/4] bg-gray-100 rounded-2xl w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {getBestSellers().map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>


      {/* SECTION 4: FEATURED COLLECTIONS PORTALS */}
      <section id="featured-collections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12 sm:mb-16">
          <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 font-mono">
            COUTURE DIVISION PORTALS
          </span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 font-sans">
            Featured <span className="font-semibold">Collections</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-light leading-relaxed">
            Navigate through our dedicated tailoring divisions. Click any portal to jump into detail and discover seasonal wardrobes.
          </p>
        </div>

        {/* Bento Grid Portal Map */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              id: "unstitched",
              title: "Unstitched Collection",
              desc: "Pure silks, chiffon embroideries, raw flax threads.",
              image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80"
            },
            {
              id: "pret",
              title: "Pret Ready-To-Wear",
              desc: "Effortless designer kurtis and modular sets.",
              image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80"
            },
            {
              id: "formal",
              title: "Formal Couture",
              desc: "Midnight velvet kaftans, hand-set crystal tilla work.",
              image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80"
            },
            {
              id: "lawn",
              title: "Luxury Lawn",
              desc: "Breezy spring weave cottons with silk dupatta sets.",
              image: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80"
            },
            {
              id: "wedding",
              title: "Wedding Collection",
              desc: "Royal crimson jamawars and zardozi bridal edits.",
              image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80"
            },
            {
              id: "summer",
              title: "Summer Collection",
              desc: "Light terracotta slips and washed flax co-ord suits.",
              image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80"
            }
          ].map((col) => (
            <div
              key={col.id}
              onClick={() => scrollToSection(col.id)}
              className="group relative h-96 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-neutral-100 transition-all duration-300 cursor-pointer"
            >
              {/* Image with zoom effect */}
              <img
                src={col.image}
                alt={col.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300" />
              
              {/* Content Panel */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <span className="text-[9px] font-bold text-yellow-500/80 uppercase font-mono tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ATELIER PORTAL
                </span>
                <h3 className="text-xl font-semibold tracking-tight">{col.title}</h3>
                <p className="text-[11px] text-neutral-300 font-light leading-snug">{col.desc}</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-white bg-white/10 group-hover:bg-white group-hover:text-black border border-white/20 rounded-lg px-3 py-1.5 transition-all">
                    EXPLORE EDIT <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* SECTION 5: UNSTITCHED COLLECTION DETAILED PANEL */}
      <section id="unstitched" className="bg-neutral-50/60 border-t border-b border-neutral-100 py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Split Left: Editorial Image with zoom effect */}
            <div className="lg:col-span-5 relative group h-[450px] sm:h-[550px] rounded-3xl overflow-hidden shadow-lg border border-neutral-200">
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop&q=80"
                alt="Unstitched Collection Editorial"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold text-neutral-200 uppercase font-mono">
                Atelier Close-Up
              </div>
            </div>

            {/* Split Right: Couture description & product shelf */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 font-mono">
                  SARTORIAL FREEDOM
                </span>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 font-sans">
                  The <span className="font-semibold">Unstitched Collection</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light max-w-xl">
                  Unstitched sets give you absolute design agency. Crafted with heavy, flowing silk panels, premium botanical laces, laser-cut templates, and hand-embellished zari necklines. Includes tailored guides to direct your couture craftsman.
                </p>
              </div>

              {/* Product Shelf */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold tracking-widest text-neutral-400 font-mono uppercase pb-1 border-b border-neutral-100">
                  AVAILABLE COUTURE UNSTITCHED PACKAGES
                </h4>
                {loading ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="animate-pulse bg-gray-100 rounded-xl h-48" />
                    <div className="animate-pulse bg-gray-100 rounded-xl h-48" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {getCategoryProducts("Unstitched", 2).map((prod) => (
                      <ProductCard key={prod.id} product={prod} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Link
                  to="/shop?category=Unstitched"
                  className="inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-xl transition-all shadow-md"
                >
                  VIEW FULL UNSTITCHED CATALOG
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* SECTION 6: PRET READY-TO-WEAR DETAIL PANEL */}
      <section id="pret" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Split Left: Couture description & product shelf */}
          <div className="lg:col-span-7 order-2 lg:order-1 space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 font-mono">
                EFFORTLESS ATELIER READY
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 font-sans">
                The <span className="font-semibold">Pret Ready-To-Wear Collection</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light max-w-xl">
                Ready-to-wear garments made using our exact tailoring standards. Slip into liquid-like silk tunics, double-stitch linen trousers, and asymmetric kurtis detailed with subtle mother-of-pearl closures.
              </p>
            </div>

            {/* Product Shelf */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold tracking-widest text-neutral-400 font-mono uppercase pb-1 border-b border-neutral-100">
                LATEST IN-STOCK PRET PIECES
              </h4>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-pulse bg-gray-100 rounded-xl h-48" />
                  <div className="animate-pulse bg-gray-100 rounded-xl h-48" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getCategoryProducts("Pret", 2).map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <Link
                to="/shop?category=Pret"
                className="inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-xl transition-all shadow-md"
              >
                BROWSE READY-TO-WEAR
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Link>
            </div>
          </div>

          {/* Split Right: Editorial Image with zoom effect */}
          <div className="lg:col-span-5 order-1 lg:order-2 relative group h-[450px] sm:h-[550px] rounded-3xl overflow-hidden shadow-lg border border-neutral-100">
            <img
              src="https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=1200&auto=format&fit=crop&q=80"
              alt="Pret Collection Editorial"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold text-neutral-200 uppercase font-mono">
              Ready To Wear
            </div>
          </div>

        </div>
      </section>


      {/* SECTION 7: FORMAL COUTURE DETAIL PANEL */}
      <section id="formal" className="bg-neutral-900 text-white py-20 sm:py-28 scroll-mt-20 overflow-hidden relative">
        {/* Subtle background luxury graphics */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-800/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Split Left: Editorial Image with zoom effect */}
            <div className="lg:col-span-5 relative group h-[450px] sm:h-[550px] rounded-3xl overflow-hidden shadow-2xl border border-neutral-800">
              <img
                src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&auto=format&fit=crop&q=80"
                alt="Formal Collection Editorial"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold text-yellow-500 uppercase font-mono">
                Velvet Luxury
              </div>
            </div>

            {/* Split Right: Couture description & product shelf */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 font-mono">
                  SARTORIAL EVENINGS
                </span>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white font-sans">
                  The <span className="font-semibold text-yellow-500/90">Formal Collection</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light max-w-xl">
                  Opulent designs for memorable occasions. Explore heavily structured blazers, rich evening velvet kaftans detailed with fine tilla threads, and silk dresses that speak the language of absolute high craftsmanship.
                </p>
              </div>

              {/* Product Shelf */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold tracking-widest text-neutral-400 font-mono uppercase pb-1 border-b border-neutral-800">
                  FEATURED COUTURE FORMALS
                </h4>
                {loading ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="animate-pulse bg-neutral-850 rounded-xl h-48" />
                    <div className="animate-pulse bg-neutral-850 rounded-xl h-48" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {getCategoryProducts("Formal", 2).map((prod) => (
                      <div key={prod.id} className="bg-neutral-800/20 p-2 rounded-2xl border border-neutral-800">
                        <ProductCard product={prod} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Link
                  to="/shop?category=Formal"
                  className="inline-flex items-center justify-center bg-white hover:bg-neutral-200 text-black text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-xl transition-all shadow-md"
                >
                  DISCOVER FORMAL EDITS
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* SECTION 8: LUXURY LAWN PANEL */}
      <section id="lawn" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Split Left: Couture description & product shelf */}
          <div className="lg:col-span-7 order-2 lg:order-1 space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 font-mono">
                SPRING SUMMER WEAVE
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 font-sans">
                The <span className="font-semibold">Luxury Lawn Collection</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light max-w-xl">
                Combining high-density, breathable combed lawn cotton with premium digital silk dupattas. These 3-piece sets represent seasonal lightness, complete with luxury organza necklines and heavy thread embroidery borders.
              </p>
            </div>

            {/* Product Shelf */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold tracking-widest text-neutral-400 font-mono uppercase pb-1 border-b border-neutral-100">
                AVAILABLE LAWN DESIGNS
              </h4>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-pulse bg-gray-100 rounded-xl h-48" />
                  <div className="animate-pulse bg-gray-100 rounded-xl h-48" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getCategoryProducts("Luxury Lawn", 2).map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <Link
                to="/shop?category=Luxury%20Lawn"
                className="inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-xl transition-all shadow-md"
              >
                BROWSE LUXURY LAWN
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Link>
            </div>
          </div>

          {/* Split Right: Editorial Image with zoom effect */}
          <div className="lg:col-span-5 order-1 lg:order-2 relative group h-[450px] sm:h-[550px] rounded-3xl overflow-hidden shadow-lg border border-neutral-100">
            <img
              src="https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=1200&auto=format&fit=crop&q=80"
              alt="Luxury Lawn Collection Editorial"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ objectPosition: 'top center' }}
            />
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold text-neutral-200 uppercase font-mono">
              Pure Lawn Cotton
            </div>
          </div>

        </div>
      </section>


      {/* SECTION 9: WEDDING COLLECTION DETAILED PANEL */}
      <section id="wedding" className="bg-[#520d18] text-[#F3E5D8] py-20 sm:py-28 scroll-mt-20 overflow-hidden relative">
        {/* Decorative gold background graphic */}
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Split Left: Editorial Image with zoom effect */}
            <div className="lg:col-span-5 relative group h-[450px] sm:h-[550px] rounded-3xl overflow-hidden shadow-2xl border border-red-900/50">
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=80"
                alt="Wedding Collection Editorial"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ objectPosition: 'top center' }}
              />
              <div className="absolute top-4 left-4 bg-[#2D060C] backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold text-yellow-400 uppercase font-mono tracking-widest">
                Heritage Bridal
              </div>
            </div>

            {/* Split Right: Couture description & product shelf */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-400/80 font-mono">
                  THE WEDDING EDIT
                </span>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white font-sans">
                  The <span className="font-semibold text-yellow-300">Wedding Collection</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#F3E5D8]/80 leading-relaxed font-light max-w-xl">
                  Intricate festive couture featuring heavy gold zari, hand-crafted zardozi, crystals, and delicate micro-pearl embelishments sewn on heavy jamawar silk and premium sheer tulle netting dupattas. Masterfully crafted for heirloom wear.
                </p>
              </div>

              {/* Product Shelf */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold tracking-widest text-yellow-400/80 font-mono uppercase pb-1 border-b border-red-900">
                  WEDDING ATELIER OFFERINGS
                </h4>
                {loading ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="animate-pulse bg-[#6A1725] rounded-xl h-48" />
                    <div className="animate-pulse bg-[#6A1725] rounded-xl h-48" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {getCategoryProducts("Wedding", 2).map((prod) => (
                      <div key={prod.id} className="bg-black/10 p-2 rounded-2xl border border-red-900/50">
                        <ProductCard product={prod} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Link
                  to="/shop?category=Wedding"
                  className="inline-flex items-center justify-center bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-xl transition-all shadow-md"
                >
                  VIEW ATELIER WEDDING
                  <ArrowRight className="w-3.5 h-3.5 ml-2 text-black" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* SECTION 10: SUMMER COLLECTION DETAIL PANEL */}
      <section id="summer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Split Left: Couture description & product shelf */}
          <div className="lg:col-span-7 order-2 lg:order-1 space-y-8">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 font-mono">
                BALMY RESORT LIFE
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 font-sans">
                The <span className="font-semibold">Summer Collection</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light max-w-xl">
                Bask in resort comfort. Washed pure flax linen co-ords, terracotta slip dresses made from sand-washed habotai silk, and loose lightweight loungewear co-ords keeping you stylish and exceptionally ventilated.
              </p>
            </div>

            {/* Product Shelf */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold tracking-widest text-neutral-400 font-mono uppercase pb-1 border-b border-neutral-100">
                SEASONAL RESORT FAVORITES
              </h4>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-pulse bg-gray-100 rounded-xl h-48" />
                  <div className="animate-pulse bg-gray-100 rounded-xl h-48" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getCategoryProducts("Summer", 2).map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <Link
                to="/shop?category=Summer"
                className="inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-xl transition-all shadow-md"
              >
                BROWSE RESORTWEAR
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Link>
            </div>
          </div>

          {/* Split Right: Editorial Image with zoom effect */}
          <div className="lg:col-span-5 order-1 lg:order-2 relative group h-[450px] sm:h-[550px] rounded-3xl overflow-hidden shadow-lg border border-neutral-100">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80"
              alt="Summer Collection Editorial"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold text-neutral-200 uppercase font-mono">
              Resort Comfort
            </div>
          </div>

        </div>
      </section>


      {/* SECTION 11: FLASH SALE SECTION */}
      <section className="bg-red-50/50 border-t border-b border-red-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Countdown timer left panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase font-mono">
                <Flame className="w-4 h-4 text-red-500 fill-current animate-bounce" />
                <span>LIMITED TIME OFFER</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-gray-900 font-sans">
                Flash <span className="font-semibold">Sale</span>
              </h2>
              
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-light">
                Securing couture has never been more immediate. Take advantage of our exclusive seasonal markdown pricing on unstitched organza and formal velvet edits.
              </p>

              {/* Countdown Clocks */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-widest text-neutral-400 font-mono uppercase block">
                  TRANSACTION PORTAL SHUTS IN:
                </span>
                <div className="flex items-center space-x-3 text-center font-mono">
                  <div className="bg-black text-white p-3.5 rounded-xl min-w-[65px] shadow-md">
                    <span className="text-xl font-bold block">0{timeLeft.hours}</span>
                    <span className="text-[8px] font-bold tracking-wider text-neutral-400 uppercase">Hours</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">:</span>
                  <div className="bg-black text-white p-3.5 rounded-xl min-w-[65px] shadow-md">
                    <span className="text-xl font-bold block">{timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}</span>
                    <span className="text-[8px] font-bold tracking-wider text-neutral-400 uppercase">Mins</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">:</span>
                  <div className="bg-black text-white p-3.5 rounded-xl min-w-[65px] shadow-md">
                    <span className="text-xl font-bold block">{timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}</span>
                    <span className="text-[8px] font-bold tracking-wider text-neutral-400 uppercase">Secs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items right panel */}
            <div className="lg:col-span-8">
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-pulse bg-gray-100 rounded-xl h-60" />
                  <div className="animate-pulse bg-gray-100 rounded-xl h-60" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {getFlashSaleProducts().map((product) => (
                    <div key={product.id} className="relative bg-white p-2.5 rounded-2xl border border-red-100/50 shadow-sm">
                      {/* Percent badge */}
                      <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-md z-10 flex items-center gap-0.5">
                        <Percent className="w-2.5 h-2.5" />
                        <span>SAVE</span>
                      </div>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>


      {/* SECTION 12: TRENDING PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 font-mono">
              CURATED SOCIAL CLOUT
            </span>
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 font-sans">
              Trending <span className="font-semibold">Products</span>
            </h2>
          </div>
          <Link
            to="/shop?filter=featured"
            className="text-xs font-semibold text-black flex items-center gap-1.5 hover:gap-2.5 transition-all group border-b border-black/20 pb-0.5"
          >
            EXPLORE WHAT'S TRENDING
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[3/4] bg-gray-100 rounded-2xl w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {getTrendingProducts().map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>


      {/* SECTION 13: INSTAGRAM LOOKBOOK GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-lg mx-auto space-y-2.5 mb-10">
          <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase font-mono block">
            SOCIAL ATELIER FEEDS
          </span>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900">
            Share Your Style <span className="font-semibold">#MKFashion</span>
          </h2>
          <p className="text-xs text-gray-500 font-light max-w-sm mx-auto">
            Join our private circle of fashion enthusiasts. Tag your bespoke drapes and lookbooks to be featured.
          </p>
        </div>

        {/* Instagrid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {INSTAGRAM_POSTS.map((post) => (
            <div
              key={post.id}
              className="relative group aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-neutral-100 shadow-sm cursor-pointer"
            >
              {/* Image with zoom effect */}
              <img
                src={post.image}
                alt={`MK fashion post ${post.id}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Dark overlay showing comments and likes */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white space-y-1.5 transition-opacity duration-300 font-mono text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
                  {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {post.comments} comments
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* SECTION 14: CUSTOMER REVIEWS (TESTIMONIALS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-lg mx-auto space-y-2.5 mb-12">
          <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase font-mono block">
            VERIFIED ATELIER REVIEWS
          </span>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900">
            What Our Clients <span className="font-semibold">Say</span>
          </h2>
          <p className="text-xs text-gray-500 font-light max-w-sm mx-auto">
            Reviews reflecting verified purchases of premium embroidery materials and tailor fittings.
          </p>
        </div>

        {/* Bento Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {CUSTOMER_REVIEWS.map((review, idx) => (
            <div
              key={idx}
              className="bg-neutral-50 rounded-3xl p-6 sm:p-8 border border-neutral-100 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-shadow relative"
            >
              {/* Star Rating & Quote graphics */}
              <div className="space-y-4">
                <div className="flex items-center text-yellow-500 gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed italic font-light">
                  "{review.comment}"
                </p>
              </div>

              {/* Buyer profile footer */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                <div className="w-10 h-10 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center font-mono">
                  {review.initials}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                    {review.name}
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono font-medium">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* SECTION 15: ATELIER NEWSLETTER SUBSCRIPTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-neutral-950 text-white rounded-[2.5rem] p-8 sm:p-14 text-center space-y-6 sm:space-y-8 relative overflow-hidden shadow-2xl border border-neutral-800">
          {/* Accent radial glow decoration */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-500 via-yellow-200 to-yellow-500" />
          
          <div className="space-y-3">
            <span className="text-[10px] font-bold tracking-widest text-yellow-400 uppercase font-mono block">
              THE MK PRIVATE CIRCLE
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white font-sans">
              Subscribe to the <span className="font-semibold italic">Atelier Update</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md mx-auto font-light">
              Gain immediate seasonal lookbook previews, priority tailoring slots, and exclusive member-only early transaction portal invites.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {subscribed ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center space-y-2 text-xs"
              >
                <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-white">Your Seat is Secured</h4>
                <p className="text-neutral-400 font-light text-[11px]">
                  Thank you for joining. Welcome to a private, beautifully curated world of haute couture and fine craftsmanship.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email for priority updates"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 rounded-xl pl-11 pr-4 py-3.5 text-xs focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-4 top-4" />
                </div>
                <button
                  type="submit"
                  disabled={submittingNews}
                  className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs tracking-wider uppercase px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  {submittingNews ? "SECURING ACCESS..." : "SUBSCRIBE NOW"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
