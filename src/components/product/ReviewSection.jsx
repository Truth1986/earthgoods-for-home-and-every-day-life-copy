import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, User, Trash2, ShieldCheck, Lock } from "lucide-react";
import moment from 'moment';

const StarRating = ({ rating, onRate, readonly = false, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRate?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-transform ${readonly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
        >
          <Star
            className={`${sz} ${
              star <= (hover || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-stone-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default function ReviewSection({ productId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => base44.entities.Review.filter({ product_id: productId }, '-created_date'),
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // Check if user has a delivered order containing this product
  const { data: deliveredOrders = [] } = useQuery({
    queryKey: ['delivered-orders', user?.email, productId],
    enabled: !!user?.email,
    queryFn: () => base44.entities.Order.filter({
      customer_email: user.email,
      status: 'delivered',
    }),
  });

  const hasVerifiedPurchase = deliveredOrders.some(order =>
    order.items?.some(item => item.product_id === productId)
  );

  // Check if user already reviewed this product
  const alreadyReviewed = reviews.some(r => r.created_by === user?.email);

  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.Review.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      setShowForm(false);
      setComment('');
      setReviewerName('');
      setRating(5);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => base44.entities.Review.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', productId] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createReviewMutation.mutate({
      product_id: productId,
      rating,
      comment: comment.trim(),
      reviewer_name: reviewerName.trim() || user?.full_name || 'Anonymous',
      verified_purchase: hasVerifiedPurchase,
    });
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Determine CTA state
  const renderCTA = () => {
    if (!user) return (
      <div className="flex items-center gap-2 text-sm text-stone-500 bg-stone-50 rounded-xl px-4 py-3">
        <Lock className="w-4 h-4" />
        <span>Sign in to leave a review.</span>
      </div>
    );
    if (alreadyReviewed) return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
        <ShieldCheck className="w-4 h-4" />
        <span>You've already reviewed this product.</span>
      </div>
    );
    if (!hasVerifiedPurchase) return (
      <div className="flex items-center gap-2 text-sm text-stone-500 bg-stone-50 rounded-xl px-4 py-3">
        <ShieldCheck className="w-4 h-4" />
        <span>Only customers with a delivered order can leave a verified review.</span>
      </div>
    );
    return (
      <Button
        onClick={() => setShowForm(true)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-full"
      >
        Write a Review
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">Customer Reviews</h2>
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-stone-800">{avgRating}</div>
            <StarRating rating={parseFloat(avgRating)} readonly />
            <div className="text-sm text-stone-500 mt-1">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</div>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(r => r.rating === stars).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm text-stone-600">{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-stone-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {!showForm && renderCTA()}
      </div>

      {/* Review Form — only for verified purchasers */}
      {showForm && hasVerifiedPurchase && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-stone-800">Write Your Review</h3>
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs ml-auto">Verified Purchase</Badge>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Your Rating *</label>
              <StarRating rating={rating} onRate={setRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Display Name</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder={user?.full_name || 'Anonymous'}
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Your Review *</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the product quality, packaging, and delivery?"
                required
                rows={4}
                className="resize-none rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createReviewMutation.isPending || rating === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-full"
              >
                {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 animate-pulse h-32" />
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-800">{review.reviewer_name}</span>
                      {review.verified_purchase && (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">{moment(review.created_date).fromNow()}</div>
                  </div>
                </div>
                {user?.email === review.created_by && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteReviewMutation.mutate(review.id)}
                    className="text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <StarRating rating={review.rating} readonly size="sm" />
              <p className="text-stone-600 mt-3 leading-relaxed text-sm">{review.comment}</p>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-100 text-center">
            <Star className="w-12 h-12 mx-auto text-stone-300 mb-3" />
            <p className="text-stone-600 font-medium">No reviews yet</p>
            <p className="text-stone-400 text-sm mt-1">Customers who receive their order can leave a verified review.</p>
          </div>
        )}
      </div>
    </div>
  );
}