
import React from "react";
import { entities } from "@/api/gcpClient";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, Heart, CheckCircle, Briefcase } from "lucide-react";
import ReviewSection from "../components/business/ReviewSection";
import OpportunitiesSection from "../components/business/OpportunitiesSection";

export default function BusinessDetail() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const businessId = urlParams.get('id');
  const { user } = useAuth();

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const businesses = await entities.Business.list();
      return businesses.find(b => b.id === businessId);
    },
    enabled: !!businessId
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities', businessId],
    queryFn: () => entities.VolunteerOpportunity.filter({ business_id: businessId, status: "open" }),
    enabled: !!businessId
  });

  const { data: isFavorited = false } = useQuery({
    queryKey: ['favorite', businessId, user?.email],
    queryFn: async () => {
      if (!user) return false;
      const favorites = await entities.Favorite.filter({
        user_email: user.email,
        business_id: businessId
      });
      return favorites.length > 0;
    },
    enabled: !!user && !!businessId
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        const favorites = await entities.Favorite.filter({
          user_email: user.email,
          business_id: businessId
        });
        if (favorites.length > 0) {
          await entities.Favorite.delete(favorites[0].id);
        }
      } else {
        await entities.Favorite.create({
          user_email: user.email,
          business_id: businessId,
          business_name: business.name,
          business_category: business.category
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favorite', businessId]);
    }
  });

  if (isLoading || !business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Button asChild variant="ghost" className="mb-6">
        <Link to={createPageUrl("Explore")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Explore
        </Link>
      </Button>

      {/* Business Header */}
      <Card className="mb-8 border-none shadow-lg">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-48 h-48 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-6xl font-bold text-white">
                {business.name.charAt(0)}
              </span>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                    {business.verified && (
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    )}
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 text-sm">
                    {business.category}
                  </Badge>
                </div>
                {user && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toggleFavoriteMutation.mutate()}
                    disabled={toggleFavoriteMutation.isPending}
                  >
                    <Heart
                      className={`w-5 h-5 mr-2 ${
                        isFavorited ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    {isFavorited ? "Favorited" : "Add to Favorites"}
                  </Button>
                )}
              </div>

              {business.average_rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(business.average_rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {business.average_rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500">({business.review_count} reviews)</span>
                </div>
              )}

              <p className="text-gray-700 mb-6">{business.description}</p>

              <div className="flex flex-wrap gap-3 mb-6">
                {business.needs_help && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                    <Briefcase className="w-4 h-4 mr-1" />
                    Currently Seeking Volunteers
                  </Badge>
                )}
                <Badge variant="outline" className="border-blue-500 text-blue-700">
                  Age Requirement: {business.min_volunteer_age ? `${business.min_volunteer_age}+` : 'Any age'}
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {business.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{business.address}</span>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{business.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="opportunities" className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="opportunities">
            Volunteer Opportunities ({opportunities.length})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({business.review_count || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities">
          <OpportunitiesSection 
            opportunities={opportunities} 
            business={business}
            user={user}
          />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewSection 
            businessId={businessId} 
            business={business}
            user={user}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
