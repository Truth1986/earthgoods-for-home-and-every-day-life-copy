import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User, Trash2 } from "lucide-react";
import moment from 'moment';

const StarRating = ({ rating, onRate, readonly = false }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRate(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-colors ${readonly ? '' : 'hover:scale-110'}`}
        >
          <Star 
            className={`w-5 h-5 ${
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

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => base44.entities.Review.filter({ product_id: productId }, '-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => base44.entities.Review.create(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      setShowForm(false);
      setComment('');
      setReviewerName('');
      setRating(5);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => base44.entities.Review.delete(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createReviewMutation.mutate({
      product_id: productId,
      rating,
      comment: comment.trim(),
      reviewer_name: reviewerName.trim() || user?.full_name || 'Anonymous',
      verified_purchase: false,
    });
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">Customer Reviews</h2>
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-stone-800">{avgRating}</div>
            <StarRating rating={parseFloat(avgRating)} readonly />
            <div className="text-sm text-stone-500 mt-1">{reviews.length} reviews</div>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(r => r.rating === stars).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm text-stone-600">{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 transition-all" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-stone-500 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-full"
          >
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <h3 className="text-lg font-semibold text-stone-800 mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Your Rating</label>
              <StarRating rating={rating} onRate={setRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Your Name (optional)</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder={user?.full_name || "Anonymous"}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Your Review</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                required
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={createReviewMutation.isPending}
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
                    <div className="font-semibold text-stone-800">{review.reviewer_name}</div>
                    <div className="text-sm text-stone-500">{moment(review.created_date).fromNow()}</div>
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
              <StarRating rating={review.rating} readonly />
              <p className="text-stone-600 mt-3 leading-relaxed">{review.comment}</p>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-100 text-center">
            <Star className="w-12 h-12 mx-auto text-stone-300 mb-3" />
            <p className="text-stone-500">No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
}