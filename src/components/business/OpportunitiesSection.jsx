
import React, { useState } from "react";
import { entities, integrations } from "@/api/gcpClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Tag, Briefcase } from "lucide-react";
import { format } from "date-fns";

const URGENCY_COLORS = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

export default function OpportunitiesSection({ opportunities, business, user }) {
  const queryClient = useQueryClient();
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applicationData, setApplicationData] = useState({
    hours_committed: "",
    start_date: "",
    notes: ""
  });

  const applyMutation = useMutation({
    mutationFn: async (data) => {
      // Check if slots are available
      if (selectedOpp.slots_needed > 0 && selectedOpp.slots_filled >= selectedOpp.slots_needed) {
        throw new Error('This opportunity is already full');
      }

      // Check if user meets requirements
      const meetsAgeRequirement = user && user.age && user.age >= (business.min_volunteer_age || 0); 
      
      // Calculate scheduled hours for the selected month
      const selectedMonth = new Date(data.start_date);
      const commitments = await entities.VolunteerCommitment.filter({ 
        volunteer_email: user.email,
        status: { $in: ["confirmed", "in_progress"] }
      });
      
      const scheduledHoursInMonth = commitments
        .filter(c => {
          if (!c.start_date) return false;
          const commitmentDate = new Date(c.start_date);
          return commitmentDate.getMonth() === selectedMonth.getMonth() && 
                 commitmentDate.getFullYear() === selectedMonth.getFullYear();
        })
        .reduce((sum, c) => sum + (c.hours_committed || 0), 0);
      
      const hoursAvailable = (user.hours_available || 0) - scheduledHoursInMonth;
      const hasEnoughHours = hoursAvailable >= parseInt(data.hours_committed);
      
      // Auto-approve if requirements are met
      const status = meetsAgeRequirement && hasEnoughHours ? "confirmed" : "pending";
      
      // Create the commitment
      const commitment = await entities.VolunteerCommitment.create({
        volunteer_email: user.email,
        volunteer_name: user.full_name,
        opportunity_id: selectedOpp.id,
        business_id: business.id,
        business_name: business.name,
        hours_committed: parseInt(data.hours_committed),
        start_date: data.start_date,
        notes: data.notes,
        status: status
      });

      // Update opportunity slots if confirmed
      if (status === 'confirmed' && selectedOpp.slots_needed > 0) {
        await entities.VolunteerOpportunity.update(selectedOpp.id, {
          slots_filled: selectedOpp.slots_filled + 1
        });
      }

      // Create notification for the volunteer
      const notificationMessage = status === "confirmed" 
        ? `Your application for "${selectedOpp.title}" at ${business.name} has been automatically confirmed! You're all set to volunteer.`
        : `Your application for "${selectedOpp.title}" at ${business.name} has been received. You'll be notified when it's reviewed.`
      
      await entities.Notification.create({
        user_email: user.email,
        type: status === "confirmed" ? "application_approved" : "application_received",
        title: status === "confirmed" ? "Application Confirmed!" : "Application Submitted",
        message: notificationMessage,
        related_commitment_id: commitment.id,
        related_business_id: business.id,
        is_read: false
      });

      // Send confirmation email
      if (status === "confirmed") {
        await integrations.Core.SendEmail({
          from_name: "CommunityConnect",
          to: user.email,
          subject: `Application Confirmed: ${selectedOpp.title} at ${business.name} ✅`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Application Confirmed! ✅</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Great news, ${user.full_name}! 🎉</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Your volunteer application has been automatically confirmed! You met all the requirements and you're all set to make a difference.
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <h3 style="color: #10b981; margin-top: 0;">Confirmed Details</h3>
                  <table style="width: 100%; color: #4b5563;">
                    <tr>
                      <td style="padding: 8px 0;"><strong>Business:</strong></td>
                      <td style="padding: 8px 0;">${business.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Opportunity:</strong></td>
                      <td style="padding: 8px 0;">${selectedOpp.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Hours:</strong></td>
                      <td style="padding: 8px 0;">${data.hours_committed} hours</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Start Date:</strong></td>
                      <td style="padding: 8px 0;">${format(new Date(data.start_date), 'MMMM d, yyyy')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Status:</strong></td>
                      <td style="padding: 8px 0;"><span style="color: #10b981; font-weight: bold;">CONFIRMED</span></td>
                    </tr>
                  </table>
                </div>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  The business is expecting you on the scheduled date. Please arrive on time and bring your enthusiasm to help!
                </p>
                
                <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #1e40af; font-size: 14px; margin: 0;">
                    💡 <strong>Tip:</strong> Check your calendar to see all your upcoming volunteer commitments!
                  </p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  Thank you for making a difference in your community! 💚
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                  - The CommunityConnect Team
                </p>
              </div>
            </div>
          `
        });
      } else {
        await integrations.Core.SendEmail({
          from_name: "CommunityConnect",
          to: user.email,
          subject: `Application Submitted: ${selectedOpp.title} at ${business.name}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Application Submitted!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.full_name}! 👋</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Thank you for applying to volunteer! Your application has been submitted and is pending review.
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <h3 style="color: #f59e0b; margin-top: 0;">Application Details</h3>
                  <table style="width: 100%; color: #4b5563;">
                    <tr>
                      <td style="padding: 8px 0;"><strong>Business:</strong></td>
                      <td style="padding: 8px 0;">${business.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Opportunity:</strong></td>
                      <td style="padding: 8px 0;">${selectedOpp.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Hours:</strong></td>
                      <td style="padding: 8px 0;">${data.hours_committed} hours</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Start Date:</strong></td>
                      <td style="padding: 8px 0;">${format(new Date(data.start_date), 'MMMM d, yyyy')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Status:</strong></td>
                      <td style="padding: 8px 0;"><span style="color: #f59e0b; font-weight: bold;">PENDING REVIEW</span></td>
                    </tr>
                  </table>
                </div>
                
                ${!meetsAgeRequirement ? `
                  <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="color: #991b1b; font-size: 14px; margin: 0;">
                      ⚠️ <strong>Note:</strong> This opportunity requires volunteers to be at least ${business.min_volunteer_age} years old. Your application will be reviewed manually.
                    </p>
                  </div>
                ` : ''}
                
                ${!hasEnoughHours ? `
                  <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="color: #991b1b; font-size: 14px; margin: 0;">
                      ⚠️ <strong>Note:</strong> You have limited hours available this month. Your application will be reviewed manually.
                    </p>
                  </div>
                ` : ''}
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  The business will review your application and get back to you soon. We'll notify you once they respond!
                </p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  Thank you for wanting to make a difference in your community! 💚
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                  - The CommunityConnect Team
                </p>
              </div>
            </div>
          `
        });
      }

      return commitment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['commitments']);
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['opportunities']); // Invalidate opportunities to reflect updated slots_filled
      setShowApplyDialog(false);
      setSelectedOpp(null);
      setApplicationData({ hours_committed: "", start_date: "", notes: "" });
    }
  });

  const handleApply = (e) => {
    e.preventDefault();
    applyMutation.mutate(applicationData);
  };

  return (
    <div className="space-y-6">
      {opportunities.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Open Opportunities
            </h3>
            <p className="text-gray-600">
              This business doesn't have any volunteer opportunities at the moment. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        opportunities.map(opp => (
          <Card key={opp.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{opp.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={URGENCY_COLORS[opp.urgency]}>
                      {opp.urgency} priority
                    </Badge>
                    {opp.slots_needed > 0 && (
                      <Badge variant="outline">
                        {opp.slots_filled} / {opp.slots_needed} volunteers
                      </Badge>
                    )}
                  </div>
                </div>
                {user && (
                  <Button
                    onClick={() => {
                      setSelectedOpp(opp);
                      setShowApplyDialog(true);
                    }}
                    disabled={opp.slots_needed > 0 && opp.slots_filled >= opp.slots_needed}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {opp.slots_needed > 0 && opp.slots_filled >= opp.slots_needed ? 'Full' : 'Apply Now'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{opp.description}</p>

              {opp.slots_needed > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Volunteer Slots</span>
                    <span className="font-semibold text-gray-900">
                      {opp.slots_filled} / {opp.slots_needed}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((opp.slots_filled / opp.slots_needed) * 100, 100)}%` }}
                    />
                  </div>
                  {opp.slots_filled >= opp.slots_needed && (
                    <p className="text-sm text-red-600 mt-2 font-medium">This opportunity is currently full</p>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {opp.hours_needed && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Estimated: {opp.hours_needed} hours</span>
                  </div>
                )}

                {opp.special_offer && (
                  <div className="flex items-center gap-2 text-purple-700">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm font-medium">Special offer included!</span>
                  </div>
                )}
              </div>

              {opp.skills_needed && opp.skills_needed.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Skills Needed:</p>
                  <div className="flex flex-wrap gap-2">
                    {opp.skills_needed.map(skill => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {opp.special_offer && (
                <Alert className="bg-purple-50 border-purple-200">
                  <Tag className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>Volunteer Perk:</strong> {opp.special_offer}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Volunteer Opportunity</DialogTitle>
            <DialogDescription>
              Fill out the details below to apply for: <strong>{selectedOpp?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800 text-sm">
              {business.min_volunteer_age && business.min_volunteer_age > 0 ? (
                <>
                  <strong>Age Requirement:</strong> Must be {business.min_volunteer_age} years or older
                  {user && user.age && user.age >= business.min_volunteer_age && (
                    <span className="text-emerald-700 block mt-1">✓ You meet this requirement</span>
                  )}
                  {user && user.age && user.age < business.min_volunteer_age && (
                    <span className="text-red-700 block mt-1">⚠ Your application will require manual review</span>
                  )}
                </>
              ) : (
                <>
                  <strong>Age Requirement:</strong> No minimum age - all ages welcome!
                  <span className="text-emerald-700 block mt-1">✓ No age restrictions</span>
                </>
              )}
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <Label htmlFor="hours">Hours You Can Commit</Label>
              <Input
                id="hours"
                type="number"
                min="1"
                value={applicationData.hours_committed}
                onChange={(e) => setApplicationData({...applicationData, hours_committed: e.target.value})}
                placeholder="e.g., 5"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="start_date">Preferred Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={applicationData.start_date}
                onChange={(e) => setApplicationData({...applicationData, start_date: e.target.value})}
                required
                className="mt-2"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={applicationData.notes}
                onChange={(e) => setApplicationData({...applicationData, notes: e.target.value})}
                placeholder="Tell the business why you're interested or mention relevant experience..."
                rows={4}
                className="mt-2"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApplyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={applyMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
