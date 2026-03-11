import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { entities } from "@/api/gcpClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Building2,
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Settings,
  Calendar,
  FileText,
  Mail,
  User,
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

  // Discover business by owner UID (works even if user.business_id is not set)
  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ["my-business", user?.uid],
    queryFn: () => entities.Business.getMyBusiness(),
    enabled: !!user?.uid && !!user?.is_business_owner,
  });

  const businessId = business?.id || user?.business_id;

  const { data: opportunities = [], isLoading: isLoadingOpportunities } = useQuery({
    queryKey: ["opportunities", businessId],
    queryFn: () => entities.VolunteerOpportunity.getByBusiness(businessId),
    enabled: !!businessId,
  });

  const queryClient = useQueryClient();

  const { data: commitments = [] } = useQuery({
    queryKey: ["commitments-business", businessId],
    queryFn: () => entities.VolunteerCommitment.getByBusiness(businessId),
    enabled: !!businessId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      entities.VolunteerCommitment.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments-business"] });
      queryClient.invalidateQueries({ queryKey: ["commitments-business-all"] });
      toast.success("Application status updated");
    },
    onError: (err) => {
      toast.error("Failed to update: " + err.message);
    },
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
        <div className="flex gap-2">
          <Link to={createPageUrl("BusinessApplications")}>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Review Applications
            </Button>
          </Link>
          <Link to={createPageUrl("BusinessCalendar")}>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
          </Link>
          <Link to={createPageUrl("ManageOpportunities")}>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Manage Opportunities
            </Button>
          </Link>
        </div>
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

      {/* Pending Applications */}
      {pendingCommitments.length > 0 && (
        <Card className="border-none shadow-sm mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">
                  Pending Applications ({pendingCommitments.length})
                </CardTitle>
              </div>
              <Link to={createPageUrl("BusinessApplications")}>
                <Button variant="outline" size="sm">
                  View All Applications
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {pendingCommitments
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((commitment) => (
                  <div key={commitment.id} className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-900">
                            {commitment.volunteer_name || "Unknown Volunteer"}
                          </span>
                          <Badge className="text-xs bg-yellow-100 text-yellow-700">
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-700 font-medium mb-2">
                          {commitment.opportunity_title || "Unknown Opportunity"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {commitment.volunteer_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {commitment.hours_committed}h committed
                          </span>
                          {commitment.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(commitment.start_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            Applied{" "}
                            {new Date(commitment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {commitment.notes && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-md p-2">
                            <span className="font-medium">Notes:</span>{" "}
                            {commitment.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: commitment.id,
                              status: "confirmed",
                            })
                          }
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: commitment.id,
                              status: "rejected",
                            })
                          }
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
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
