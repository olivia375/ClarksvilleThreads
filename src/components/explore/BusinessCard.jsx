import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { entities } from "@/api/gcpClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, MapPin, ExternalLink } from "lucide-react";

export default function BusinessCard({ business, user }) {
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const favorites = await entities.Favorite.filter({
        user_email: user.email,
        business_id: business.id
      });

      if (favorites.length > 0) {
        await entities.Favorite.delete(favorites[0].id);
      } else {
        await entities.Favorite.create({
          user_email: user.email,
          business_id: business.id,
          business_name: business.name,
          business_category: business.category
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
    }
  });

  const [isFavorited, setIsFavorited] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      entities.Favorite.filter({
        user_email: user.email,
        business_id: business.id
      }).then((favorites) => setIsFavorited(favorites.length > 0));
    }
  }, [user, business.id]);

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{business.name}</CardTitle>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-pink-100 text-pink-700 capitalize">
                {business.category}
              </Badge>
              {business.verified &&
              <Badge className="bg-red-100 text-red-300 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow hover:bg-primary/80">
                  Verified
                </Badge>
              }
              {business.needs_help &&
              <Badge className="bg-fuchsia-100 text-fuchsia-700">
                  Seeking Help
                </Badge>
              }
            </div>
          </div>
          {user &&
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFavoriteMutation.mutate()}
            className={isFavorited ? "text-pink-600" : "text-gray-400"}>

              <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
            </Button>
          }
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-700 line-clamp-3">{business.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {business.average_rating > 0 &&
            <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-medium text-gray-900">
                  {business.average_rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({business.review_count})
                </span>
              </div>
            }
            {business.address &&
            <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{business.address}</span>
              </div>
            }
          </div>
        </div>

        <Link to={createPageUrl("BusinessDetail") + `?id=${business.id}`}>
          <Button className="bg-sky-200 text-gray-800 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-primary/90 h-9 w-full from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
            View Details
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>);

}