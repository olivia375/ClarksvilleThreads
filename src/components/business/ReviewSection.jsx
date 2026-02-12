import React, { useState } from "react";
import { entities } from "@/api/gcpClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, User, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

export default function ReviewSection({ businessId, business, user }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', businessId],
    queryFn: () => entities.Review.filter({ business_id: businessId }),
    enabled: !!businessId
  });

  const createReviewMutation = useMutation({
    mutationFn: (data) => entities.Review.create(data),
    onSuccess: async () => {
      // Update business rating
      const allReviews = await entities.Review.filter({ business_id: businessId });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await entities.Business.update(businessId, {
        average_rating: avgRating,
        review_count: allReviews.length
      });

      queryClient.invalidateQueries(['reviews']);
      queryClient.invalidateQueries(['business', businessId]);
      setRating(0);
      setComment("");
      setShowForm(false);
    }
  });

  const handleSubmit = () => {
    if (!user) {
      alert("Please log in to leave a review");
      return;
    }
    
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    createReviewMutation.mutate({
      business_id: businessId,
      user_email: user.email,
      user_name: user.full_name,
      rating,
      comment,
      verified: true
    });
  };

  const userHasReviewed = reviews.some(r => r.user_email === user?.email);

  return (
    <div className="space-y-6">
      {/* Write Review Card */}
      {user && !userHasReviewed && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
                Leave a Review
              </Button>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Your Rating</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this business..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={createReviewMutation.isPending || rating === 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {userHasReviewed && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You've already reviewed this business. Thank you for your feedback!
          </AlertDescription>
        </Alert>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600">Be the first to review this business!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.user_name}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                  {review.volunteer_experience && (
                    <Badge variant="outline" className="mt-3 border-emerald-500 text-emerald-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Volunteered Here
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}