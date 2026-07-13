/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Review, Order, UserProfile, InventoryLog } from '../types';
import { initialProducts } from '../data/initialProducts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const isPermissionError = error?.code === 'permission-denied' || 
                            error?.message?.includes('permission-denied') ||
                            error?.message?.includes('Missing or insufficient permissions');

  if (isPermissionError) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
}

const PRODUCTS_COLLECTION = 'products';
const REVIEWS_COLLECTION = 'reviews';
const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';

// Dynamic enrichment helper to guarantee premium product attributes
export function enrichProduct(product: Product): Product {
  const brandById: Record<string, string> = {
    "prod-1": "Atelier Cashmere",
    "prod-2": "Heritage Silk",
    "prod-3": "MK Tailored",
    "prod-4": "Merino & Co.",
    "prod-5": "MK Tailored",
    "prod-6": "Atelier Accessories",
    "prod-7": "Linen Breeze",
    "prod-8": "Linen Lounge",
    "prod-9": "Zari Couture",
    "prod-10": "European Flax",
    "prod-11": "Liquid Silk",
    "prod-12": "Effortless Flax",
    "prod-13": "Midnight Formal",
    "prod-14": "Bias Satin",
    "prod-15": "Luxury Cotton Weave",
    "prod-16": "Premium Lawn Co.",
    "prod-17": "Wedding Heritage",
    "prod-18": "Royal Peshwas",
    "prod-19": "Seaside Resort",
    "prod-20": "Habotai Resort"
  };

  const fabricById: Record<string, string> = {
    "prod-1": "90% Virgin Cashmere, 10% Organic Mulberry Silk",
    "prod-2": "100% Heavy Satin Silk (19mm momme count)",
    "prod-3": "Structured Wool-Twill with Satin Peak Lining",
    "prod-4": "100% Fine Australian Merino Wool (18.5 micron)",
    "prod-5": "Fluid Twill Crepe (sustainable botanic viscose)",
    "prod-6": "Premium Full-Grain Italian Calfskin Leather with Micro-Suede",
    "prod-7": "100% Certified Organic European Flax Linen",
    "prod-8": "100% Pre-Washed Soft Flax Linen",
    "prod-9": "Pure Silk Organza with Heavy Gilded Metallic Threads",
    "prod-10": "High-Grade European Flax Linen with Lace inserts",
    "prod-11": "100% Fluid Mulberry Liquid Silk",
    "prod-12": "Breathable Long-Staple European Linen Blend",
    "prod-13": "Premium High-Pile Cotton Micro-Velvet",
    "prod-14": "Heavy Satin Silk with embroidered mesh overlay",
    "prod-15": "Super-Combed High-Density Lawn Cotton and Chiffon",
    "prod-16": "Breathable Summer Cotton Lawn with pure Silk dupatta",
    "prod-17": "Crimson Hand-Weaved Jamawar Silk and Netting",
    "prod-18": "Hand-Detailed Flared Silk Taffeta and Organza",
    "prod-19": "Raw Organic European Flax Linen",
    "prod-20": "Sand-Washed Japanese Habotai Silk"
  };

  const defaultBrand = "Atelier MK";
  const defaultFabric = "Premium Sustainable Silk-Cotton Blend";

  const skuPrefix = product.category ? product.category.slice(0, 3).toUpperCase() : "MK";
  const numId = product.id.replace(/\D/g, "") || "00";
  const defaultSku = `MK-${skuPrefix}-${numId.padStart(3, "0")}`;

  return {
    ...product,
    sku: product.sku || defaultSku,
    brand: product.brand || brandById[product.id] || defaultBrand,
    fabric: product.fabric || fabricById[product.id] || defaultFabric,
    careInstructions: product.careInstructions || (
      product.category === "Accessories" 
        ? "Clean with a soft, damp cloth. Treat with specialty leather conditioner periodically. Store in original dust bag."
        : product.category === "Wedding" || product.category === "Formal" || product.category === "Unstitched"
          ? "Professional dry clean only. Iron on lowest temperature setting using a protective press cloth. Do not steam hand-embroidered areas."
          : "Dry clean recommended, or hand wash cold using mild pH-neutral detergent. Dry flat in shade. Cool iron on reverse."
    ),
    shippingInfo: product.shippingInfo || "Dispatches within 24–48 hours from our central atelier. Complimentary tracked express shipping worldwide on orders above $150. Delivery times range from 3 to 7 business days.",
    returnPolicy: product.returnPolicy || "Complimentary 14-day return period. Items must be in original unworn condition with all atelier security seals, tags, and packaging intact.",
    status: product.status || 'Active'
  };
}

