import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { entities } from "@/api/gcpClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  ArrowLeft,
  Bell,
  BellOff,
  FileText,
  Filter,
} from "lucide-react";

const STATUS_BADGE = {
  pending: { className: "bg-yellow-100 text-yellow-700", label: "Pending" },
  confirmed: { className: "bg-green-100 text-green-700", label: "Confirmed" },
  rejected: { className: "bg-red-100 text-red-700", label: "Rejected" },
  cancelled: { className: "bg-gray-100 text-gray-700", label: "Cancelled" },
  completed: { className: "bg-blue-100 text-blue-700", label: "Completed" },
  in_progress: { className: "bg-purple-100 text-purple-700", label: "In Progress" },
};

export default function BusinessApplications() {
  const { user, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [opportunityFilter, setOpportunityFilter] = useState("all");

  // Fetch business by owner (doesn't rely on user.business_id)
  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ["my-business", user?.uid],
    queryFn: () => entities.Business.getMyBusiness(),
    enabled: !!user?.uid && !!user?.is_business_owner,
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities", business?.id],
    queryFn: () =>
      entities.VolunteerOpportunity.getByBusiness(business.id),
    enabled: !!business?.id,
  });

  // Use dedicated business commitments endpoint
  const { data: commitments = [], isLoading: isLoadingCommitments } = useQuery({
    queryKey: ["commitments-business-all", business?.id],
    queryFn: () => entities.VolunteerCommitment.getByBusiness(business.id),
    enabled: !!business?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      entities.VolunteerCommitment.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commitments-business-all"] });
      queryClient.invalidateQueries({ queryKey: ["commitments-business"] });
      toast.success("Application status updated");
    },
    onError: (err) => {
      toast.error("Failed to update: " + err.message);
    },
  });

  const toggleEmailMutation = useMutation({
    mutationFn: (enabled) =>
      entities.Business.toggleEmailNotifications(business.id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-business"] });
      toast.success("Email notification preference saved");
    },
    onError: (err) => {
      toast.error("Failed to update setting: " + err.message);
    },
  });

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900" />
      </div>
    );
  }

  if (!user || !user.is_business_owner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Business account required
        </h2>
        <p className="text-gray-600 mb-6">
          You need a business account to review applications.
        </p>
        <Link to={createPageUrl("BusinessSignup")}>
          <Button className="bg-blue-900 hover:bg-blue-800">
            Register Your Business
          </Button>
        </Link>
      </div>
    );
  }

  const opportunityMap = Object.fromEntries(
    opportunities.map((o) => [o.id, o])
  );

  const filteredCommitments = commitments.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (opportunityFilter !== "all" && c.opportunity_id !== opportunityFilter)
      return false;
    return true;
  });

  const sortedCommitments = [...filteredCommitments].sort((a, b) => {
    const statusOrder = { pending: 0, confirmed: 1, in_progress: 2, completed: 3, rejected: 4, cancelled: 5 };
    const aOrder = statusOrder[a.status] ?? 99;
    const bOrder = statusOrder[b.status] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const pendingCount = commitments.filter((c) => c.status === "pending").length;
  const confirmedCount = commitments.filter((c) => c.status === "confirmed").length;
  const totalCount = commitments.length;

  const emailEnabled = business?.email_notifications_enabled !== false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            to={createPageUrl("BusinessDashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Volunteer Applications
            </h1>
            <p className="text-gray-500">
              {isLoadingBusiness ? "Loading..." : business?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingCount}
                </p>
                <p className="text-sm text-gray-500">Pending Review</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {confirmedCount}
                </p>
                <p className="text-sm text-gray-500">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCount}
                </p>
                <p className="text-sm text-gray-500">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Notification Toggle */}
      <Card className="border-none shadow-sm mb-8">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {emailEnabled ? (
                <Bell className="w-5 h-5 text-blue-700" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <Label htmlFor="email-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Email notifications for new applications
                </Label>
                <p className="text-xs text-gray-500">
                  {emailEnabled
                    ? "You'll receive an email when a volunteer applies"
                    : "Email notifications are turned off"}
                </p>
              </div>
            </div>
            <Switch
              id="email-toggle"
              checked={emailEnabled}
              onCheckedChange={(checked) => toggleEmailMutation.mutate(checked)}
              disabled={toggleEmailMutation.isPending || isLoadingBusiness}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={opportunityFilter} onValueChange={setOpportunityFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Opportunity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Opportunities</SelectItem>
            {opportunities.map((opp) => (
              <SelectItem key={opp.id} value={opp.id}>
                {opp.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            Applications ({sortedCommitments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCommitments ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
            </div>
          ) : sortedCommitments.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {commitments.length === 0
                  ? "No applications yet. Once volunteers apply, they'll appear here."
                  : "No applications match the selected filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedCommitments.map((commitment) => {
                const opp = opportunityMap[commitment.opportunity_id];
                const badge = STATUS_BADGE[commitment.status] || STATUS_BADGE.pending;
                const isPending = commitment.status === "pending";

                return (
                  <div key={commitment.id} className="py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-900">
                            {commitment.volunteer_name || "Unknown Volunteer"}
                          </span>
                          <Badge className={`text-xs ${badge.className}`}>
                            {badge.label}
                          </Badge>
                        </div>

                        <p className="text-sm text-blue-700 font-medium mb-2">
                          {commitment.opportunity_title || opp?.title || "Unknown Opportunity"}
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

                      {isPending && (
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
                      )}
                    </div>
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
