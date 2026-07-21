/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded ${className}`}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col space-y-4">
      {/* Product Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 rounded-lg animate-pulse" />
      
      {/* Product Info */}
      <div className="space-y-2">
        <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 animate-pulse" />
        <div className="h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 animate-pulse" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};