// Helper to seed database if empty
export async function seedProductsIfEmpty(): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty) {
      console.log('Product catalog is empty. Seeding initial luxury catalog...');
      const seedPromises = initialProducts.map((product) => {
        const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
        const enriched = enrichProduct(product);
        return setDoc(docRef, enriched);
      });
      await Promise.all(seedPromises);
      console.log('Seeding completed successfully.');
      return initialProducts.map(enrichProduct);
    }
    
    const products: Product[] = [];
    snapshot.forEach((doc) => {
      products.push(enrichProduct(doc.data() as Product));
    });
    return products;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
    console.error('Error seeding products:', error);
    return initialProducts.map(enrichProduct); // Fallback to memory
  }
}

// Fetch all products
export async function getProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);
    if (snapshot.empty) {
      return await seedProductsIfEmpty();
    }
    const products: Product[] = [];
    snapshot.forEach((doc) => {
      products.push(enrichProduct(doc.data() as Product));
    });
    return products;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
    console.error('Error fetching products:', error);
    return initialProducts.map(enrichProduct); // Fallback to memory
  }
}

// Fetch single product
export async function getProduct(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return enrichProduct(docSnap.data() as Product);
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${PRODUCTS_COLLECTION}/${id}`);
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

// Helper to check if user has purchased the product
export async function checkUserVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
  try {
    const orders = await getUserOrders(userId);
    return orders.some(order => 
      order.items.some(item => item.productId === productId)
    );
  } catch (error) {
    console.error('Error checking verified purchase status:', error);
    return false;
  }
}

// Add review - initially unapproved (pending admin moderation)
export async function addProductReview(
  productId: string,
  reviewInput: Omit<Review, 'id' | 'createdAt'>
): Promise<Review> {
  const reviewId = `rev-${Date.now()}`;
  const createdAt = Date.now();
  const newReview: Review = {
    ...reviewInput,
    id: reviewId,
    createdAt,
    approved: false, // Default to false for Admin Approval
    likes: 0,
    likedBy: [],
    isVerifiedPurchase: reviewInput.isVerifiedPurchase || false
  };

  try {
    // Save review document (doesn't update product rating until approved!)
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await setDoc(reviewRef, newReview);
    return newReview;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, REVIEWS_COLLECTION);
    console.error('Error adding product review:', error);
    throw error;
  }
}

// Admin approves review and triggers product rating updates
export async function approveReview(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const reviewSnap = await getDoc(reviewRef);
    if (!reviewSnap.exists()) {
      throw new Error("Review not found!");
    }

    const reviewData = reviewSnap.data() as Review;
    if (reviewData.approved) {
      return; // Already approved
    }

    // 1. Mark review as approved
    await updateDoc(reviewRef, { approved: true });

    // 2. Update product rating and reviewCount inside transaction
    const productRef = doc(db, PRODUCTS_COLLECTION, reviewData.productId);
    await runTransaction(db, async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) {
        throw new Error("Product does not exist!");
      }

      const productData = productDoc.data() as Product;
      const currentCount = productData.reviewCount || 0;
      const currentRating = productData.rating || 0;

      const newCount = currentCount + 1;
      const newRating = Number(((currentRating * currentCount + reviewData.rating) / newCount).toFixed(1));

      transaction.update(productRef, {
        reviewCount: newCount,
        rating: newRating
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, REVIEWS_COLLECTION);
    console.error('Error approving review:', error);
    throw error;
  }
}

// Toggle review likes
export async function toggleLikeReview(reviewId: string, userId: string): Promise<{ likes: number; likedBy: string[] }> {
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  try {
    let updatedLikes = 0;
    let updatedLikedBy: string[] = [];

    await runTransaction(db, async (transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      if (!reviewDoc.exists()) {
        throw new Error("Review does not exist!");
      }

      const data = reviewDoc.data() as Review;
      const currentLikedBy = data.likedBy || [];

      if (currentLikedBy.includes(userId)) {
        updatedLikedBy = currentLikedBy.filter(id => id !== userId);
      } else {
        updatedLikedBy = [...currentLikedBy, userId];
      }

      updatedLikes = updatedLikedBy.length;

      transaction.update(reviewRef, {
        likes: updatedLikes,
        likedBy: updatedLikedBy
      });
    });

    return { likes: updatedLikes, likedBy: updatedLikedBy };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, REVIEWS_COLLECTION);
    console.error('Error toggling review like:', error);
    throw error;
  }
}

// Get all reviews across all products (for Admin Panel)
export async function getAllReviews(): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const reviews: Review[] = [];
    snapshot.forEach((doc) => {
      reviews.push(doc.data() as Review);
    });
    return reviews;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
    console.error('Error fetching all reviews:', error);
    return [];
  }
}

// Delete a review (or reject it)
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    const reviewSnap = await getDoc(reviewRef);
    if (!reviewSnap.exists()) return;
    const reviewData = reviewSnap.data() as Review;

    // Delete the review document
    await deleteDoc(reviewRef);

    // If review was approved, we should also deduct it from the product rating metrics
    if (reviewData.approved) {
      const productRef = doc(db, PRODUCTS_COLLECTION, reviewData.productId);
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) return;

        const productData = productDoc.data() as Product;
        const currentCount = productData.reviewCount || 0;
        const currentRating = productData.rating || 0;

        if (currentCount <= 1) {
          transaction.update(productRef, {
            reviewCount: 0,
            rating: 5.0
          });
        } else {
          const newCount = currentCount - 1;
          const newRating = Number(((currentRating * currentCount - reviewData.rating) / newCount).toFixed(1));
          transaction.update(productRef, {
            reviewCount: newCount,
            rating: newRating
          });
        }
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, REVIEWS_COLLECTION);
    console.error('Error deleting review:', error);
    throw error;
  }
}

// Get reviews for a product
export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    const q = query(
      reviewsRef,
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const reviews: Review[] = [];
    snapshot.forEach((doc) => {
      reviews.push(doc.data() as Review);
    });
    return reviews;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
    console.error('Error fetching reviews:', error);
    // Return mock initial reviews if firestore fails or is empty
    return [
      {
        id: "mock-1",
        productId,
        userId: "user-1",
        userName: "Sophia Loren",
        rating: 5,
        comment: "Absolutely gorgeous drape and incredibly high quality cashmere. A luxury staple!",
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        approved: true,
        isVerifiedPurchase: true,
        likes: 5,
        likedBy: ["user-2"]
      },
      {
        id: "mock-2",
        productId,
        userId: "user-2",
        userName: "Charlotte P.",
        rating: 4,
        comment: "Fit is beautiful. True to size. Fabric feels light yet extremely premium.",
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        approved: true,
        isVerifiedPurchase: true,
        likes: 2,
        likedBy: ["user-1"]
      }
    ];
  }
}

// Save checkout order & deduct stock
export async function createOrder(orderInput: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const orderId = `order-${Math.floor(100000 + Math.random() * 900000)}`;
  const createdAt = Date.now();
  const newOrder: Order = {
    ...orderInput,
    id: orderId,
    createdAt
  };

  try {
    // 1. Save the order document
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(orderRef, newOrder);

    // 2. Decrement stock for each item in the order
    for (const item of orderInput.items) {
      const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      try {
        await runTransaction(db, async (transaction) => {
          const productDoc = await transaction.get(productRef);
          if (productDoc.exists()) {
            const currentStock = productDoc.data().stock || 0;
            const updatedStock = Math.max(0, currentStock - item.quantity);
            transaction.update(productRef, { stock: updatedStock });

            // Atomic insertion of purchase inventory log
            const logId = `log-${Math.floor(100000 + Math.random() * 900000)}`;
            const logRef = doc(db, 'inventory_logs', logId);
            transaction.set(logRef, {
              id: logId,
              productId: item.productId,
              productName: item.name,
              changeType: 'purchase',
              quantityChanged: -item.quantity,
              oldStock: currentStock,
              newStock: updatedStock,
              timestamp: Date.now(),
              notes: `Order #${orderId}`
            });
          }
        });
      } catch (stockError) {
        console.error(`Failed to update stock for product ${item.productId}:`, stockError);
      }
    }

    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ORDERS_COLLECTION);
    console.error('Error creating order:', error);
    throw error;
  }
}

