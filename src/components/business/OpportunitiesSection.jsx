
import React, { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Tag, Briefcase, MapPin, Calendar, Users, Zap, User, Repeat, CalendarDays } from "lucide-react";
import { format, parseISO, eachDayOfInterval, addDays } from "date-fns";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const URGENCY_COLORS = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

/**
 * Computes the list of available {date, hours} for a given opportunity.
 * Returns null for legacy opportunities (no schedule_type) — fall back to free date picker.
 */
function getAvailableDates(opp) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = format(today, "yyyy-MM-dd");

  if (opp.schedule_type === "one_time") {
    if (!opp.event_date || opp.event_date < todayStr) return [];
    return [{ date: opp.event_date, hours: opp.event_hours || opp.hours_needed || 4 }];
  }

  if (opp.schedule_type === "recurring") {
    const startDate =
      opp.recurring_start_date && opp.recurring_start_date >= todayStr
        ? parseISO(opp.recurring_start_date)
        : today;
    const maxEnd = addDays(today, 90);
    const endDate = opp.recurring_end_date
      ? new Date(Math.min(parseISO(opp.recurring_end_date).getTime(), maxEnd.getTime()))
      : maxEnd;

    if (startDate > endDate) return [];

    return eachDayOfInterval({ start: startDate, end: endDate })
      .filter((d) => (opp.recurring_days || []).includes(d.getDay()))
      .filter((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        return !(opp.blackout_dates || []).includes(dateStr);
      })
      .map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const override = (opp.date_overrides || {})[dateStr];
        return {
          date: dateStr,
          hours: override?.hours ?? (opp.recurring_hours_per_day || opp.hours_needed || 4),
        };
      });
  }

  // Legacy opportunity — no schedule_type
  return null;
}

function ScheduleInfo({ opp }) {
  if (opp.schedule_type === "one_time" && opp.event_date) {
    return (
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 flex-shrink-0 text-gray-400" />
        <span>
          {format(parseISO(opp.event_date), "EEE, MMM d, yyyy")} &middot;{" "}
          {opp.event_hours || opp.hours_needed || "?"}h
        </span>
      </div>
    );
  }
  if (opp.schedule_type === "recurring") {
    const days = (opp.recurring_days || []).map((d) => DAY_LABELS[d]).join(", ");
    return (
      <div className="flex items-center gap-2">
        <Repeat className="w-4 h-4 flex-shrink-0 text-gray-400" />
        <span>
          {days || "TBD"}
          {(opp.recurring_hours_per_day || opp.hours_needed) && (
            <> &middot; {opp.recurring_hours_per_day || opp.hours_needed}h/day</>
          )}
          {opp.recurring_start_date && (
            <> from {format(parseISO(opp.recurring_start_date), "MMM d, yyyy")}</>
          )}
        </span>
      </div>
    );
  }
  // Legacy
  if (opp.available_from || opp.available_to) {
    return (
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 flex-shrink-0 text-gray-400" />
        <span>
          {opp.available_from ? format(new Date(opp.available_from), "MMM d") : "Now"}
          {opp.available_to
            ? ` \u2013 ${format(new Date(opp.available_to), "MMM d, yyyy")}`
            : ""}
        </span>
      </div>
    );
  }
  return null;
}

