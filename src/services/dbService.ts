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
import { db, storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product, Review, Order, UserProfile, InventoryLog, HeroBanner } from '../types';
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
  };
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null
    }
  };
  console.warn(`Firestore notice during ${operationType} on [${path}]:`, JSON.stringify(errInfo));
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
      const email = auth.currentUser?.email?.toLowerCase();
      const isDesignatedAdmin = email === 'itxmerajkhan3109@gmail.com' || email === 'merajkhan3109@gmail.com';
      if (auth.currentUser && isDesignatedAdmin) {
        console.log('Seeding products to Firestore...');
        for (const p of initialProducts) {
          const enriched = enrichProduct(p);
          try {
            await setDoc(doc(db, 'products', enriched.id), enriched);
          } catch (writeErr) {
            console.warn('Could not write product during seed (permissions):', writeErr);
          }
        }
      }
      return initialProducts.map(enrichProduct);
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

// Fetch all products
export async function getProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    if (querySnapshot.empty) {
      return initialProducts.map(enrichProduct);
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
    const orderId = `ord-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderInput,
      id: orderId,
      createdAt: Date.now()
    };

    await setDoc(doc(db, 'orders', orderId), newOrder);

    // Save recent order locally so guest user can always track their order in this session
    try {
      const recentOrdersJson = localStorage.getItem('nayab_recent_orders');
      const recentOrders: Order[] = recentOrdersJson ? JSON.parse(recentOrdersJson) : [];
      recentOrders.unshift(newOrder);
      localStorage.setItem('nayab_recent_orders', JSON.stringify(recentOrders.slice(0, 10)));
    } catch {
      // ignore localStorage quota errors
    }

    // Update product stocks & create logs if administrator is authenticated
    const currentUserEmail = auth.currentUser?.email?.toLowerCase();
    const isOrderAdmin = currentUserEmail === 'itxmerajkhan3109@gmail.com' || currentUserEmail === 'merajkhan3109@gmail.com';
    if (auth.currentUser && isOrderAdmin) {
      for (const item of newOrder.items) {
        try {
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
        } catch (stockErr) {
          console.warn('Inventory log/stock update note:', stockErr);
        }
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

// Admin Registry & Role Management
export async function ensureAdminRecord(uid: string, email: string): Promise<void> {
  try {
    await setDoc(doc(db, 'admins', uid), {
      uid,
      email: email.toLowerCase(),
      role: 'admin',
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn("Could not sync admins document (rules or offline):", err);
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

    if (isEmailAdmin) {
      await ensureAdminRecord(uid, emailLower || '');
    }

    return newUserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
    throw error;
  }
}

export async function updateUserProfileRole(uid: string, role: 'admin' | 'user'): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), { role });
    if (role === 'admin') {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const email = userDoc.exists() ? (userDoc.data() as UserProfile).email : '';
      await ensureAdminRecord(uid, email);
    } else {
      try {
        await deleteDoc(doc(db, 'admins', uid));
      } catch (err) {
        console.warn("Could not remove admins record:", err);
      }
    }
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
    let baseProduct: Product;
    if (productSnap.exists()) {
      baseProduct = productSnap.data() as Product;
    } else {
      const fallback = initialProducts.find(p => p.id === id);
      baseProduct = fallback ? enrichProduct(fallback) : enrichProduct(initialProducts[0]);
    }
    const merged = enrichProduct({ ...baseProduct, ...updatedProduct, id });
    await setDoc(productRef, merged);
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
  // Pre-feed initial products so the catalog immediately renders
  onUpdate(initialProducts.map(enrichProduct));

  // Run seeding in background only if a verified admin is authenticated
  const email = auth.currentUser?.email?.toLowerCase();
  const isDesignatedAdmin = email === 'itxmerajkhan3109@gmail.com' || email === 'merajkhan3109@gmail.com';
  if (auth.currentUser && isDesignatedAdmin) {
    seedProductsIfEmpty().then((items) => {
      if (items.length > 0) onUpdate(items);
    }).catch(err => {
      console.warn('Background seed note:', err);
    });
  }

  return onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Product);
      });
      if (list.length > 0) {
        onUpdate(list.map(enrichProduct));
      } else {
        onUpdate(initialProducts.map(enrichProduct));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      onUpdate(initialProducts.map(enrichProduct));
      if (onError) onError(error);
    }
  );
}

export function subscribeProduct(
  id: string,
  onUpdate: (product: Product | null) => void,
  onError?: (err: any) => void
): () => void {
  // Pre-seed matching initial product
  const defaultProduct = initialProducts.find(p => p.id === id);
  if (defaultProduct) {
    onUpdate(enrichProduct(defaultProduct));
  }

  return onSnapshot(
    doc(db, 'products', id),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(enrichProduct(docSnap.data() as Product));
      } else {
        const fallback = initialProducts.find(p => p.id === id);
        onUpdate(fallback ? enrichProduct(fallback) : null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `products/${id}`);
      const fallback = initialProducts.find(p => p.id === id);
      onUpdate(fallback ? enrichProduct(fallback) : null);
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
      handleFirestoreError(error, OperationType.LIST, `reviews?productId=${productId}`);
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
      handleFirestoreError(error, OperationType.LIST, `orders?userId=${userId}`);
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
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
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
      handleFirestoreError(error, OperationType.LIST, 'orders');
      onUpdate([]);
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
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      onUpdate([]);
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
      handleFirestoreError(error, OperationType.LIST, 'inventoryLogs');
      onUpdate([]);
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
      handleFirestoreError(error, OperationType.LIST, 'users');
      onUpdate([]);
      if (onError) onError(error);
    }
  );
}

// ==========================================
// DYNAMIC HERO BANNER MANAGEMENT (FIREBASE)
// ==========================================

export const initialHeroBanners: HeroBanner[] = [
  {
    id: "banner-1",
    heading: "Sartorial Needlework",
    subheading: "Unstitched Chiffon Edit",
    tagline: "Bespoke Atelier Collection",
    description: "Meticulously woven zari and delicate gold embroidery on sheer, floating silks.",
    button1Text: "Shop Unstitched",
    button1Url: "/shop?category=Unstitched",
    button2Text: "Atelier Catalog",
    button2Url: "/shop",
    bgImageDesktop: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&auto=format&fit=crop&q=80",
    bgImageTablet: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=80",
    bgImageMobile: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80",
    overlayOpacity: 0.5,
    overlayColor: "#0a0a0a",
    textAlignment: "left",
    textColor: "white",
    button1Style: "primary",
    button2Style: "outline",
    isActive: true,
    order: 0,
    seoTitle: "Unstitched Chiffon Sartorial Needlework Banner",
    seoAltText: "Fine gold zari embroidery on unstitched chiffon silk fabric",
    seoDescription: "Explore NAYAB FIT unstitched chiffon silk collections with bespoke needlework.",
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000
  },
  {
    id: "banner-2",
    heading: "Pure Silk Pret",
    subheading: "Premium Ready-To-Wear",
    tagline: "Effortless Modern Silhouettes",
    description: "Effortless, contemporary silhouettes draped from biological linens and fluid Italian satin.",
    button1Text: "Explore Pret",
    button1Url: "/shop?category=Pret",
    button2Text: "View Lookbook",
    button2Url: "/shop",
    bgImageDesktop: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=1600&auto=format&fit=crop&q=80",
    bgImageTablet: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=1000&auto=format&fit=crop&q=80",
    bgImageMobile: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=800&auto=format&fit=crop&q=80",
    overlayOpacity: 0.45,
    overlayColor: "#050505",
    textAlignment: "left",
    textColor: "white",
    button1Style: "primary",
    button2Style: "outline",
    isActive: true,
    order: 1,
    seoTitle: "Pure Silk Pret Ready-To-Wear Hero Banner",
    seoAltText: "Luxury Italian satin and silk pret ready to wear couture outfit",
    seoDescription: "Shop high-end silk pret ready to wear collection from NAYAB FIT.",
    createdAt: Date.now() - 80000,
    updatedAt: Date.now() - 80000
  },
  {
    id: "banner-3",
    heading: "Wedding Heritage",
    subheading: "The Evening Bridal Edit",
    tagline: "Heirloom Crimson Jamawar",
    description: "Heavy hand-embellished zardozi and crystalline details on crimson jamawar fabrics.",
    button1Text: "View Wedding Wear",
    button1Url: "/shop?category=Wedding",
    button2Text: "Private Consultation",
    button2Url: "/contact",
    bgImageDesktop: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1600&auto=format&fit=crop&q=80",
    bgImageTablet: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80",
    bgImageMobile: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    overlayOpacity: 0.55,
    overlayColor: "#1a0407",
    textAlignment: "left",
    textColor: "white",
    button1Style: "gold",
    button2Style: "outline",
    isActive: true,
    order: 2,
    seoTitle: "Wedding Heritage Bridal Edit Hero Banner",
    seoAltText: "Crimson jamawar bridal suit with heavy gold zardozi embroidery",
    seoDescription: "Discover NAYAB FIT bridal and wedding collection with exquisite hand embroidery.",
    createdAt: Date.now() - 60000,
    updatedAt: Date.now() - 60000
  }
];

export async function seedHeroBannersIfEmpty(): Promise<HeroBanner[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'heroBanners'));
    if (querySnapshot.empty) {
      const email = auth.currentUser?.email?.toLowerCase();
      const isDesignatedAdmin = email === 'itxmerajkhan3109@gmail.com' || email === 'merajkhan3109@gmail.com';
      if (auth.currentUser && isDesignatedAdmin) {
        console.log('Seeding initial hero banners to Firestore...');
        for (const banner of initialHeroBanners) {
          try {
            await setDoc(doc(db, 'heroBanners', banner.id), banner);
          } catch (writeErr) {
            console.warn('Could not write banner during seed (permissions):', writeErr);
          }
        }
      }
      return initialHeroBanners;
    }
    const list: HeroBanner[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as HeroBanner);
    });
    return list.sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'heroBanners');
    return initialHeroBanners;
  }
}

export async function getHeroBanners(activeOnly = false): Promise<HeroBanner[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'heroBanners'));
    if (querySnapshot.empty) {
      return initialHeroBanners.filter(b => !activeOnly || b.isActive);
    }
    let list: HeroBanner[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as HeroBanner);
    });
    
    list.sort((a, b) => a.order - b.order);

    if (activeOnly) {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter(banner => {
        if (!banner.isActive) return false;
        if (banner.startDate && banner.startDate > today) return false;
        if (banner.endDate && banner.endDate < today) return false;
        return true;
      });
    }

    return list.length > 0 ? list : initialHeroBanners.filter(b => !activeOnly || b.isActive);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'heroBanners');
    return initialHeroBanners.filter(b => !activeOnly || b.isActive);
  }
}

export function subscribeHeroBanners(
  onUpdate: (banners: HeroBanner[]) => void,
  onError?: (err: any) => void
): () => void {
  // Pre-feed with initial banners so hero is never missing or blank
  onUpdate(initialHeroBanners);

  const email = auth.currentUser?.email?.toLowerCase();
  const isDesignatedAdmin = email === 'itxmerajkhan3109@gmail.com' || email === 'merajkhan3109@gmail.com';
  if (auth.currentUser && isDesignatedAdmin) {
    seedHeroBannersIfEmpty().catch(err => {
      console.warn('Banner background seed note:', err);
    });
  }

  return onSnapshot(
    collection(db, 'heroBanners'),
    (snapshot) => {
      const list: HeroBanner[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as HeroBanner);
      });
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      onUpdate(list.length > 0 ? list : initialHeroBanners);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'heroBanners');
      onUpdate(initialHeroBanners);
      if (onError) onError(error);
    }
  );
}

export async function addHeroBanner(
  bannerData: Omit<HeroBanner, 'id' | 'createdAt' | 'updatedAt'>
): Promise<HeroBanner> {
  try {
    const id = `banner-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();
    const newBanner: HeroBanner = {
      ...bannerData,
      id,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(db, 'heroBanners', id), newBanner);
    return newBanner;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'heroBanners');
    throw error;
  }
}