// Get user orders
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push(doc.data() as Order);
    });
    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    console.error('Error fetching user orders:', error);
    return [];
  }
}

// User Profile Operations
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${USERS_COLLECTION}/${uid}`);
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function createUserProfile(uid: string, profile: Omit<UserProfile, 'uid' | 'createdAt' | 'wishlist'>): Promise<UserProfile> {
  const newUserProfile: UserProfile = {
    ...profile,
    uid,
    createdAt: Date.now(),
    wishlist: []
  };
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(docRef, newUserProfile, { merge: true });
    return newUserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${USERS_COLLECTION}/${uid}`);
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function toggleWishlist(uid: string, productId: string): Promise<string[]> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  try {
    let updatedWishlist: string[] = [];
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(docRef);
      if (!userDoc.exists()) {
        // Create profile first
        updatedWishlist = [productId];
        transaction.set(docRef, {
          uid,
          wishlist: updatedWishlist,
          createdAt: Date.now()
        }, { merge: true });
      } else {
        const data = userDoc.data() as UserProfile;
        const currentWishlist = data.wishlist || [];
        if (currentWishlist.includes(productId)) {
          updatedWishlist = currentWishlist.filter(id => id !== productId);
        } else {
          updatedWishlist = [...currentWishlist, productId];
        }
        transaction.update(docRef, { wishlist: updatedWishlist });
      }
    });
    return updatedWishlist;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${uid}`);
    console.error('Error toggling wishlist:', error);
    throw error;
  }
}

// Admin Operations
export async function addProduct(product: Product): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(docRef, product);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${product.id}`);
    console.error('Error adding product:', error);
    throw error;
  }
}

