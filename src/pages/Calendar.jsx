import React, { useState, useEffect } from "react";
import { entities } from "@/api/gcpClient";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Clock, MapPin, CheckCircle, AlertCircle, Loader, Edit2, Save, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday } from "date-fns";

const STATUS_COLORS = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  confirmed: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  completed: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" }
};

const STATUS_ICONS = {
  pending: AlertCircle,
  confirmed: CheckCircle,
  in_progress: Loader,
  completed: CheckCircle,
  cancelled: AlertCircle
};

export default function Calendar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingHours, setEditingHours] = useState(false);
  const [tempHours, setTempHours] = useState("");

  const { data: commitments = [], isLoading } = useQuery({
    queryKey: ['calendar_commitments', user?.email],
    queryFn: () => user ? entities.VolunteerCommitment.filter({ volunteer_email: user.email }) : [],
    enabled: !!user
  });

  const { data: monthlyOverride } = useQuery({
    queryKey: ['monthly_availability', user?.email, currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: async () => {
      const overrides = await entities.MonthlyAvailability.filter({
        user_email: user.email,
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear()
      });
      return overrides[0] || null;
    },
    enabled: !!user
  });

  const updateMonthlyAvailability = useMutation({
    mutationFn: async (hours) => {
      const existing = await entities.MonthlyAvailability.filter({
        user_email: user.email,
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear()
      });

      if (existing.length > 0) {
        return entities.MonthlyAvailability.update(existing[0].id, {
          hours_available: parseInt(hours)
        });
      } else {
        return entities.MonthlyAvailability.create({
          user_email: user.email,
          month: currentMonth.getMonth() + 1,
          year: currentMonth.getFullYear(),
          hours_available: parseInt(hours)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['monthly_availability']);
      setEditingHours(false);
    }
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Use monthly override if exists, otherwise use default
  const monthlyHoursAvailable = monthlyOverride?.hours_available ?? user?.hours_available ?? 0;

  // Calculate scheduled hours for the CURRENT VIEWING MONTH (not today's month)
  const scheduledHoursThisMonth = commitments
    .filter(c => {
      if (!c.start_date || c.status === 'cancelled') return false;
      try {
        const commitmentDate = parseISO(c.start_date);
        return commitmentDate.getMonth() === currentMonth.getMonth() && 
               commitmentDate.getFullYear() === currentMonth.getFullYear() &&
               (c.status === 'confirmed' || c.status === 'in_progress');
      } catch {
        return false;
      }
    })
    .reduce((sum, c) => sum + (c.hours_committed || 0), 0);

  const hoursAvailable = monthlyHoursAvailable - scheduledHoursThisMonth;

  const selectedDateCommitments = commitments.filter(commitment => {
    if (!commitment.start_date) return false;
    try {
      return isSameDay(parseISO(commitment.start_date), selectedDate);
    } catch {
      return false;
    }
  });

  const hasCommitments = (date) => {
    return commitments.some(commitment => {
      if (!commitment.start_date) return false;
      try {
        return isSameDay(parseISO(commitment.start_date), date);
      } catch {
        return false;
      }
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleSaveHours = () => {
    if (tempHours) {
      updateMonthlyAvailability.mutate(tempHours);
    }
  };

  const handleStartEdit = () => {
    setTempHours(monthlyHoursAvailable.toString());
    setEditingHours(true);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          My Volunteer Calendar
        </h1>
        <p className="text-lg text-gray-600">
          View and manage your volunteer commitments
        </p>
      </div>

      {/* Hours Overview Card */}
      <Card className="mb-8 border-none shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardContent className="p-6">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Default Available</p>
              <p className="text-3xl font-bold text-gray-600">{user.hours_available || 0}h</p>
              <p className="text-xs text-gray-500 mt-1">base per month</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Available for {format(currentMonth, 'MMMM')}</p>
              {editingHours ? (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Input
                    type="number"
                    value={tempHours}
                    onChange={(e) => setTempHours(e.target.value)}
                    className="w-20 text-center"
                    min="0"
                  />
                  <Button size="sm" onClick={handleSaveHours} disabled={updateMonthlyAvailability.isPending}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingHours(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-bold text-blue-600">{monthlyHoursAvailable}h</p>
                    <Button size="sm" variant="ghost" onClick={handleStartEdit}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {monthlyOverride && (
                    <p className="text-xs text-blue-600 mt-1">custom for this month</p>
                  )}
                </>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Scheduled</p>
              <p className="text-3xl font-bold text-emerald-600">{scheduledHoursThisMonth}h</p>
              <p className="text-xs text-gray-500 mt-1">
                {hoursAvailable}h remaining
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <button
                  onClick={previousMonth}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={nextMonth}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Month days */}
              {monthDays.map(day => {
                const hasCommit = hasCommitments(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentDay = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square rounded-lg p-2 text-sm transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold'
                        : isCurrentDay
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : hasCommit
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span>{format(day, 'd')}</span>
                      {hasCommit && !isSelected && (
                        <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded" />
                <span className="text-gray-600">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-50 rounded" />
                <span className="text-gray-600">Has Commitments</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                {format(selectedDate, 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                </div>
              ) : selectedDateCommitments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No commitments scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateCommitments.map(commitment => {
                    const StatusIcon = STATUS_ICONS[commitment.status];
                    const statusColor = STATUS_COLORS[commitment.status];
                    
                    return (
                      <div
                        key={commitment.id}
                        className={`p-4 rounded-lg border-2 ${statusColor.border} ${statusColor.bg}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {commitment.business_name}
                          </h4>
                          <StatusIcon className={`w-5 h-5 ${statusColor.text}`} />
                        </div>
                        
                        <Badge className={`${statusColor.bg} ${statusColor.text} mb-3`}>
                          {commitment.status.replace('_', ' ')}
                        </Badge>

                        {commitment.hours_committed && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                            <Clock className="w-4 h-4" />
                            <span>{commitment.hours_committed} hours</span>
                          </div>
                        )}

                        {commitment.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            {commitment.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Commitments</span>
                <span className="font-bold text-gray-900">{commitments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-bold text-yellow-600">
                  {commitments.filter(c => c.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confirmed Applications</span>
                <span className="font-bold text-green-600">
                  {commitments.filter(c => c.status === 'confirmed').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed</span>
                <span className="font-bold text-purple-600">
                  {commitments.filter(c => c.status === 'completed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}