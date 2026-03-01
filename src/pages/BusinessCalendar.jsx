import React, { useState, useMemo } from "react";
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
  ChevronLeft,
  Users,
  Clock,
  Calendar,
  ExternalLink,
  Briefcase,
  Repeat,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  isToday,
} from "date-fns";

// Distinct colors for each opportunity, cycling through the list
const OPP_COLORS = [
  { dot: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { dot: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { dot: "bg-purple-500", light: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { dot: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { dot: "bg-pink-500", light: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  { dot: "bg-teal-500", light: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
];

function getOppHoursForDate(opp, dateStr) {
  if (opp.schedule_type === "one_time") {
    return opp.event_hours || opp.hours_needed || 4;
  }
  if (opp.schedule_type === "recurring") {
    const override = (opp.date_overrides || {})[dateStr];
    return override?.hours ?? (opp.recurring_hours_per_day || opp.hours_needed || 4);
  }
  return opp.hours_needed || 4;
}

function isOppActiveOnDate(opp, dateStr) {
  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay();

  if (opp.schedule_type === "one_time") {
    return opp.event_date === dateStr;
  }

  if (opp.schedule_type === "recurring") {
    if (!(opp.recurring_days || []).includes(dayOfWeek)) return false;
    if (opp.recurring_start_date && dateStr < opp.recurring_start_date) return false;
    if (opp.recurring_end_date && dateStr > opp.recurring_end_date) return false;
    if ((opp.blackout_dates || []).includes(dateStr)) return false;
    return true;
  }

  // Legacy: treat available_from/available_to as a date range (active every day in range)
  if (opp.available_from || opp.available_to) {
    if (opp.available_from && dateStr < opp.available_from) return false;
    if (opp.available_to && dateStr > opp.available_to) return false;
    return true;
  }

  return false;
}

function StatusBadge({ status }) {
  const styles = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <Badge className={`text-[10px] py-0 h-4 ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </Badge>
  );
}

export default function BusinessCalendar() {
  const { user, isLoadingAuth } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: opportunities = [], isLoading: isLoadingOpps } = useQuery({
    queryKey: ["business_opps_cal", user?.business_id],
    queryFn: () => entities.VolunteerOpportunity.filter({ business_id: user.business_id }),
    enabled: !!user?.business_id,
  });

  // Fetch all commitments for this business's opportunities
  const { data: allCommitments = [], isLoading: isLoadingCommitments } = useQuery({
    queryKey: ["business_commitments_cal", user?.business_id, opportunities.map((o) => o.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        opportunities.map((opp) =>
          entities.VolunteerCommitment.filter({ opportunity_id: opp.id })
        )
      );
      return results.flat();
    },
    enabled: !!user?.business_id && opportunities.length > 0,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Map opportunity ID → color index
  const oppColorMap = useMemo(() => {
    const map = {};
    opportunities.forEach((opp, i) => {
      map[opp.id] = OPP_COLORS[i % OPP_COLORS.length];
    });
    return map;
  }, [opportunities]);

  const getOppsForDate = (dateStr) =>
    opportunities.filter((opp) => isOppActiveOnDate(opp, dateStr));

  const getCommitmentsForOppOnDate = (oppId, dateStr) =>
    allCommitments.filter(
      (c) =>
        c.opportunity_id === oppId &&
        c.start_date === dateStr &&
        c.status !== "cancelled"
    );

  const selectedDateOpps = getOppsForDate(selectedDateStr);

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900" />
      </div>
    );
  }

  if (!user?.is_business_owner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business account required</h2>
        <p className="text-gray-600 mb-6">Only business owners can view this calendar.</p>
        <Link to={createPageUrl("BusinessSignup")}>
          <Button className="bg-blue-900 hover:bg-blue-800">Register Your Business</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={createPageUrl("BusinessDashboard")}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Business Calendar</h1>
          <p className="text-gray-500 text-sm">
            View your scheduled opportunities and volunteer signups
          </p>
        </div>
        <Link to={createPageUrl("ManageOpportunities")}>
          <Button variant="outline" size="sm">
            <Briefcase className="w-4 h-4 mr-2" />
            Manage Opportunities
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {/* Offset empty cells */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {monthDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isSelected = dateStr === selectedDateStr;
                const dayOpps = getOppsForDate(dateStr);
                const hasOpps = dayOpps.length > 0;
                const isCurrent = isToday(day);

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`min-h-[56px] rounded-lg p-1.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isSelected
                        ? "bg-blue-900 text-white ring-2 ring-blue-900 ring-offset-1"
                        : isCurrent
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : hasOpps
                        ? "bg-white hover:bg-gray-50 border border-gray-100 shadow-sm"
                        : "hover:bg-gray-50 text-gray-400"
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        isSelected ? "text-white" : isCurrent ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    {hasOpps && (
                      <div className="flex flex-wrap gap-0.5">
                        {dayOpps.slice(0, 3).map((opp) => (
                          <div
                            key={opp.id}
                            className={`w-2 h-2 rounded-full ${oppColorMap[opp.id]?.dot} ${
                              isSelected ? "opacity-70" : ""
                            }`}
                            title={opp.title}
                          />
                        ))}
                        {dayOpps.length > 3 && (
                          <span
                            className={`text-[9px] leading-none mt-0.5 ${
                              isSelected ? "text-white opacity-70" : "text-gray-400"
                            }`}
                          >
                            +{dayOpps.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            {opportunities.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Opportunities</p>
                <div className="flex flex-wrap gap-3">
                  {opportunities.map((opp) => {
                    const color = oppColorMap[opp.id];
                    return (
                      <div key={opp.id} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${color?.dot}`} />
                        <span className="text-xs text-gray-600">{opp.title}</span>
                        {opp.schedule_type === "recurring" ? (
                          <Repeat className="w-3 h-3 text-gray-400" />
                        ) : opp.schedule_type === "one_time" ? (
                          <CalendarDays className="w-3 h-3 text-gray-400" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar: selected date details */}
        <div>
          <Card className="border-none shadow-lg sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-blue-900" />
                {format(parseISO(selectedDateStr), "EEE, MMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOpps || isLoadingCommitments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
                </div>
              ) : selectedDateOpps.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No opportunities scheduled</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Select a highlighted date to see details
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateOpps.map((opp) => {
                    const color = oppColorMap[opp.id];
                    const dateCommitments = getCommitmentsForOppOnDate(opp.id, selectedDateStr);
                    const confirmedCount = dateCommitments.filter(
                      (c) => c.status === "confirmed" || c.status === "in_progress"
                    ).length;
                    const pendingCount = dateCommitments.filter(
                      (c) => c.status === "pending"
                    ).length;
                    const hours = getOppHoursForDate(opp, selectedDateStr);
                    const isBlackout = (opp.blackout_dates || []).includes(selectedDateStr);

                    return (
                      <div
                        key={opp.id}
                        className={`rounded-lg border p-3 space-y-3 ${color?.border} ${color?.light}`}
                      >
                        {/* Opportunity header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color?.dot}`}
                              />
                              <p className={`font-semibold text-sm ${color?.text} truncate`}>
                                {opp.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {hours}h scheduled
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {confirmedCount}/{opp.slots_needed} confirmed
                              </span>
                              {pendingCount > 0 && (
                                <span className="text-yellow-600 font-medium">
                                  {pendingCount} pending
                                </span>
                              )}
                            </div>
                          </div>
                          <Link
                            to={`${createPageUrl("ManageOpportunities")}?focus=${opp.id}`}
                            title="Manage this opportunity"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 flex-shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>

                        {/* Volunteer slots progress */}
                        {opp.slots_needed > 0 && (
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Slots filled</span>
                              <span>
                                {confirmedCount}/{opp.slots_needed}
                              </span>
                            </div>
                            <div className="w-full bg-white rounded-full h-1.5 border border-gray-200">
                              <div
                                className={`h-1.5 rounded-full ${color?.dot}`}
                                style={{
                                  width: `${Math.min(
                                    (confirmedCount / opp.slots_needed) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Volunteer roster */}
                        {dateCommitments.length > 0 ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1.5">
                              Volunteers ({dateCommitments.length})
                            </p>
                            <div className="space-y-1.5">
                              {dateCommitments.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between gap-2 bg-white rounded-md px-2 py-1 border border-gray-100"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">
                                      {c.volunteer_name || c.volunteer_email}
                                    </p>
                                    {c.hours_committed && (
                                      <p className="text-[10px] text-gray-400">
                                        {c.hours_committed}h committed
                                      </p>
                                    )}
                                  </div>
                                  <StatusBadge status={c.status} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-1">
                            No volunteers signed up yet
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <Badge className={`text-[10px] py-0 h-4 flex-shrink-0 ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </Badge>
  );
}
