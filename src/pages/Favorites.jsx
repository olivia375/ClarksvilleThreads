import React from "react";
import { entities } from "@/api/gcpClient";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Building2 } from "lucide-react";
import BusinessCard from "../components/explore/BusinessCard";

export default function Favorites() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => user ? entities.Favorite.filter({ user_email: user.email }) : [],
    enabled: !!user
  });

  const { data: allBusinesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => entities.Business.list(),
    initialData: []
  });

  const favoriteBusinesses = allBusinesses.filter(b =>
    favorites.some(f => f.business_id === b.id)
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Heart className="w-8 h-8 fill-red-500 text-red-500" />
          My Favorite Businesses
        </h1>
        <p className="text-lg text-gray-600">
          Quick access to businesses you care about
        </p>
      </div>

      {favoritesLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      ) : favoriteBusinesses.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Favorites Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start exploring businesses and add your favorites to see them here!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteBusinesses.map(business => (
            <BusinessCard key={business.id} business={business} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}