export async function updateHeroBanner(
  id: string,
  updatedFields: Partial<HeroBanner>
): Promise<void> {
  try {
    const bannerRef = doc(db, 'heroBanners', id);
    const bannerSnap = await getDoc(bannerRef);
    let baseBanner: HeroBanner;
    if (bannerSnap.exists()) {
      baseBanner = bannerSnap.data() as HeroBanner;
    } else {
      const fallback = initialHeroBanners.find(b => b.id === id);
      baseBanner = fallback || initialHeroBanners[0];
    }
    const merged: HeroBanner = {
      ...baseBanner,
      ...updatedFields,
      id,
      updatedAt: Date.now()
    };
    await setDoc(bannerRef, merged);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `heroBanners/${id}`);
    throw error;
  }
}

export async function deleteHeroBanner(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'heroBanners', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `heroBanners/${id}`);
    throw error;
  }
}

export async function duplicateHeroBanner(banner: HeroBanner): Promise<HeroBanner> {
  try {
    const newId = `banner-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = Date.now();
    const duplicated: HeroBanner = {
      ...banner,
      id: newId,
      heading: `${banner.heading} (Copy)`,
      order: banner.order + 1,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(db, 'heroBanners', newId), duplicated);
    return duplicated;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'heroBanners');
    throw error;
  }
}

export async function reorderHeroBanners(banners: HeroBanner[]): Promise<void> {
  try {
    for (let index = 0; index < banners.length; index++) {
      const banner = banners[index];
      await setDoc(doc(db, 'heroBanners', banner.id), {
        ...banner,
        order: index,
        updatedAt: Date.now()
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'heroBanners');
    throw error;
  }
}

export async function uploadHeroBannerMedia(
  file: File,
  folderName = 'hero-banners'
): Promise<string> {
  try {
    const sanitizeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fileName = `${folderName}/${Date.now()}_${sanitizeFileName}`;
    const storageRef = ref(storage, fileName);
    
    // Upload file bytes to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.warn("Firebase Storage upload fallback triggered (using Data URL):", error);
    // Convert to Base64 data URL as immediate fallback
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}
