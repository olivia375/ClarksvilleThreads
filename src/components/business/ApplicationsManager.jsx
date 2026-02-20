import React from "react";
import { entities } from "@/api/gcpClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, XCircle, Clock, Mail, Calendar, Briefcase, AlertCircle
} from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  confirmed: { bg: "bg-green-100", text: "text-green-700" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700" },
  completed: { bg: "bg-purple-100", text: "text-purple-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" }
};

export default function ApplicationsManager({ business, applications, opportunities = [] }) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status, opportunityId }) => {
      await entities.VolunteerCommitment.update(applicationId, { status });

      if (status === "confirmed") {
        const opps = await entities.VolunteerOpportunity.filter({ id: opportunityId });
        if (opps.length > 0) {
          await entities.VolunteerOpportunity.update(opportunityId, {
            slots_filled: (opps[0].slots_filled || 0) + 1
          });
        }
      }

      const app = applications.find(a => a.id === applicationId);
      if (app) {
        await entities.Notification.create({
          user_email: app.volunteer_email,
          type: status === "confirmed" ? "application_approved" : "application_rejected",
          title: status === "confirmed" ? "Application Approved!" : "Application Status Update",
          message:
            status === "confirmed"
              ? `Your application for "${app.opportunity_title || app.opportunity_id}" at ${business.name} has been approved!`
              : `Your application at ${business.name} has been declined.`,
          related_commitment_id: applicationId,
          related_business_id: business.id,
          is_read: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["business_applications"]);
      queryClient.invalidateQueries(["business_opportunities"]);
    }
  });

  const handleApprove = async (application) => {
    updateStatusMutation.mutate({
      applicationId: application.id,
      status: "confirmed",
      opportunityId: application.opportunity_id
    });
  };

  const handleReject = (application) => {
    updateStatusMutation.mutate({
      applicationId: application.id,
      status: "cancelled",
      opportunityId: application.opportunity_id
    });
  };

  const getOpportunityTitle = (app) => {
    if (app.opportunity_title) return app.opportunity_title;
    const opp = opportunities.find(o => o.id === app.opportunity_id);
    return opp?.title || "Unknown Opportunity";
  };

  const pendingApplications = applications.filter(a => a.status === "pending");
  const declinedApplications = applications.filter(a => a.status === "cancelled");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Applications</h2>

      {pendingApplications.length === 0 && declinedApplications.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-16">
            <AlertCircle className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-lg">No applications yet</p>
            <p className="text-gray-500 text-sm mt-1">
              When volunteers apply to your opportunities, they will appear here for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Pending Review */}
          {pendingApplications.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                Awaiting Review
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-yellow-500 text-white rounded-full">
                  {pendingApplications.length}
                </span>
              </h3>
              <div className="grid gap-4">
                {pendingApplications.map(app => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    opportunityTitle={getOpportunityTitle(app)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    showActions
                    isPending={updateStatusMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Declined */}
          {declinedApplications.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                Declined ({declinedApplications.length})
              </h3>
              <div className="grid gap-4">
                {declinedApplications.map(app => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    opportunityTitle={getOpportunityTitle(app)}
                    showActions={false}
                    isPending={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ app, opportunityTitle, onApprove, onReject, showActions, isPending }) {
  const statusColor = STATUS_COLORS[app.status] || STATUS_COLORS.pending;

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg">{app.volunteer_name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={`${statusColor.bg} ${statusColor.text}`}>
                {app.status.replace("_", " ")}
              </Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {opportunityTitle}
              </span>
            </div>
          </div>
          {showActions && app.status === "pending" && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => onApprove(app)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onReject(app)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <a href={`mailto:${app.volunteer_email}`} className="text-blue-700 hover:underline break-all">
              {app.volunteer_email}
            </a>
          </div>
          {app.hours_committed && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{app.hours_committed} hours committed</span>
            </div>
          )}
          {app.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Start: {format(new Date(app.start_date), "MMM d, yyyy")}</span>
            </div>
          )}
          {app.created_at && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0 opacity-40" />
              <span className="text-gray-400">Applied {format(new Date(app.created_at), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        {app.notes && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Message from volunteer
            </p>
            <p className="text-sm text-gray-700">{app.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
