/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  MessageSquare, 
  Loader2, 
  Check, 
  ThumbsUp, 
  Camera, 
  X, 
  SlidersHorizontal, 
  Sparkles, 
  EyeOff, 
  Calendar,
  AlertCircle,
  ThumbsDown,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Review, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  addProductReview, 
  getProductReviews, 
  checkUserVerifiedPurchase, 
  toggleLikeReview,
  subscribeProductReviews
} from '../services/dbService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewSectionProps {
  product: Product;
  onReviewAdded: () => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ product, onReviewAdded }) => {
  const { user, profile, isAdmin } = useAuth();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  
  // New Review Form State
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Filtering & Sorting State
  const [starFilter, setStarFilter] = useState<string>('All');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [hasPhotosOnly, setHasPhotosOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');

  // Fullscreen Image Modal
  const [selectedModalImage, setSelectedModalImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    // Check if the current user has verified purchase for this product
    const checkPurchaseStatus = async () => {
      if (user) {
        const purchased = await checkUserVerifiedPurchase(user.uid, product.id);
        if (active) setIsVerified(purchased);
      } else {
        if (active) setIsVerified(false);
      }
    };

    checkPurchaseStatus();

    // Subscribe to reviews in real-time
    const unsubscribe = subscribeProductReviews(
      product.id,
      (fetchedReviews) => {
        if (active) {
          setReviews(fetchedReviews);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error with real-time reviews subscription:', err);
        if (active) setLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [product.id, user]);

  // Handle image files selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      if (photos.length + filesArray.length > 3) {
        toast.error("You can upload a maximum of 3 photos.");
        return;
      }

      filesArray.forEach(file => {
        if (!file.type.startsWith('image/')) {
          toast.error("Only image files are allowed.");
          return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast.error(`"${file.name}" is larger than 2MB limit.`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Submit review handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to write a product review.");
      return;
    }

    if (!comment.trim()) {
      toast.error("Review comment cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const reviewPayload = {
        productId: product.id,
        userId: user.uid,
        userName: profile?.displayName || user.email || 'Anonymous Collector',
        rating,
        comment: comment.trim(),
        isVerifiedPurchase: isVerified,
        images: photos,
        likes: 0,
        likedBy: [],
        approved: false // Set to false to enforce Admin Approval workflow
      };

      await addProductReview(product.id, reviewPayload);

      toast.success("Review submitted! Pending administrator moderation approval.", {
        icon: '⏳',
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });

      // Reset form states
      setComment('');
      setRating(5);
      setPhotos([]);

      onReviewAdded();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Liking a review
  const handleLikeReview = async (reviewId: string) => {
    if (!user) {
      toast.error("Please sign in to vote reviews as helpful.");
      return;
    }

    try {
      const result = await toggleLikeReview(reviewId, user.uid);
      setReviews(prev => 
        prev.map(r => r.id === reviewId ? { ...r, likes: result.likes, likedBy: result.likedBy } : r)
      );
      toast.success("Thanks for your helpfulness feedback!", { id: "like-toast", duration: 1200 });
    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error("Unable to update helpfulness status.");
    }
  };

  // Filter reviews: General public sees only approved. Owners of unapproved reviews see theirs as pending. Admins see all.
  const visibleReviews = reviews.filter(r => {
    // 1. Authorization check
    const isOwner = user && r.userId === user.uid;
    const isApprovedOrVisible = r.approved || isOwner || isAdmin;
    if (!isApprovedOrVisible) return false;

    // 2. Star filter
    if (starFilter !== 'All' && r.rating !== parseInt(starFilter)) return false;

    // 3. Verified filter
    if (verifiedOnly && !r.isVerifiedPurchase) return false;

    // 4. Has Photos filter
    if (hasPhotosOnly && (!r.images || r.images.length === 0)) return false;

    return true;
  });

  // Sort visible reviews
  const sortedReviews = [...visibleReviews].sort((a, b) => {
    if (sortBy === 'helpful') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return b.createdAt - a.createdAt;
  });

  // Approved reviews strictly for public rating calculations
  const approvedReviews = reviews.filter(r => r.approved);
  const approvedCount = approvedReviews.length;

  const currentAverageRating = approvedCount > 0
    ? Number((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedCount).toFixed(1))
    : 5.0;

  // Rating breakdown for APPROVED reviews
  const distribution = [0, 0, 0, 0, 0];
  approvedReviews.forEach(r => {
    const starIdx = Math.max(1, Math.min(5, Math.floor(r.rating))) - 1;
    distribution[starIdx]++;
  });

  return (
    <div className="space-y-12">
      
      {/* Summary Matrix Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-t border-b border-gray-100 py-10">
        
        {/* Left: Star Rating Aggregation */}
        <div className="text-center md:text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">
            Approved Average Score
          </p>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-5xl font-bold text-gray-900 font-sans tracking-tight">
              {approvedCount > 0 ? currentAverageRating : product.rating}
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(approvedCount > 0 ? currentAverageRating : product.rating) ? 'fill-current text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Based on {approvedCount} approved reviews
              </p>
            </div>
          </div>
        </div>

        {/* Right: Stars Breakdown Progress Bars */}
        <div className="md:col-span-2 space-y-2.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars - 1];
            const percentage = approvedCount > 0 ? (count / approvedCount) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-gray-500 font-semibold flex items-center justify-end gap-1 font-mono">
                  {stars} <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-gray-400 font-mono">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Review Interactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Side: Create a Review Form (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-gray-900 font-sans tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Collector Evaluations
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              MK Fashion is built on bespoke quality. Post your evaluation to advise tailoring, fitting, and cloth choices for our worldwide community.
            </p>
          </div>

          {user ? (
            <form onSubmit={handleSubmitReview} className="space-y-5 bg-neutral-50/50 border border-gray-150/80 rounded-2xl p-5 sm:p-6">
              
              {/* Star Rating Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase font-mono block">
                  Select Rating Score
                </label>
                <div className="flex items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoveredRating(s)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= (hoveredRating ?? rating) ? 'fill-current text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-neutral-500 ml-2">
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Fair' : 'Poor'}
                  </span>
                </div>
              </div>

              {/* Verified Badge Check (Real-time feedback) */}
              {isVerified ? (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 font-mono">
                  <Check className="w-3.5 h-3.5" />
                  Verified Purchase Badge Active
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-neutral-100/70 px-3 py-1.5 rounded-xl border border-neutral-200/50 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                  Regular Review (No verified order matched)
                </div>
              )}

              {/* Text Area */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase font-mono block">
                  Your Review
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the dress drape, fabric feel, fitting precision, or aesthetic drapes..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-neutral-800 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-neutral-800 transition-colors"
                />
              </div>

              {/* Drag-n-drop or File Photo selector (Max 3) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase font-mono block">
                  Attach Photo Showcase (Max 3)
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2.5">
                  {/* Photo Upload Trigger Button */}
                  {photos.length < 3 && (
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="w-16 h-16 rounded-xl border border-dashed border-gray-300 hover:border-black hover:bg-neutral-50 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-black transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-[9px] font-semibold font-mono uppercase">Add</span>
                    </button>
                  )}

                  {/* Upload Previews */}
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-150 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 font-mono">Images must be less than 2MB.</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-neutral-800 text-white font-mono text-[11px] font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    SUBMITTING MODERATION...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" />
                    SUBMIT REVIEW FOR APPROVAL
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-neutral-50/70 border border-gray-150 rounded-2xl p-6 text-center space-y-3">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide font-sans">Write an evaluation</h4>
                <p className="text-xs text-gray-400 max-w-[220px] mx-auto leading-relaxed">
                  Please log in to your collector profile to upload review photos, and provide stars.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active Reviews List + Filters (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Filters Controls Box */}
          <div className="bg-neutral-50 rounded-2xl p-4 sm:p-5 border border-neutral-150/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">
                Refine Assessment Journals
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              {/* Star Rating Select filter */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">By Star Score</span>
                <select
                  value={starFilter}
                  onChange={(e) => setStarFilter(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-lg px-2 py-1.5 outline-none font-semibold text-gray-700 font-mono text-xs cursor-pointer"
                >
                  <option value="All">All Scores</option>
                  <option value="5">5 Stars only</option>
                  <option value="4">4 Stars only</option>
                  <option value="3">3 Stars only</option>
                  <option value="2">2 Stars only</option>
                  <option value="1">1 Star only</option>
                </select>
              </div>

              {/* Sort filter dropdown */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">Ordering Priority</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-white border border-gray-200 focus:border-black rounded-lg px-2 py-1.5 outline-none font-semibold text-gray-700 font-mono text-xs cursor-pointer"
                >
                  <option value="recent">Most Recent Date</option>
                  <option value="helpful">Helpfulness Votes</option>
                </select>
              </div>
            </div>

            {/* Checkbox Quick filters */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-600 font-mono text-[11px]">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-3.5 h-3.5 accent-black rounded border-gray-300"
                />
                Verified Purchases Only
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-600 font-mono text-[11px]">
                <input
                  type="checkbox"
                  checked={hasPhotosOnly}
                  onChange={(e) => setHasPhotosOnly(e.target.checked)}
                  className="w-3.5 h-3.5 accent-black rounded border-gray-300"
                />
                With Photo Showcases
              </label>
            </div>
          </div>

          {/* Active Reviews Render Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase font-mono tracking-wider">
                Assessments ({sortedReviews.length})
              </h3>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : sortedReviews.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl py-12 px-6 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-neutral-200 mx-auto" />
                <p className="text-xs text-gray-400 italic">No reviews match the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-5 divide-y divide-gray-100/80">
                {sortedReviews.map((rev, index) => {
                  const hasLiked = user && rev.likedBy?.includes(user.uid);
                  
                  return (
                    <div key={rev.id} className={`space-y-3 ${index > 0 ? 'pt-5' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 font-sans leading-tight">
                              {rev.userName}
                            </p>
                            
                            {/* Verified badge */}
                            {rev.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase">
                                <Check className="w-2.5 h-2.5" /> Verified
                              </span>
                            )}

                            {/* Pending approval badge */}
                            {!rev.approved && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-100 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase">
                                <EyeOff className="w-2.5 h-2.5" /> Pending Approval
                              </span>
                            )}
                          </div>

                          {/* Star output */}
                          <div className="flex items-center text-amber-400 py-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current text-amber-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Date info */}
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-300" />
                          {new Date(rev.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans whitespace-pre-line">
                        {rev.comment}
                      </p>

                      {/* Attached Review Photo Previews inside the review item */}
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex gap-2.5 pt-1">
                          {rev.images.map((imgUrl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedModalImage(imgUrl)}
                              className="w-14 h-14 rounded-lg overflow-hidden border border-gray-150 hover:border-black hover:shadow-sm transition-all flex-shrink-0 cursor-zoom-in"
                            >
                              <img src={imgUrl} alt="Attached Showcase" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Interaction Actions Bar */}
                      <div className="flex items-center gap-4 pt-1.5">
                        <button
                          onClick={() => handleLikeReview(rev.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                            hasLiked 
                              ? 'bg-neutral-900 border-neutral-900 text-white' 
                              : 'bg-white hover:bg-neutral-50 border-gray-200 text-gray-500 hover:text-black'
                          }`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${hasLiked ? 'fill-current' : ''}`} />
                          Helpful ({rev.likes || 0})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Lightbox Fullscreen Modal for image view */}
      <AnimatePresence>
        {selectedModalImage && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              className="absolute inset-0 cursor-zoom-out"
              onClick={() => setSelectedModalImage(null)}
            />
            <motion.div 
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl flex items-center justify-center border border-white/10"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
            >
              <img src={selectedModalImage} alt="Fullscreen Attachment Showcase" className="max-w-full max-h-[80vh] object-contain select-none" />
              <button
                onClick={() => setSelectedModalImage(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
