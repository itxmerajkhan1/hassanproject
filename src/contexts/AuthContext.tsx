/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { getUserProfile, createUserProfile, toggleWishlist as dbToggleWishlist, subscribeUserProfile, updateUserProfileRole } from '../services/dbService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  wishlist: string[];
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  toggleWishlistItem: (productId: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const profileUnsubRef = useRef<(() => void) | null>(null);

  // Secure admin detection: check if email is the allowed admin email AND role is admin in Firestore
  const isAdmin = user ? (user.email?.toLowerCase() === 'itxmerajkhan3109@gmail.com' && profile?.role === 'admin') : false;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Unsubscribe from any previous profile subscription
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      setUser(currentUser);
      if (currentUser) {
        try {
          // Setup real-time listener for user profile
          profileUnsubRef.current = subscribeUserProfile(currentUser.uid, async (userProfile) => {
            if (!userProfile) {
              // Create profile if it does not exist
              const created = await createUserProfile(currentUser.uid, {
                email: currentUser.email || '',
                displayName: currentUser.displayName || 'Guest User',
                photoURL: currentUser.photoURL || ''
              });
              setProfile(created);
              setWishlist(created.wishlist || []);
            } else {
              // Auto-assign admin role in Firestore if email matches and it's not yet admin
              if (currentUser.email?.toLowerCase() === 'itxmerajkhan3109@gmail.com' && userProfile.role !== 'admin') {
                try {
                  await updateUserProfileRole(currentUser.uid, 'admin');
                } catch (e) {
                  console.error('Failed to set admin role in Firestore:', e);
                }
              }
              setProfile(userProfile);
              setWishlist(userProfile.wishlist || []);
            }
          });
        } catch (error) {
          console.error('Error setting up real-time profile listener:', error);
        }
      } else {
        setProfile(null);
        setWishlist([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const createdUser = userCredential.user;
      
      // Update Auth Profile
      await updateProfile(createdUser, { displayName: name });
      
      // Create Firestore Profile
      const userProfile = await createUserProfile(createdUser.uid, {
        email,
        displayName: name,
        photoURL: ""
      });
      
      setUser(createdUser);
      setProfile(userProfile);
      setWishlist([]);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const signedInUser = userCredential.user;
      
      // Fetch user profile
      const userProfile = await getUserProfile(signedInUser.uid);
      if (userProfile) {
        setProfile(userProfile);
        setWishlist(userProfile.wishlist || []);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setWishlist([]);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlistItem = async (productId: string) => {
    if (!user) {
      throw new Error('Please sign in to add items to your wishlist.');
    }
    try {
      const updatedList = await dbToggleWishlist(user.uid, productId);
      setWishlist(updatedList);
      if (profile) {
        setProfile({ ...profile, wishlist: updatedList });
      }
    } catch (error) {
      console.error('Error toggling wishlist item:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        wishlist,
        signUp,
        signIn,
        signOut,
        toggleWishlistItem,
        isAdmin: !!isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