export default function OpportunitiesSection({ opportunities, business, user }) {
  const queryClient = useQueryClient();
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applicationData, setApplicationData] = useState({
    hours_committed: "",
    start_date: "",
    notes: "",
  });

  // Compute available dates for the selected opportunity
  const availableDates = useMemo(
    () => (selectedOpp ? getAvailableDates(selectedOpp) : null),
    [selectedOpp]
  );

  // The hours cap for the selected date
  const selectedDateInfo = useMemo(() => {
    if (!availableDates || !applicationData.start_date) return null;
    return availableDates.find((d) => d.date === applicationData.start_date) || null;
  }, [availableDates, applicationData.start_date]);

  const maxHoursForDate = selectedDateInfo?.hours ?? 12;

  const effectiveMinAge = selectedOpp
    ? selectedOpp.min_age > 0
      ? selectedOpp.min_age
      : business.min_volunteer_age || 0
    : 0;

  const handleDateSelect = (date) => {
    if (!availableDates) {
      setApplicationData((prev) => ({ ...prev, start_date: date }));
      return;
    }
    const info = availableDates.find((d) => d.date === date);
    setApplicationData((prev) => ({
      ...prev,
      start_date: date,
      // Auto-fill hours for the selected date, but don't exceed current value if already set
      hours_committed: info ? String(info.hours) : prev.hours_committed,
    }));
  };

  const applyMutation = useMutation({
    mutationFn: async (data) => {
      if (selectedOpp.slots_needed > 0 && selectedOpp.slots_filled >= selectedOpp.slots_needed) {
        throw new Error("This opportunity is already full");
      }

      const oppAutoAccept = selectedOpp.auto_accept === true;
      const minAge =
        selectedOpp.min_age > 0 ? selectedOpp.min_age : business.min_volunteer_age || 0;
      const meetsAgeRequirement = !minAge || (user && user.age && user.age >= minAge);

      const selectedMonth = new Date(data.start_date);
      const commitments = await entities.VolunteerCommitment.filter({
        volunteer_email: user.email,
        status: { $in: ["confirmed", "in_progress"] },
      });

      const scheduledHoursInMonth = commitments
        .filter((c) => {
          if (!c.start_date) return false;
          const commitmentDate = new Date(c.start_date);
          return (
            commitmentDate.getMonth() === selectedMonth.getMonth() &&
            commitmentDate.getFullYear() === selectedMonth.getFullYear()
          );
        })
        .reduce((sum, c) => sum + (c.hours_committed || 0), 0);

      const hoursAvailable = (user.hours_available || 0) - scheduledHoursInMonth;
      const hasEnoughHours = hoursAvailable >= parseInt(data.hours_committed);

      const status =
        oppAutoAccept && meetsAgeRequirement && hasEnoughHours ? "confirmed" : "pending";

      const commitment = await entities.VolunteerCommitment.create({
        volunteer_email: user.email,
        volunteer_name: user.full_name,
        opportunity_id: selectedOpp.id,
        opportunity_title: selectedOpp.title,
        business_id: business.id,
        business_name: business.name,
        hours_committed: parseInt(data.hours_committed),
        start_date: data.start_date,
        notes: data.notes,
        status,
      });

      if (status === "confirmed" && selectedOpp.slots_needed > 0) {
        await entities.VolunteerOpportunity.update(selectedOpp.id, {
          slots_filled: selectedOpp.slots_filled + 1,
        });
      }

      const notificationMessage =
        status === "confirmed"
          ? `Your application for "${selectedOpp.title}" at ${business.name} has been automatically confirmed! You're all set to volunteer.`
          : `Your application for "${selectedOpp.title}" at ${business.name} has been received and is pending review.`;

      await entities.Notification.create({
        user_email: user.email,
        type: status === "confirmed" ? "application_approved" : "application_received",
        title: status === "confirmed" ? "Application Confirmed!" : "Application Submitted",
        message: notificationMessage,
        related_commitment_id: commitment.id,
        related_business_id: business.id,
        is_read: false,
      });

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
                <h2 style="color: #1f2937; margin-top: 0;">Great news, ${user.full_name}!</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Your volunteer application has been automatically confirmed!
                </p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <h3 style="color: #10b981; margin-top: 0;">Confirmed Details</h3>
                  <table style="width: 100%; color: #4b5563;">
                    <tr><td style="padding: 8px 0;"><strong>Business:</strong></td><td>${business.name}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Opportunity:</strong></td><td>${selectedOpp.title}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Hours:</strong></td><td>${data.hours_committed} hours</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Date:</strong></td><td>${format(new Date(data.start_date), "MMMM d, yyyy")}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td><span style="color: #10b981; font-weight: bold;">CONFIRMED</span></td></tr>
                  </table>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                  Thank you for making a difference in your community! — The CommunityConnect Team
                </p>
              </div>
            </div>
          `,
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
                <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.full_name}!</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Your application has been submitted and is pending review.
                </p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <h3 style="color: #f59e0b; margin-top: 0;">Application Details</h3>
                  <table style="width: 100%; color: #4b5563;">
                    <tr><td style="padding: 8px 0;"><strong>Business:</strong></td><td>${business.name}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Opportunity:</strong></td><td>${selectedOpp.title}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Hours:</strong></td><td>${data.hours_committed} hours</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Date:</strong></td><td>${format(new Date(data.start_date), "MMMM d, yyyy")}</td></tr>
                    <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td><span style="color: #f59e0b; font-weight: bold;">PENDING REVIEW</span></td></tr>
                  </table>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                  Thank you for wanting to make a difference! — The CommunityConnect Team
                </p>
              </div>
            </div>
          `,
        });
      }

      return commitment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["commitments"]);
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["opportunities"]);
      setShowApplyDialog(false);
      setSelectedOpp(null);
      setApplicationData({ hours_committed: "", start_date: "", notes: "" });
    },
  });

  const handleApply = (e) => {
    e.preventDefault();
    // Validate hours don't exceed the scheduled max
    if (availableDates !== null && selectedDateInfo) {
      const h = parseInt(applicationData.hours_committed);
      if (h > selectedDateInfo.hours) {
        const clampedH = selectedDateInfo.hours;
        setApplicationData((prev) => ({ ...prev, hours_committed: String(clampedH) }));
        applyMutation.mutate({ ...applicationData, hours_committed: String(clampedH) });
        return;
      }
    }
    applyMutation.mutate(applicationData);
  };

  return (
    <div className="space-y-6">
      {opportunities.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Open Opportunities</h3>
            <p className="text-gray-600">
              This business doesn&apos;t have any volunteer opportunities at the moment. Check back
              later!
            </p>
          </CardContent>
        </Card>
      ) : (
        opportunities.map((opp) => {
          const oppMinAge =
            opp.min_age > 0 ? opp.min_age : business.min_volunteer_age || 0;
          const isFull =
            opp.slots_needed > 0 && (opp.slots_filled || 0) >= opp.slots_needed;

          return (
            <Card
              key={opp.id}
              className="border-none shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{opp.title}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={URGENCY_COLORS[opp.urgency]}>{opp.urgency} priority</Badge>
                      {opp.slots_needed > 0 && (
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {opp.slots_filled || 0} / {opp.slots_needed} volunteers
                        </Badge>
                      )}
                      {opp.auto_accept && (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <Zap className="w-3 h-3 mr-1" />
                          Instant Confirm
                        </Badge>
                      )}
                      {opp.schedule_type === "recurring" && (
                        <Badge className="bg-purple-100 text-purple-700">
                          <Repeat className="w-3 h-3 mr-1" />
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </div>
                  {user && (
                    <Button
                      onClick={() => {
                        setSelectedOpp(opp);
                        setApplicationData({ hours_committed: "", start_date: "", notes: "" });
                        setShowApplyDialog(true);
                      }}
                      disabled={isFull}
                      className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                    >
                      {isFull ? "Full" : "Apply Now"}
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-700">{opp.description}</p>

                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                  {opp.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span>{opp.location}</span>
                    </div>
                  )}
                  {opp.hours_needed && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span>Up to {opp.hours_needed} hrs/session</span>
                    </div>
                  )}
                  <ScheduleInfo opp={opp} />
                  {oppMinAge > 0 && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span>Must be {oppMinAge}+ years old</span>
                    </div>
                  )}
                </div>

                {opp.slots_needed > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Volunteer Slots</span>
                      <span className="font-semibold text-gray-900">
                        {opp.slots_filled || 0} / {opp.slots_needed}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((opp.slots_filled || 0) / opp.slots_needed) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    {isFull && (
                      <p className="text-sm text-red-600 mt-2 font-medium">
                        This opportunity is currently full
                      </p>
                    )}
                  </div>
                )}

                {opp.skills_needed && opp.skills_needed.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Skills Needed:</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.skills_needed.map((skill) => (
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
          );
        })
      )}

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Volunteer Opportunity</DialogTitle>
            <DialogDescription>
              Applying for: <strong>{selectedOpp?.title}</strong> at {business.name}
            </DialogDescription>
          </DialogHeader>

          {/* Requirements info */}
          <div className="space-y-2">
            {effectiveMinAge > 0 && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Age Requirement:</strong> Must be {effectiveMinAge}+ years old
                  {user?.age && user.age >= effectiveMinAge && (
                    <span className="text-emerald-700 block mt-1">You meet this requirement</span>
                  )}
                  {user?.age && user.age < effectiveMinAge && (
                    <span className="text-red-700 block mt-1">
                      Your application will require manual review
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {selectedOpp?.auto_accept ? (
              <Alert className="bg-emerald-50 border-emerald-200">
                <Zap className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800 text-sm">
                  <strong>Instant Confirm:</strong> If you meet the requirements, you&apos;ll be
                  automatically confirmed.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800 text-sm">
                  <strong>Manual Review:</strong> The business will review your application and
                  notify you.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <form onSubmit={handleApply} className="space-y-4">
            {/* Date selection */}
            {availableDates === null ? (
              // Legacy free date picker
              <div>
                <Label htmlFor="start_date">Preferred Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={applicationData.start_date}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, start_date: e.target.value })
                  }
                  required
                  className="mt-2"
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
            ) : availableDates.length === 0 ? (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800 text-sm">
                  There are no upcoming available dates for this opportunity.
                </AlertDescription>
              </Alert>
            ) : (
              <div>
                <Label htmlFor="date_select">Select Date</Label>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">
                  Only showing dates the business has scheduled
                </p>
                <Select
                  value={applicationData.start_date}
                  onValueChange={handleDateSelect}
                  required
                >
                  <SelectTrigger className="w-full" id="date_select">
                    <SelectValue placeholder="Choose an available date..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableDates.slice(0, 60).map(({ date, hours }) => (
                      <SelectItem key={date} value={date}>
                        {format(parseISO(date), "EEE, MMM d, yyyy")} &middot; {hours}h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Hours input */}
            {availableDates !== null && availableDates.length > 0 ? (
              <div>
                <Label htmlFor="hours">
                  Hours You Can Commit
                  {selectedDateInfo && (
                    <span className="text-gray-400 font-normal">
                      {" "}(max {selectedDateInfo.hours}h for this date)
                    </span>
                  )}
                </Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  max={maxHoursForDate}
                  value={applicationData.hours_committed}
                  onChange={(e) =>
                    setApplicationData({
                      ...applicationData,
                      hours_committed: String(
                        Math.min(maxHoursForDate, Math.max(1, parseInt(e.target.value) || 1))
                      ),
                    })
                  }
                  placeholder={selectedDateInfo ? `1 – ${selectedDateInfo.hours}` : "e.g., 4"}
                  required
                  className="mt-2"
                  disabled={!applicationData.start_date}
                />
              </div>
            ) : availableDates === null ? (
              // Legacy hours input
              <div>
                <Label htmlFor="hours">Hours You Can Commit</Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  max="12"
                  value={applicationData.hours_committed}
                  onChange={(e) =>
                    setApplicationData({ ...applicationData, hours_committed: e.target.value })
                  }
                  placeholder="e.g., 5"
                  required
                  className="mt-2"
                />
              </div>
            ) : null}

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={applicationData.notes}
                onChange={(e) =>
                  setApplicationData({ ...applicationData, notes: e.target.value })
                }
                placeholder="Tell the business why you're interested or mention relevant experience..."
                rows={3}
                className="mt-2"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowApplyDialog(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  applyMutation.isPending ||
                  (availableDates !== null && availableDates.length === 0)
                }
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
