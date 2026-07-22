/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
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
  };
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  console.error(`Firestore error during ${operationType} on path [${path}]:`, error);
}

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
    status: product.status || 'Active',
    views: product.views || (Math.abs(product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 180 + 120)
  };
}

// Seed products if empty
export async function seedProductsIfEmpty(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    if (querySnapshot.empty) {
      console.log('Seeding products to Firestore...');
      for (const p of initialProducts) {
        const enriched = enrichProduct(p);
        await setDoc(doc(db, 'products', enriched.id), enriched);
      }
      return initialProducts.map(enrichProduct);
    }
    const list: Product[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as Product);
    });
    return list.map(enrichProduct);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
    return initialProducts.map(enrichProduct);
  }
}

// Fetch all products
export async function getProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    if (querySnapshot.empty) {
      return await seedProductsIfEmpty();
    }
    const list: Product[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as Product);
    });
    return list.map(enrichProduct);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
    return initialProducts.map(enrichProduct);
  }
}

// Fetch single product
export async function getProduct(id: string): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, 'products', id));
    if (docSnap.exists()) {
      return enrichProduct(docSnap.data() as Product);
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `products/${id}`);
    return null;
  }
}

// Helper to check if user has purchased the product
export async function checkUserVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    let purchased = false;
    querySnapshot.forEach(docSnap => {
      const order = docSnap.data() as Order;
      if (order.items.some(item => item.productId === productId)) {
        purchased = true;
      }
    });
    return purchased;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
    return false;
  }
}

// Add review
export async function addProductReview(
  productId: string,
  reviewInput: Omit<Review, 'id' | 'createdAt'>
): Promise<Review> {
  try {
    const reviewId = `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = Date.now();
    const newReview: Review = {
      ...reviewInput,
      id: reviewId,
      createdAt,
      approved: false,
      likes: 0,
      likedBy: [],
      isVerifiedPurchase: reviewInput.isVerifiedPurchase || false
    };

    await setDoc(doc(db, 'reviews', reviewId), newReview);
    return newReview;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reviews');
    throw error;
  }
}

// Approve review
export async function approveReview(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    if (!reviewSnap.exists()) {
      throw new Error("Review not found!");
    }

    const review = reviewSnap.data() as Review;
    if (review.approved) return;

    await updateDoc(reviewRef, { approved: true });

    // Update product statistics
    const productRef = doc(db, 'products', review.productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const product = productSnap.data() as Product;
      const currentCount = product.reviewCount || 0;
      const currentRating = product.rating || 0;
      const newCount = currentCount + 1;
      const newRating = Number(((currentRating * currentCount + review.rating) / newCount).toFixed(1));

      await updateDoc(productRef, {
        reviewCount: newCount,
        rating: newRating
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    throw error;
  }
}

// Toggle review likes
export async function toggleLikeReview(reviewId: string, userId: string): Promise<{ likes: number; likedBy: string[] }> {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    let updatedLikedBy: string[] = [];
    let likes = 0;

    await runTransaction(db, async (transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      if (!reviewDoc.exists()) {
        throw new Error("Review does not exist!");
      }
      const review = reviewDoc.data() as Review;
      const currentLikedBy = review.likedBy || [];
      if (currentLikedBy.includes(userId)) {
        updatedLikedBy = currentLikedBy.filter(id => id !== userId);
      } else {
        updatedLikedBy = [...currentLikedBy, userId];
      }
      likes = updatedLikedBy.length;
      transaction.update(reviewRef, {
        likedBy: updatedLikedBy,
        likes: likes
      });
    });

    return { likes, likedBy: updatedLikedBy };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}`);
    throw error;
  }
}

