import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { entities } from "@/api/gcpClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Briefcase,
  Plus,
  Trash2,
  ChevronLeft,
  Zap,
  Pencil,
  X,
  CalendarDays,
  Repeat,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY = format(new Date(), "yyyy-MM-dd");

const EMPTY_OPP = {
  title: "",
  description: "",
  location: "",
  schedule_type: "one_time",
  event_date: "",
  event_hours: 4,
  recurring_days: [],
  recurring_hours_per_day: 4,
  recurring_start_date: "",
  recurring_end_date: "",
  blackout_dates: [],
  date_overrides: {},
  slots_needed: 1,
  min_age: 0,
  urgency: "medium",
  skills_needed: "",
  special_offer: "",
  auto_accept: false,
};

const STATUS_COLORS = {
  open: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  filled: "bg-purple-100 text-purple-700",
};

const URGENCY_COLORS = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

function normalizeInitialData(data) {
  return {
    ...EMPTY_OPP,
    ...data,
    schedule_type: data.schedule_type || "one_time",
    event_date: data.event_date || data.available_from || "",
    event_hours: data.event_hours || data.hours_needed || 4,
    recurring_days: data.recurring_days || [],
    recurring_hours_per_day: data.recurring_hours_per_day || data.hours_needed || 4,
    recurring_start_date: data.recurring_start_date || data.available_from || "",
    recurring_end_date: data.recurring_end_date || data.available_to || "",
    blackout_dates: data.blackout_dates || [],
    date_overrides: data.date_overrides || {},
    skills_needed: Array.isArray(data.skills_needed)
      ? data.skills_needed.join(", ")
      : data.skills_needed || "",
  };
}

