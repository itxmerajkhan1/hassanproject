/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { 
  getUserProfile, 
  createUserProfile, 
  toggleWishlist as dbToggleWishlist, 
  subscribeUserProfile,
  updateUserProfileRole
} from '../services/dbService';

export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: MockUser | null;
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
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Secure admin detection
  const isAdmin = user ? (
    (user.email?.toLowerCase() === 'itxmerajkhan3109@gmail.com' || user.email?.toLowerCase() === 'merajkhan3109@gmail.com') && 
    profile?.role === 'admin'
  ) : false;

  const profileUnsubscribeRef = useRef<(() => void) | null>(null);

  // Track Auth State from Firebase and load corresponding profile document atomicly
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up any existing profile listener from a previous session
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }

      if (firebaseUser) {
        try {
          const emailLower = firebaseUser.email?.toLowerCase();
          const isEmailAdmin = emailLower === 'itxmerajkhan3109@gmail.com' || emailLower === 'merajkhan3109@gmail.com';

          // 1. Get or create profile first
          let currentProfile = await getUserProfile(firebaseUser.uid);
          if (!currentProfile) {
            currentProfile = await createUserProfile(firebaseUser.uid, {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Collector',
              photoURL: firebaseUser.photoURL || ''
            });
          }

          // 2. Auto-assign admin role in Firestore if email matches and role is not yet admin
          if (isEmailAdmin && currentProfile?.role !== 'admin') {
            await updateUserProfileRole(firebaseUser.uid, 'admin');
            currentProfile.role = 'admin';
          }

          // 3. Set profile, user and wishlist states
          setProfile(currentProfile);
          setWishlist(currentProfile?.wishlist || []);

          const mappedUser: MockUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          };
          setUser(mappedUser);

          // 4. Start real-time subscription for profile changes
          const unsubProfile = subscribeUserProfile(
            firebaseUser.uid,
            (updatedProfile) => {
              if (updatedProfile) {
                setProfile(updatedProfile);
                setWishlist(updatedProfile.wishlist || []);
              }
            },
            (error) => {
              console.error("Real-time profile sync error:", error);
            }
          );
          profileUnsubscribeRef.current = unsubProfile;

        } catch (err) {
          console.error("Error synchronizing profile details:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setWishlist([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const emailLower = email.trim().toLowerCase();
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
      
      // 2. Set Auth display name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // 3. Create Firestore User Profile
      await createUserProfile(userCredential.user.uid, {
        email: emailLower,
        displayName: name,
        photoURL: ""
      });

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
      const emailLower = email.trim().toLowerCase();
      await signInWithEmailAndPassword(auth, emailLower, password);
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
