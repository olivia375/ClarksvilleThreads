import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { entities } from "@/api/gcpClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
} from "lucide-react";

const URGENCY_COLORS = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_COLORS = {
  open: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  filled: "bg-purple-100 text-purple-700",
};

export default function BusinessDashboard() {
  const { user, isLoadingAuth } = useAuth();

  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ["business", user?.business_id],
    queryFn: () => entities.Business.get(user.business_id),
    enabled: !!user?.business_id,
  });

  const { data: opportunities = [], isLoading: isLoadingOpportunities } = useQuery({
    queryKey: ["opportunities", user?.business_id],
    queryFn: () => entities.VolunteerOpportunity.filter({ business_id: user.business_id }),
    enabled: !!user?.business_id,
  });

  const { data: commitments = [] } = useQuery({
    queryKey: ["commitments-business", user?.business_id],
    queryFn: async () => {
      const all = await Promise.all(
        opportunities.map((opp) =>
          entities.VolunteerCommitment.filter({ opportunity_id: opp.id })
        )
      );
      return all.flat();
    },
    enabled: opportunities.length > 0,
  });

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in required</h2>
        <p className="text-gray-600 mb-6">You need to be signed in to access the business dashboard.</p>
        <Link to={createPageUrl("BusinessSignup")}>
          <Button className="bg-blue-900 hover:bg-blue-800">Register Your Business</Button>
        </Link>
      </div>
    );
  }

  if (!user.is_business_owner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business account required</h2>
        <p className="text-gray-600 mb-6">Register your business to access this dashboard.</p>
        <Link to={createPageUrl("BusinessSignup")}>
          <Button className="bg-blue-900 hover:bg-blue-800">Register Your Business</Button>
        </Link>
      </div>
    );
  }

  const pendingCommitments = commitments.filter((c) => c.status === "pending");
  const confirmedCommitments = commitments.filter((c) => c.status === "confirmed");
  const openOpportunities = opportunities.filter((o) => o.status === "open");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-900 rounded-xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isLoadingBusiness ? "Loading..." : business?.name || "Business Dashboard"}
            </h1>
            <p className="text-gray-500 capitalize">{business?.category}</p>
          </div>
        </div>
        <Link to={createPageUrl("ManageOpportunities")}>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Manage Opportunities
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{openOpportunities.length}</p>
                <p className="text-sm text-gray-500">Open Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCommitments.length}</p>
                <p className="text-sm text-gray-500">Pending Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{confirmedCommitments.length}</p>
                <p className="text-sm text-gray-500">Confirmed Volunteers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{opportunities.length}</p>
                <p className="text-sm text-gray-500">Total Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications Alert */}
      {pendingCommitments.length > 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-800 text-sm font-medium">
            You have {pendingCommitments.length} pending volunteer application{pendingCommitments.length > 1 ? "s" : ""} awaiting review.
          </p>
        </div>
      )}

      {/* Opportunities */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Volunteer Opportunities</CardTitle>
            <Link to={createPageUrl("ManageOpportunities")}>
              <Button size="sm" className="bg-blue-900 hover:bg-blue-800">
                <Plus className="w-4 h-4 mr-1" />
                Add Opportunity
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingOpportunities ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No opportunities posted yet.</p>
              <Link to={createPageUrl("ManageOpportunities")}>
                <Button className="bg-blue-900 hover:bg-blue-800">Post Your First Opportunity</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {opportunities.map((opp) => {
                const oppCommitments = commitments.filter((c) => c.opportunity_id === opp.id);
                const pending = oppCommitments.filter((c) => c.status === "pending").length;
                const confirmed = oppCommitments.filter((c) => c.status === "confirmed").length;
                return (
                  <div key={opp.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium text-gray-900">{opp.title}</p>
                        <Badge className={`text-xs ${STATUS_COLORS[opp.status] || STATUS_COLORS.open}`}>
                          {opp.status}
                        </Badge>
                        <Badge className={`text-xs ${URGENCY_COLORS[opp.urgency] || URGENCY_COLORS.medium}`}>
                          {opp.urgency}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{opp.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{confirmed}/{opp.slots_needed} volunteers filled</span>
                        {pending > 0 && (
                          <span className="text-yellow-600 font-medium">{pending} pending</span>
                        )}
                        {opp.available_from && (
                          <span>{opp.available_from}{opp.available_to ? ` – ${opp.available_to}` : ""}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={createPageUrl("ManageOpportunities")}
                      className="text-xs text-blue-700 hover:underline flex-shrink-0 pt-1"
                    >
                      Edit
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
