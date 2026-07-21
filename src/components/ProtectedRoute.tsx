import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-transparent">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-neutral-950 dark:border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">Verifying security level...</span>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to profile/login page
  if (!user) {
    return <Navigate to="/profile" replace />;
  }

  // If logged in but not an admin, show a beautiful "Access Denied" page
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-white dark:bg-[#0A0A0A] transition-colors duration-300">
        <div className="max-w-md w-full text-center space-y-8 p-10 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/50 rounded-3xl shadow-xl">
          <div className="inline-flex p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl">
            <ShieldAlert className="w-10 h-10" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-xl font-bold font-sans tracking-tight text-neutral-950 dark:text-white">
              Access Denied
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
              Unauthorized access attempt. The Executive Administration Console is restricted to authorized credentials only. Your account (<span className="font-mono text-red-500">{user.email}</span>) does not possess administrator privileges.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold font-mono transition-all hover:opacity-90 shadow-md"
            >
              <Home className="w-4 h-4" />
              <span>RETURN HOME</span>
            </a>
            <a
              href="/profile"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-850 text-neutral-700 dark:text-neutral-300 text-xs font-bold font-mono transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>CLIENT PROFILE</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If logged in and admin, render the children component
  return children;
};