function ScheduleBuilder({ form, set }) {
  const [blackoutInput, setBlackoutInput] = useState("");
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideHours, setOverrideHours] = useState("");

  const toggleDay = (dayIndex) => {
    const days = form.recurring_days || [];
    if (days.includes(dayIndex)) {
      set("recurring_days", days.filter((d) => d !== dayIndex));
    } else {
      set("recurring_days", [...days, dayIndex].sort((a, b) => a - b));
    }
  };

  const addBlackout = () => {
    if (!blackoutInput) return;
    const dates = form.blackout_dates || [];
    if (!dates.includes(blackoutInput)) {
      set("blackout_dates", [...dates, blackoutInput].sort());
    }
    setBlackoutInput("");
  };

  const removeBlackout = (date) => {
    set("blackout_dates", (form.blackout_dates || []).filter((d) => d !== date));
  };

  const addOverride = () => {
    if (!overrideDate || !overrideHours) return;
    const h = Math.min(12, Math.max(1, parseInt(overrideHours) || 1));
    set("date_overrides", { ...(form.date_overrides || {}), [overrideDate]: { hours: h } });
    setOverrideDate("");
    setOverrideHours("");
  };

  const removeOverride = (date) => {
    const overrides = { ...(form.date_overrides || {}) };
    delete overrides[date];
    set("date_overrides", overrides);
  };

  return (
    <div className="space-y-5">
      {/* Schedule type toggle */}
      <div>
        <Label className="mb-3 block">Schedule Type</Label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => set("schedule_type", "one_time")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
              form.schedule_type === "one_time"
                ? "border-blue-900 bg-blue-50 text-blue-900"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            One-time Event
          </button>
          <button
            type="button"
            onClick={() => set("schedule_type", "recurring")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
              form.schedule_type === "recurring"
                ? "border-blue-900 bg-blue-50 text-blue-900"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            <Repeat className="w-4 h-4" />
            Recurring
          </button>
        </div>
      </div>

      {form.schedule_type === "one_time" ? (
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <Label>Event Date *</Label>
            <Input
              type="date"
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
              min={TODAY}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Hours Needed (max 12) *</Label>
            <Input
              type="number"
              min="1"
              max="12"
              value={form.event_hours}
              onChange={(e) =>
                set("event_hours", Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))
              }
              className="mt-2"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
          {/* Days of week */}
          <div>
            <Label className="mb-2 block">Days of the Week *</Label>
            <div className="flex gap-2 flex-wrap">
              {DAY_LABELS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`w-12 h-12 rounded-lg text-sm font-semibold transition-colors ${
                    (form.recurring_days || []).includes(i)
                      ? "bg-blue-900 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Hours + date range */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Default Hours/Day (max 12) *</Label>
              <Input
                type="number"
                min="1"
                max="12"
                value={form.recurring_hours_per_day}
                onChange={(e) =>
                  set(
                    "recurring_hours_per_day",
                    Math.min(12, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={form.recurring_start_date}
                onChange={(e) => set("recurring_start_date", e.target.value)}
                min={TODAY}
                className="mt-2"
              />
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <Input
                type="date"
                value={form.recurring_end_date}
                onChange={(e) => set("recurring_end_date", e.target.value)}
                min={form.recurring_start_date || TODAY}
                className="mt-2"
              />
            </div>
          </div>

          {/* Blackout dates */}
          <div>
            <Label>Dates Not Needed (Blackout)</Label>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">
              Mark specific dates when volunteers aren&apos;t needed
            </p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={blackoutInput}
                onChange={(e) => setBlackoutInput(e.target.value)}
                className="flex-1"
                min={TODAY}
              />
              <Button type="button" variant="outline" onClick={addBlackout} size="sm">
                Add
              </Button>
            </div>
            {(form.blackout_dates || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.blackout_dates.map((date) => (
                  <Badge
                    key={date}
                    variant="secondary"
                    className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200"
                  >
                    {date}
                    <button type="button" onClick={() => removeBlackout(date)} className="ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Date-specific hour overrides */}
          <div>
            <Label>Custom Hours for Specific Dates</Label>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">
              Override the default hours for a particular date
            </p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="flex-1"
                min={TODAY}
              />
              <Input
                type="number"
                min="1"
                max="12"
                value={overrideHours}
                onChange={(e) => setOverrideHours(e.target.value)}
                placeholder="Hrs"
                className="w-20"
              />
              <Button type="button" variant="outline" onClick={addOverride} size="sm">
                Set
              </Button>
            </div>
            {Object.keys(form.date_overrides || {}).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(form.date_overrides).map(([date, { hours }]) => (
                  <Badge
                    key={date}
                    variant="secondary"
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {date}: {hours}h
                    <button type="button" onClick={() => removeOverride(date)} className="ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OpportunityForm({ initialData = EMPTY_OPP, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(normalizeInitialData(initialData));
  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error("Title and description are required.");
      return;
    }
    if (form.schedule_type === "one_time" && !form.event_date) {
      toast.error("Please select an event date.");
      return;
    }
    if (form.schedule_type === "recurring" && (form.recurring_days || []).length === 0) {
      toast.error("Please select at least one day of the week.");
      return;
    }
    if (form.schedule_type === "recurring" && !form.recurring_start_date) {
      toast.error("Please set a start date for the recurring schedule.");
      return;
    }

    const hours =
      form.schedule_type === "one_time" ? form.event_hours : form.recurring_hours_per_day;
    const available_from =
      form.schedule_type === "one_time" ? form.event_date : form.recurring_start_date;
    const available_to =
      form.schedule_type === "one_time"
        ? form.event_date
        : form.recurring_end_date || null;

    onSave({
      ...form,
      slots_needed: parseInt(form.slots_needed) || 1,
      min_age: parseInt(form.min_age) || 0,
      event_hours: parseInt(form.event_hours) || 4,
      recurring_hours_per_day: parseInt(form.recurring_hours_per_day) || 4,
      hours_needed: parseInt(hours) || 4,
      available_from,
      available_to,
      skills_needed: form.skills_needed
        ? form.skills_needed
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Label>Role / Title *</Label>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g., Event Assistant, Kitchen Helper"
            required
            className="mt-2"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Description *</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What will volunteers be doing?"
            rows={3}
            required
            className="mt-2"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Volunteer Location</Label>
          <Input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Leave blank to use your business address"
            className="mt-2"
          />
        </div>
      </div>

      {/* Schedule section */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-900" />
          Schedule
        </h3>
        <ScheduleBuilder form={form} set={set} />
      </div>

      <div className="grid md:grid-cols-2 gap-5 border-t border-gray-100 pt-5">
        <div>
          <Label>Volunteers Needed *</Label>
          <Input
            type="number"
            min="1"
            value={form.slots_needed}
            onChange={(e) => set("slots_needed", e.target.value)}
            required
            className="mt-2"
          />
        </div>
        <div>
          <Label>Min Age (0 = none)</Label>
          <Input
            type="number"
            min="0"
            value={form.min_age}
            onChange={(e) => set("min_age", e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Priority</Label>
          <Select value={form.urgency} onValueChange={(v) => set("urgency", v)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {initialData.id && (
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="md:col-span-2">
          <Label>Skills Needed (comma-separated)</Label>
          <Input
            value={form.skills_needed}
            onChange={(e) => set("skills_needed", e.target.value)}
            placeholder="e.g., Marketing, Writing, Social Media"
            className="mt-2"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Volunteer Perk / Special Offer</Label>
          <Input
            value={form.special_offer}
            onChange={(e) => set("special_offer", e.target.value)}
            placeholder="e.g., Free meal, 20% discount"
            className="mt-2"
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50">
          <div>
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Auto-Accept Volunteers
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Qualifying volunteers are confirmed immediately.
            </p>
          </div>
          <Switch
            checked={form.auto_accept}
            onCheckedChange={(checked) => set("auto_accept", checked)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="flex-1 bg-blue-900 hover:bg-blue-800"
        >
          {isSaving ? "Saving..." : initialData.id ? "Save Changes" : "Add Opportunity"}
        </Button>
      </div>
    </form>
  );
}

function ScheduleSummary({ opp }) {
  if (opp.schedule_type === "one_time" && opp.event_date) {
    return (
      <span className="flex items-center gap-1">
        <CalendarDays className="w-3 h-3" />
        {opp.event_date} · {opp.event_hours || opp.hours_needed || "?"}h
      </span>
    );
  }
  if (opp.schedule_type === "recurring") {
    const days = (opp.recurring_days || []).map((d) => DAY_LABELS[d]).join(", ");
    return (
      <span className="flex items-center gap-1">
        <Repeat className="w-3 h-3" />
        {days || "No days set"}
        {(opp.recurring_hours_per_day || opp.hours_needed) && (
          <> · {opp.recurring_hours_per_day || opp.hours_needed}h/day</>
        )}
        {opp.recurring_start_date && <> from {opp.recurring_start_date}</>}
      </span>
    );
  }
  // Legacy
  if (opp.available_from) {
    return (
      <span>
        {opp.available_from}
        {opp.available_to ? ` – ${opp.available_to}` : ""}
        {opp.hours_needed ? ` · ${opp.hours_needed}h` : ""}
      </span>
    );
  }
  return null;
}

export default function ManageOpportunities() {
  const { user, isLoadingAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const focusId = searchParams.get("focus");

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["opportunities", user?.business_id],
    queryFn: () => entities.VolunteerOpportunity.filter({ business_id: user.business_id }),
    enabled: !!user?.business_id,
  });

  // Auto-open the focused opportunity
  useEffect(() => {
    if (focusId && opportunities.some((o) => o.id === focusId)) {
      setEditingId(focusId);
      setShowAddForm(false);
    }
  }, [focusId, opportunities]);

  const createMutation = useMutation({
    mutationFn: (data) =>
      entities.VolunteerOpportunity.create({
        ...data,
        status: "open",
        slots_filled: 0,
        business_id: user.business_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["opportunities", user?.business_id]);
      setShowAddForm(false);
      toast.success("Opportunity added.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add opportunity.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.VolunteerOpportunity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["opportunities", user?.business_id]);
      setEditingId(null);
      toast.success("Opportunity updated.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update opportunity.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.VolunteerOpportunity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["opportunities", user?.business_id]);
      toast.success("Opportunity deleted.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete opportunity.");
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
        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business account required</h2>
        <p className="text-gray-600 mb-6">Only business owners can manage opportunities.</p>
        <Link to={createPageUrl("BusinessSignup")}>
          <Button className="bg-blue-900 hover:bg-blue-800">Register Your Business</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={createPageUrl("BusinessDashboard")}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Manage Opportunities</h1>
          <p className="text-gray-500 text-sm">Add, edit, or remove volunteer roles</p>
        </div>
        {!showAddForm && (
          <Button
            className="bg-blue-900 hover:bg-blue-800"
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Opportunity
          </Button>
        )}
      </div>

      {/* Add New Form */}
      {showAddForm && (
        <Card className="border-none shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg">New Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <OpportunityForm
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setShowAddForm(false)}
              isSaving={createMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Opportunity List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900" />
        </div>
      ) : opportunities.length === 0 && !showAddForm ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-16 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No opportunities yet.</p>
            <Button className="bg-blue-900 hover:bg-blue-800" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Opportunity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <Card
              key={opp.id}
              id={`opp-${opp.id}`}
              className={`border-none shadow-sm ${editingId === opp.id ? "ring-2 ring-blue-900" : ""}`}
            >
              <CardContent className="pt-5">
                {editingId === opp.id ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-gray-900">Editing: {opp.title}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <OpportunityForm
                      initialData={opp}
                      onSave={(data) => updateMutation.mutate({ id: opp.id, data })}
                      onCancel={() => setEditingId(null)}
                      isSaving={updateMutation.isPending}
                    />
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900">{opp.title}</p>
                        <Badge
                          className={`text-xs ${STATUS_COLORS[opp.status] || STATUS_COLORS.open}`}
                        >
                          {opp.status}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            URGENCY_COLORS[opp.urgency] || URGENCY_COLORS.medium
                          }`}
                        >
                          {opp.urgency}
                        </Badge>
                        {opp.auto_accept && (
                          <Badge className="text-xs bg-blue-100 text-blue-700">
                            <Zap className="w-3 h-3 mr-0.5" /> Auto-accept
                          </Badge>
                        )}
                        {opp.schedule_type === "recurring" ? (
                          <Badge className="text-xs bg-purple-100 text-purple-700">
                            <Repeat className="w-3 h-3 mr-0.5" /> Recurring
                          </Badge>
                        ) : opp.schedule_type === "one_time" ? (
                          <Badge className="text-xs bg-blue-100 text-blue-700">
                            <CalendarDays className="w-3 h-3 mr-0.5" /> One-time
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{opp.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                        <span>{opp.slots_filled || 0}/{opp.slots_needed} volunteers filled</span>
                        <ScheduleSummary opp={opp} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(opp.id);
                          setShowAddForm(false);
                        }}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm(`Delete "${opp.title}"?`)) {
                            deleteMutation.mutate(opp.id);
                          }
                        }}
                        title="Delete"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
