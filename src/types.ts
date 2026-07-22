/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  createdAt: number;
  sku?: string;
  brand?: string;
  fabric?: string;
  careInstructions?: string;
  shippingInfo?: string;
  returnPolicy?: string;
  status?: 'Active' | 'Draft';
  views?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: { name: string; hex: string };
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
  isVerifiedPurchase?: boolean;
  images?: string[];
  likes?: number;
  likedBy?: string[];
  approved?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  wishlist: string[]; // Product IDs
  role?: 'admin' | 'user';
}

export interface Order {
  id: string;
  userId: string;
  email: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
    image: string;
  }[];
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
  };
  paymentStatus: 'paid' | 'pending' | 'failed';
  orderStatus: 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out For Delivery' | 'Delivered' | 'Cancelled' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: number;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  changeType: 'purchase' | 'manual_restock' | 'manual_adjustment' | 'add_product' | 'delete_product';
  quantityChanged: number;
  oldStock: number;
  newStock: number;
  timestamp: number;
  notes?: string;
}

