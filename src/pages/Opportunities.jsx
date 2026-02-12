import React, { useState } from "react";
import { entities } from "@/api/gcpClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, Tag, Briefcase, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const URGENCY_COLORS = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

export default function Opportunities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['all_opportunities'],
    queryFn: () => entities.VolunteerOpportunity.filter({ status: "open" }),
    initialData: []
  });

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = urgencyFilter === "all" || opp.urgency === urgencyFilter;
    return matchesSearch && matchesUrgency;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Volunteer Opportunities
        </h1>
        <p className="text-lg text-gray-600">
          Find meaningful ways to contribute to your local community
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8 border-none shadow-lg">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            {filteredOpportunities.length} opportunities found
          </p>
        </CardContent>
      </Card>

      {/* Opportunities Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredOpportunities.map((opp, index) => (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-none shadow-lg hover:shadow-xl transition-all h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <CardTitle className="text-xl">{opp.title}</CardTitle>
                    <Badge className={URGENCY_COLORS[opp.urgency]}>
                      {opp.urgency}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{opp.business_name}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-gray-700 mb-4 line-clamp-3">{opp.description}</p>

                  <div className="space-y-3 mb-4">
                    {opp.hours_needed && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Estimated: {opp.hours_needed} hours</span>
                      </div>
                    )}

                    {opp.special_offer && (
                      <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 p-2 rounded">
                        <Tag className="w-4 h-4" />
                        <span className="font-medium">Special offer included!</span>
                      </div>
                    )}
                  </div>

                  {opp.skills_needed && opp.skills_needed.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Skills Needed:</p>
                      <div className="flex flex-wrap gap-1">
                        {opp.skills_needed.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {opp.skills_needed.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{opp.skills_needed.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    <Link to={`${createPageUrl("BusinessDetail")}?id=${opp.business_id}`}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        View Details & Apply
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}