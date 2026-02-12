import React, { useState } from "react";
import { entities } from "@/api/gcpClient";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Heart, Building2, Filter, ExternalLink, CheckCircle, Sparkles } from "lucide-react";
import BusinessCard from "../components/explore/BusinessCard";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "food", label: "Food & Restaurants" },
  { value: "retail", label: "Retail & Shopping" },
  { value: "services", label: "Services" },
  { value: "nonprofit", label: "Nonprofits" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "arts", label: "Arts & Culture" },
  { value: "environment", label: "Environment" },
  { value: "other", label: "Other" }
];

const CATEGORY_MAP = {
  "Food & Restaurants": "food",
  "Retail & Shopping": "retail",
  "Services": "services",
  "Nonprofits": "nonprofit",
  "Education": "education",
  "Healthcare": "healthcare",
  "Arts & Culture": "arts",
  "Environment": "environment",
  "Community Services": "other"
};

export default function Explore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [showNeedsHelpOnly, setShowNeedsHelpOnly] = useState(true);

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => entities.Business.list('-average_rating'),
    initialData: []
  });

  const { user } = useAuth();

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => entities.VolunteerOpportunity.filter({ status: "open" }),
    initialData: []
  });

  // Calculate recommended businesses based on user skills and interests
  const getRecommendedBusinesses = () => {
    if (!user || (!user.skills?.length && !user.interests?.length)) return [];

    const scoredBusinesses = businesses.map(business => {
      let score = 0;

      // Match interests with business category
      if (user.interests?.length) {
        const matchingCategory = user.interests.find(interest => 
          CATEGORY_MAP[interest] === business.category
        );
        if (matchingCategory) score += 3;
      }

      // Match skills with opportunity requirements
      if (user.skills?.length) {
        const businessOpportunities = opportunities.filter(opp => opp.business_id === business.id);
        businessOpportunities.forEach(opp => {
          if (opp.skills_needed?.length) {
            const matchingSkills = opp.skills_needed.filter(skill => 
              user.skills.includes(skill)
            );
            score += matchingSkills.length * 2;
          }
        });
      }

      return { ...business, matchScore: score };
    });

    return scoredBusinesses
      .filter(b => b.matchScore > 0 && b.needs_help)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  };

  const recommendedBusinesses = getRecommendedBusinesses();

  const filteredBusinesses = businesses
    .filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           b.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || b.category === selectedCategory;
      const matchesNeedsHelp = !showNeedsHelpOnly || b.needs_help;
      return matchesSearch && matchesCategory && matchesNeedsHelp;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.average_rating || 0) - (a.average_rating || 0);
      if (sortBy === "reviews") return (b.review_count || 0) - (a.review_count || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Explore Local Businesses
        </h1>
        <p className="text-lg text-gray-600">
          Discover small businesses and nonprofits in your community that need your help
        </p>
      </div>

      {/* Recommended For You Section */}
      {recommendedBusinesses.length > 0 && (
        <Card className="mb-8 border-none shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              Recommended For You
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Based on your skills and interests
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedBusinesses.map(business => (
                <BusinessCard key={business.id} business={business} user={user} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-8 border-none shadow-lg">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button
              variant={showNeedsHelpOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowNeedsHelpOnly(!showNeedsHelpOnly)}
              className={showNeedsHelpOnly ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showNeedsHelpOnly ? "Showing: Needs Help" : "Show All"}
            </Button>
            <p className="text-sm text-gray-500">
              {filteredBusinesses.length} businesses found
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
            <p className="text-gray-600">Try adjusting your filters or search criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map(business => (
            <BusinessCard key={business.id} business={business} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}