// Get all reviews across all products
export async function getAllReviews(): Promise<Review[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'reviews'));
    const list: Review[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as Review);
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reviews');
    return [];
  }
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    if (!reviewSnap.exists()) return;

    const review = reviewSnap.data() as Review;
    await deleteDoc(reviewRef);

    if (review.approved) {
      const productRef = doc(db, 'products', review.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const product = productSnap.data() as Product;
        const currentCount = product.reviewCount || 0;
        const currentRating = product.rating || 0;

        if (currentCount <= 1) {
          await updateDoc(productRef, { reviewCount: 0, rating: 5.0 });
        } else {
          const newCount = currentCount - 1;
          const newRating = Number(((currentRating * currentCount - review.rating) / newCount).toFixed(1));
          await updateDoc(productRef, { reviewCount: newCount, rating: newRating });
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
    throw error;
  }
}

// Get product reviews
export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    const list: Review[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as Review);
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reviews');
    return [];
  }
}

// Create order
export async function createOrder(orderInput: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  try {
    const orderId = `ord-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      ...orderInput,
      id: orderId,
      createdAt: Date.now()
    };

    await setDoc(doc(db, 'orders', orderId), newOrder);

    // Update product stocks & create logs
    for (const item of newOrder.items) {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const product = productSnap.data() as Product;
        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        await updateDoc(productRef, { stock: newStock });

        // Write inventory log
        await addInventoryLog({
          productId: item.productId,
          productName: product.name,
          changeType: 'purchase',
          quantityChanged: -item.quantity,
          oldStock: currentStock,
          newStock: newStock,
          notes: `Sold via Order #${newOrder.id}. Customer: ${newOrder.shippingAddress.fullName}`
        });
      }
    }

    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'orders');
    throw error;
  }
}

// Get user orders
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const list: Order[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as Order);
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
    return [];
  }
}

// User Profile Operations
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function createUserProfile(uid: string, profile: Omit<UserProfile, 'uid' | 'createdAt' | 'wishlist'>): Promise<UserProfile> {
  try {
    const emailLower = profile.email?.toLowerCase();
    const isEmailAdmin = emailLower === 'itxmerajkhan3109@gmail.com' || emailLower === 'merajkhan3109@gmail.com';

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const existingWishlist = userSnap.exists() ? (userSnap.data() as UserProfile).wishlist || [] : [];

    const newUserProfile: UserProfile = {
      ...profile,
      uid,
      createdAt: Date.now(),
      wishlist: existingWishlist,
      role: isEmailAdmin ? 'admin' : 'user'
    };

    await setDoc(userRef, newUserProfile);
    return newUserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
    throw error;
  }
}

export async function updateUserProfileRole(uid: string, role: 'admin' | 'user'): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function toggleWishlist(uid: string, productId: string): Promise<string[]> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    let updatedWishlist: string[] = [];

    if (!userSnap.exists()) {
      updatedWishlist = [productId];
      const newUser: UserProfile = {
        uid,
        email: '',
        displayName: 'Collector',
        photoURL: '',
        createdAt: Date.now(),
        wishlist: updatedWishlist,
        role: 'user'
      };
      await setDoc(userRef, newUser);
    } else {
      const user = userSnap.data() as UserProfile;
      const currentWishlist = user.wishlist || [];
      if (currentWishlist.includes(productId)) {
        updatedWishlist = currentWishlist.filter(id => id !== productId);
        await updateDoc(userRef, { wishlist: arrayRemove(productId) });
      } else {
        updatedWishlist = [...currentWishlist, productId];
        await updateDoc(userRef, { wishlist: arrayUnion(productId) });
      }
    }

    return updatedWishlist;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    throw error;
  }
}

// Admin Product Editing
export async function addProduct(product: Product): Promise<void> {
  try {
    const enriched = enrichProduct(product);
    await setDoc(doc(db, 'products', enriched.id), enriched);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `products/${product.id}`);
    throw error;
  }
}

export async function updateProduct(id: string, updatedProduct: Partial<Product>): Promise<void> {
  try {
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const merged = enrichProduct({ ...productSnap.data() as Product, ...updatedProduct });
      await setDoc(productRef, merged);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    throw error;
  }
}