export async function updateProduct(id: string, updatedProduct: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, updatedProduct);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push(doc.data() as Order);
    });
    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    console.error('Error fetching all orders:', error);
    return [];
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Order;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${ORDERS_COLLECTION}/${id}`);
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }
}

export async function updateOrderStatus(orderId: string, status: Order['orderStatus']): Promise<void> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, { orderStatus: status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    console.error('Error updating order status:', error);
    throw error;
  }
}

export async function updateOrder(orderId: string, updatedFields: Partial<Order>): Promise<void> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, updatedFields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
    console.error('Error updating order:', error);
    throw error;
  }
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
    console.error('Error fetching all user profiles:', error);
    return [];
  }
}

const INVENTORY_LOGS_COLLECTION = 'inventory_logs';

export async function addInventoryLog(logInput: Omit<InventoryLog, 'id' | 'timestamp'>): Promise<void> {
  const id = `log-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = Date.now();
  const log: InventoryLog = {
    ...logInput,
    id,
    timestamp
  };
  try {
    const docRef = doc(db, INVENTORY_LOGS_COLLECTION, id);
    await setDoc(docRef, log);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${INVENTORY_LOGS_COLLECTION}/${id}`);
    console.error('Error adding inventory log:', error);
  }
}

export async function getInventoryLogs(): Promise<InventoryLog[]> {
  try {
    const logsRef = collection(db, INVENTORY_LOGS_COLLECTION);
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const logs: InventoryLog[] = [];
    snapshot.forEach((doc) => {
      logs.push(doc.data() as InventoryLog);
    });
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, INVENTORY_LOGS_COLLECTION);
    console.error('Error fetching inventory logs:', error);
    return [];
  }
}

