import React from "react";
import { entities } from "@/api/gcpClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  confirmed: { bg: "bg-green-100", text: "text-green-700" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700" },
  completed: { bg: "bg-purple-100", text: "text-purple-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" }
};

export default function ApplicationsManager({ business, applications }) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status, opportunityId, slotsNeeded }) => {
      await entities.VolunteerCommitment.update(applicationId, { status });
      
      // Update slots if confirming and slots are limited
      if (status === 'confirmed' && slotsNeeded > 0) {
        const opportunity = await entities.VolunteerOpportunity.filter({ id: opportunityId });
        if (opportunity.length > 0) {
          await entities.VolunteerOpportunity.update(opportunityId, {
            slots_filled: (opportunity[0].slots_filled || 0) + 1
          });
        }
      }

      // Send notification to volunteer
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        await entities.Notification.create({
          user_email: app.volunteer_email,
          type: status === 'confirmed' ? 'application_approved' : 'application_rejected',
          title: status === 'confirmed' ? 'Application Approved!' : 'Application Status Update',
          message: status === 'confirmed' 
            ? `Your application for "${app.opportunity_id}" at ${business.name} has been approved!`
            : `Your application status has been updated to: ${status}`,
          related_commitment_id: applicationId,
          related_business_id: business.id,
          is_read: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['business_applications']);
      queryClient.invalidateQueries(['business_opportunities']);
    }
  });

  const handleApprove = async (application) => {
    // Get opportunity to check slots
    const opportunities = await entities.VolunteerOpportunity.filter({ id: application.opportunity_id });
    const opportunity = opportunities.length > 0 ? opportunities[0] : null;
    
    updateStatusMutation.mutate({ 
      applicationId: application.id, 
      status: 'confirmed',
      opportunityId: application.opportunity_id,
      slotsNeeded: opportunity?.slots_needed || 0
    });
  };

  const handleReject = (application) => {
    updateStatusMutation.mutate({ 
      applicationId: application.id, 
      status: 'cancelled',
      opportunityId: application.opportunity_id,
      slotsNeeded: 0
    });
  };

  const sortedApplications = [...applications].sort((a, b) => {
    const statusOrder = { pending: 0, confirmed: 1, in_progress: 2, completed: 3, cancelled: 4 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Volunteer Applications</h2>

      {applications.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No applications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {sortedApplications.map(app => {
            const statusColor = STATUS_COLORS[app.status];
            
            return (
              <Card key={app.id} className="border-none shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{app.volunteer_name}</CardTitle>
                      <Badge className={`${statusColor.bg} ${statusColor.text}`}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(app)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(app)}
                          className="text-red-600"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{app.volunteer_email}</span>
                    </div>
                    {app.hours_committed && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{app.hours_committed} hours committed</span>
                      </div>
                    )}
                    {app.start_date && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Start: {format(new Date(app.start_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                  {app.notes && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Volunteer's Message:</p>
                      <p className="text-sm text-gray-600">{app.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}