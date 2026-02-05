'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Review {
    id: string;
    user_id: string;
    product_id?: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles?: {
        full_name: string;
    };
}

interface ReviewsProps {
    productId?: string;
}

export default function Reviews({ productId }: ReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('reviews')
                .select(`
                    *,
                    profiles:user_id (full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(10);

            if (productId) {
                query = query.eq('product_id', productId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching reviews:', error);
                // Use mock data if table doesn't exist
                setReviews(getMockReviews());
            } else {
                setReviews(data || getMockReviews());
            }
        } catch (err) {
            console.error('Error:', err);
            setReviews(getMockReviews());
        } finally {
            setLoading(false);
        }
    };

    const getMockReviews = (): Review[] => [
        {
            id: '1',
            user_id: '1',
            rating: 5,
            comment: 'Absolutely love the fresh orange juice! It tastes like it was just squeezed. Will definitely order again!',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            profiles: { full_name: 'Priya Sharma' },
        },
        {
            id: '2',
            user_id: '2',
            rating: 4,
            comment: 'Great quality juices. The mango juice is my favorite. Delivery was quick too!',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            profiles: { full_name: 'Rahul Patel' },
        },
        {
            id: '3',
            user_id: '3',
            rating: 5,
            comment: 'Best juice delivery service in the area. Fresh and healthy options!',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            profiles: { full_name: 'Anita Desai' },
        },
    ];

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.from('reviews').insert({
                user_id: user.id,
                product_id: productId || null,
                rating: newRating,
                comment: newComment.trim(),
            });

            if (error) throw error;

            setNewComment('');
            setNewRating(5);
            fetchReviews();
        } catch (err) {
            console.error('Error submitting review:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => interactive && onSelect?.(star)}
                        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                        disabled={!interactive}
                    >
                        <svg
                            className={`w-5 h-5 ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                ))}
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="py-12 bg-amber-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-amber-200 rounded w-1/4"></div>
                        <div className="h-32 bg-amber-100 rounded"></div>
                        <div className="h-32 bg-amber-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section className="py-12 bg-amber-50">
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Customer Reviews
                </h2>

                {/* Add Review Form */}
                {user && (
                    <form onSubmit={handleSubmitReview} className="bg-white rounded-xl p-6 shadow-md mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                            {renderStars(newRating, true, setNewRating)}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-800"
                                placeholder="Share your experience..."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            className="bg-amber-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                    {reviews.length === 0 ? (
                        <p className="text-center text-gray-600 py-8">No reviews yet. Be the first to review!</p>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-xl p-6 shadow-md">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            {review.profiles?.full_name || 'Anonymous'}
                                        </h4>
                                        <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>
                                <p className="text-gray-700">{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