// Orders management
export async function getAllOrders(): Promise<Order[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    const list: Order[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as Order);
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
    return [];
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const docSnap = await getDoc(doc(db, 'orders', id));
    if (docSnap.exists()) {
      return docSnap.data() as Order;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `orders/${id}`);
    return null;
  }
}

export async function updateOrderStatus(orderId: string, status: Order['orderStatus']): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), { orderStatus: status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    throw error;
  }
}

export async function updateOrder(orderId: string, updatedFields: Partial<Order>): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), updatedFields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    throw error;
  }
}

// User Profiles List
export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as UserProfile);
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

// Inventory Logs
export async function addInventoryLog(logInput: Omit<InventoryLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newLog: InventoryLog = {
      ...logInput,
      id,
      timestamp: Date.now()
    };
    await setDoc(doc(db, 'inventoryLogs', id), newLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'inventoryLogs');
  }
}

export async function getInventoryLogs(): Promise<InventoryLog[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'inventoryLogs'));
    const list: InventoryLog[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as InventoryLog);
    });
    return list.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'inventoryLogs');
    return [];
  }
}

// Increment Product Views
export async function incrementProductViews(productId: string): Promise<void> {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, { views: increment(1) });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
  }
}

// Newsletter subscription helpers
export async function addNewsletterSubscriber(email: string): Promise<void> {
  try {
    const id = `sub-${Date.now()}`;
    await setDoc(doc(db, 'subscribers', id), { email, createdAt: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'subscribers');
  }
}

// Contacts form submission helpers
export async function addContactMessage(contact: { name: string; email: string; subject?: string; message: string }): Promise<void> {
  try {
    const id = `msg-${Date.now()}`;
    await setDoc(doc(db, 'contacts', id), { ...contact, id, createdAt: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'contacts');
  }
}

// PubSub Subscribers
export function subscribeProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: any) => void
): () => void {
  // First run seeding in background if needed
  seedProductsIfEmpty().then((items) => {
    onUpdate(items);
  }).catch(err => {
    if (onError) onError(err);
  });

  return onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Product);
      });
      if (list.length > 0) {
        onUpdate(list.map(enrichProduct));
      }
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeProduct(
  id: string,
  onUpdate: (product: Product | null) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    doc(db, 'products', id),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(enrichProduct(docSnap.data() as Product));
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeProductReviews(
  productId: string,
  onUpdate: (reviews: Review[]) => void,
  onError?: (err: any) => void
): () => void {
  const q = query(collection(db, 'reviews'), where('productId', '==', productId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Review[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Review);
      });
      onUpdate(list.sort((a, b) => b.createdAt - a.createdAt));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeUserOrders(
  userId: string,
  onUpdate: (orders: Order[]) => void,
  onError?: (err: any) => void
): () => void {
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Order);
      });
      onUpdate(list.sort((a, b) => b.createdAt - a.createdAt));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeUserProfile(
  uid: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    doc(db, 'users', uid),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAllOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    collection(db, 'orders'),
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Order);
      });
      onUpdate(list.sort((a, b) => b.createdAt - a.createdAt));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAllReviews(
  onUpdate: (reviews: Review[]) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    collection(db, 'reviews'),
    (snapshot) => {
      const list: Review[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Review);
      });
      onUpdate(list.sort((a, b) => b.createdAt - a.createdAt));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeInventoryLogs(
  onUpdate: (logs: InventoryLog[]) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    collection(db, 'inventoryLogs'),
    (snapshot) => {
      const list: InventoryLog[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as InventoryLog);
      });
      onUpdate(list.sort((a, b) => b.timestamp - a.timestamp));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAllUserProfiles(
  onUpdate: (profiles: UserProfile[]) => void,
  onError?: (err: any) => void
): () => void {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as UserProfile);
      });
      onUpdate(list.sort((a, b) => b.createdAt - a.createdAt));
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}
