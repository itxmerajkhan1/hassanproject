/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../types';

export const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Classic Cashmere Trench",
    description: "An elegant, double-breasted trench coat crafted from a premium cashmere-wool blend. Features a structured silhouette, self-tie belt, and horn buttons. Fully lined in silk.",
    price: 495,
    originalPrice: 650,
    category: "Outerwear",
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Camel", hex: "#C19A6B" },
      { name: "Charcoal", hex: "#36454F" },
      { name: "Alabaster", hex: "#F2EFE9" }
    ],
    rating: 4.9,
    reviewCount: 42,
    stock: 12,
    isFeatured: true,
    isNewArrival: false,
    createdAt: 1717113600000
  },
  {
    id: "prod-2",
    name: "Satin Silk Slip Dress",
    description: "Cut on the bias for a fluid, flattering drape, this luxurious silk slip dress features a cowl neckline and delicate adjustable criss-cross straps. A perfect blend of comfort and sensual elegance.",
    price: 245,
    originalPrice: 245,
    category: "Dresses",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Champagne", hex: "#F0E6D2" },
      { name: "Emerald", hex: "#046307" },
      { name: "Midnight Black", hex: "#1A1A1A" }
    ],
    rating: 4.8,
    reviewCount: 28,
    stock: 18,
    isFeatured: true,
    isNewArrival: true,
    createdAt: 1717200000000
  },
  {
    id: "prod-3",
    name: "Tailored Sculpt Blazer",
    description: "A sharp, structured blazer with clean lines and power shoulders. Features a single-button closure, tailored waist, and satin peak lapels. Pair with trousers or dress it down with raw denim.",
    price: 320,
    originalPrice: 380,
    category: "Outerwear",
    images: [
      "https://images.unsplash.com/photo-1548624149-f7b3e213346d?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Ivory White", hex: "#FFFFF0" },
      { name: "Midnight Black", hex: "#1A1A1A" }
    ],
    rating: 4.7,
    reviewCount: 15,
    stock: 8,
    isFeatured: true,
    isNewArrival: false,
    createdAt: 1717286400000
  },
  {
    id: "prod-4",
    name: "Ribbed Merino Knit Sweater",
    description: "Knitted from ultra-fine Australian Merino wool. Designed for a slim, second-skin fit with an elegant mock neck and long sleeves with thumbhole detail. Breathable, warm, and exceptionally soft.",
    price: 185,
    originalPrice: 185,
    category: "Tops",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Oatmeal", hex: "#EAE0D5" },
      { name: "Sage Green", hex: "#9CAF88" },
      { name: "Crimson Red", hex: "#990000" }
    ],
    rating: 4.6,
    reviewCount: 31,
    stock: 25,
    isFeatured: false,
    isNewArrival: true,
    createdAt: 1717372800000
  },
  {
    id: "prod-5",
    name: "Pleated Wide-Leg Trouser",
    description: "High-waisted, wide-leg trousers crafted from fluid twill fabric. Features deep front pleats, tailored belt loops, and a hidden hook-and-eye closure. Drapes elegantly to create a lengthened silhouette.",
    price: 195,
    originalPrice: 220,
    category: "Tops",
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Alabaster", hex: "#F2EFE9" },
      { name: "Navy Blue", hex: "#000080" },
      { name: "Midnight Black", hex: "#1A1A1A" }
    ],
    rating: 4.9,
    reviewCount: 19,
    stock: 14,
    isFeatured: false,
    isNewArrival: false,
    createdAt: 1717459200000
  },
  {
    id: "prod-6",
    name: "Minimalist Leather Hobo Bag",
    description: "Sculpted from premium grain Italian leather with an ultra-soft suede interior. Features an adjustable strap, internal zip pouch, and solid brass hardware. Accommodates all daily essentials.",
    price: 360,
    originalPrice: 420,
    category: "Accessories",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Tan", hex: "#B5651D" },
      { name: "Midnight Black", hex: "#1A1A1A" },
      { name: "Taupe", hex: "#B38B6D" }
    ],
    rating: 5.0,
    reviewCount: 56,
    stock: 5,
    isFeatured: true,
    isNewArrival: false,
    createdAt: 1717545600000
  },
  {
    id: "prod-7",
    name: "Linen Drawstring Summer Dress",
    description: "Crafted from 100% organic European linen, this midi dress is designed with a adjustable drawstring waist, side slit pockets, and elegant buttons. Breathable and effortlessly chic for hot summer days.",
    price: 165,
    originalPrice: 165,
    category: "Dresses",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Pure White", hex: "#FFFFFF" },
      { name: "Chambray Blue", hex: "#4C81A7" },
      { name: "Olive Green", hex: "#556B2F" }
    ],
    rating: 4.5,
    reviewCount: 22,
    stock: 30,
    isFeatured: false,
    isNewArrival: true,
    createdAt: 1717632000000
  },
  {
    id: "prod-8",
    name: "V-Neck Linen Lounge Set",
    description: "A two-piece lightweight set featuring an oversized short-sleeve top and loose-fit elasticated shorts. Crafted from breathable, washed flax linen for the ultimate luxury lounging experience.",
    price: 135,
    originalPrice: 150,
    category: "Activewear",
    images: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Sand Beige", hex: "#E1D5C1" },
      { name: "Sky Blue", hex: "#87CEEB" }
    ],
    rating: 4.7,
    reviewCount: 14,
    stock: 15,
    isFeatured: false,
    isNewArrival: true,
    createdAt: 1717718400000
  },
  {
    id: "prod-9",
    name: "Zari Embroidered Organza Suit",
    description: "A premium 3-piece unstitched ensemble featuring heavy pure organza silk panel fabrics, detailed golden zari embroidery, and a digitally printed pure silk dupatta.",
    price: 285,
    originalPrice: 340,
    category: "Unstitched",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["Unstitched"],
    colors: [
      { name: "Crimson Red", hex: "#990000" },
      { name: "Alabaster Gold", hex: "#F2EFE9" }
    ],
    rating: 4.9,
    reviewCount: 18,
    stock: 15,
    isFeatured: true,
    isNewArrival: false,
    createdAt: 1717804800000
  },
  {
    id: "prod-10",
    name: "Monochrome Linen Embroidered Set",
    description: "A high-end unstitched kit of organic European flax linen with exquisite contrast embroidery borders, laser cut inserts, and a sheer silk dupatta.",
    price: 195,
    originalPrice: 195,
    category: "Unstitched",
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["Unstitched"],
    colors: [
      { name: "Ebony Black", hex: "#111111" },
      { name: "Bone White", hex: "#F9F6F0" }
    ],
    rating: 4.8,
    reviewCount: 11,
    stock: 20,
    isFeatured: false,
    isNewArrival: true,
    createdAt: 1717891200000
  },
  {
    id: "prod-11",
    name: "Draped Silk Pret Tunic",
    description: "Ready-to-wear luxurious liquid silk tunic. Features a beautifully draped high collar, delicate buttoned cuffs, and cuffed bishop sleeves.",
    price: 175,
    originalPrice: 220,
    category: "Pret",
    images: [
      "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Emerald Green", hex: "#046307" },
      { name: "Midnight Black", hex: "#1A1A1A" }
    ],
    rating: 4.9,
    reviewCount: 33,
    stock: 12,
    isFeatured: true,
    isNewArrival: true,
    createdAt: 1717977600000
  },
  {
    id: "prod-12",
    name: "Asymmetric Pure Linen Pret Set",
    description: "Ready-to-wear two-piece set featuring an asymmetric cut linen tunic and cropped straight trousers. Engineered for breathable and effortless chic.",
    price: 140,
    originalPrice: 140,
    category: "Pret",
    images: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Taupe", hex: "#B38B6D" },
      { name: "Pure White", hex: "#FFFFFF" }
    ],
    rating: 4.7,
    reviewCount: 15,
    stock: 18,
    isFeatured: false,
    isNewArrival: false,
    createdAt: 1718064000000
  },
  {
    id: "prod-13",
    name: "Midnight Velvet Embellished Kaftan",
    description: "An opulent, floor-length evening formal kaftan draped in premium thick micro-velvet. Accented with stunning gold tilla needlework around the split collar and flaring sleeves.",
    price: 410,
    originalPrice: 480,
    category: "Formal",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Midnight Blue", hex: "#0B1021" },
      { name: "Deep Burgundy", hex: "#4A0404" }
    ],
    rating: 5.0,
    reviewCount: 26,
    stock: 8,
    isFeatured: true,
    isNewArrival: false,
    createdAt: 1718150400000
  },
  {
    id: "prod-14",
    name: "Rose Gold Satin Formal Gown",
    description: "An exquisite evening masterpiece cut on the bias in heavy satin silk. Features custom embroidered mesh inserts, low back, and slender criss-cross straps.",
    price: 360,
    originalPrice: 360,
    category: "Formal",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Rose Gold", hex: "#B76E79" },
      { name: "Champagne", hex: "#F0E6D2" }
    ],
    rating: 4.9,
    reviewCount: 19,
    stock: 6,
    isFeatured: false,
    isNewArrival: true,
    createdAt: 1718236800000
  },
  {
    id: "prod-15",
    name: "Pastel Blossom Luxury Lawn",
    description: "Exquisite high-density combed cotton luxury lawn unstitched 3-piece set with a digital print pure silk dupatta and laser cut embroidered details.",
    price: 190,
    originalPrice: 240,
    category: "Luxury Lawn",
    images: [
      "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["Unstitched"],
    colors: [
      { name: "Blossom Pink", hex: "#FFC0CB" },
      { name: "Sage Green", hex: "#9CAF88" }
    ],
    rating: 4.8,
    reviewCount: 41,
    stock: 25,
    isFeatured: true,
    isNewArrival: true,
    createdAt: 1718323200000
  },
  {
    id: "prod-16",
    name: "Teal Dream Luxury Lawn Suit",
    description: "Premium summer lawn suit featuring delicate chicken-kari embroidery on the front panel, breathable organza sleeve patches, and a breezy chiffon scarf.",
    price: 175,
    originalPrice: 175,
    category: "Luxury Lawn",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["Unstitched"],
    colors: [
      { name: "Teal Ocean", hex: "#008080" },
      { name: "Lemon Mint", hex: "#D4EDB8" }
    ],
    rating: 4.7,
    reviewCount: 22,
    stock: 18,
    isFeatured: false,
    isNewArrival: false,
    createdAt: 1718409600000
  },
  {
    id: "prod-17",
    name: "Zardozi Crimson Wedding Lehenga",
    description: "A spectacular bridal lehenga meticulously handcrafted with zardozi, crystals, pearls, and gold thread work on crimson jamawar silk. Includes heavily embroidered net dupatta.",
    price: 680,
    originalPrice: 850,
    category: "Wedding",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["S", "M", "L"],
    colors: [
      { name: "Couture Maroon", hex: "#800000" },
      { name: "Royal Gold", hex: "#D4AF37" }
    ],
    rating: 5.0,
    reviewCount: 14,
    stock: 4,
    isFeatured: true,
    isNewArrival: false,
    createdAt: 1718496000000
  },
  {
    id: "prod-18",
    name: "Embellished Silk Wedding Peshwas",
    description: "A mesmerizing flared silk wedding silhouette featuring intricate hand embelishments, micro-pearl details, and a shimmering metallic thread border.",
    price: 520,
    originalPrice: 520,
    category: "Wedding",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Ivory Pearl", hex: "#FFFFF0" },
      { name: "Sunset Gold", hex: "#FDCC0D" }
    ],
    rating: 4.9,
    reviewCount: 9,
    stock: 5,
    isFeatured: false,
    isNewArrival: true,
    createdAt: 1718582400000
  },
  {
    id: "prod-19",
    name: "Breezy Organic Linen Co-ord",
    description: "An essential summer set featuring a loose flax-linen collared button-down shirt and relaxed wide-leg culottes in pristine white. Perfect for seaside resorts.",
    price: 150,
    originalPrice: 180,
    category: "Summer",
    images: [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Pristine White", hex: "#FFFFFF" },
      { name: "Desert Sand", hex: "#EDC9AF" }
    ],
    rating: 4.8,
    reviewCount: 30,
    stock: 30,
    isFeatured: true,
    isNewArrival: true,
    createdAt: 1718668800000
  },
  {
    id: "prod-20",
    name: "Terracotta Silk Slip Sun-Dress",
    description: "Sun-drenched luxury slip dress made of sand-washed habotai silk. Perfect for beachside resorts, balmy evenings, or garden walks.",
    price: 210,
    originalPrice: 210,
    category: "Summer",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&auto=format&fit=crop&q=80"
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Terracotta", hex: "#E2725B" },
      { name: "Olive Green", hex: "#556B2F" }
    ],
    rating: 4.9,
    reviewCount: 16,
    stock: 15,
    isFeatured: false,
    isNewArrival: false,
    createdAt: 1718755200000
  }
];
