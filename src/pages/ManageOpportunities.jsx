import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Briefcase,
  Plus,
  Trash2,
  ChevronLeft,
  CheckCircle,
  Zap,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";

const EMPTY_OPP = {
  title: "",
  description: "",
  location: "",
  available_from: "",
  available_to: "",
  slots_needed: 1,
  min_age: 0,
  urgency: "medium",
  hours_needed: "",
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

function OpportunityForm({ initialData = EMPTY_OPP, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState({
    ...EMPTY_OPP,
    ...initialData,
    skills_needed: Array.isArray(initialData.skills_needed)
      ? initialData.skills_needed.join(", ")
      : initialData.skills_needed || "",
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error("Title and description are required.");
      return;
    }
    onSave({
      ...form,
      slots_needed: parseInt(form.slots_needed) || 1,
      min_age: parseInt(form.min_age) || 0,
      hours_needed: form.hours_needed ? parseInt(form.hours_needed) : null,
      skills_needed: form.skills_needed
        ? form.skills_needed.split(",").map((s) => s.trim()).filter(Boolean)
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

        <div>
          <Label>Available From</Label>
          <Input
            type="date"
            value={form.available_from}
            onChange={(e) => set("available_from", e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label>Available To</Label>
          <Input
            type="date"
            value={form.available_to}
            onChange={(e) => set("available_to", e.target.value)}
            className="mt-2"
          />
        </div>

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

        <div>
          <Label>Est. Hours per Volunteer</Label>
          <Input
            type="number"
            value={form.hours_needed}
            onChange={(e) => set("hours_needed", e.target.value)}
            className="mt-2"
          />
        </div>

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
              <Zap className="w-4 h-4 text-emerald-600" />
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
        <Button type="submit" disabled={isSaving} className="flex-1 bg-blue-900 hover:bg-blue-800">
          {isSaving ? "Saving..." : initialData.id ? "Save Changes" : "Add Opportunity"}
        </Button>
      </div>
    </form>
  );
}

export default function ManageOpportunities() {
  const { user, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["opportunities", user?.business_id],
    queryFn: () => entities.VolunteerOpportunity.filter({ business_id: user.business_id }),
    enabled: !!user?.business_id,
  });

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
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
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
            <Button
              className="bg-blue-900 hover:bg-blue-800"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Opportunity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="border-none shadow-sm">
              <CardContent className="pt-5">
                {editingId === opp.id ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-gray-900">Editing: {opp.title}</p>
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
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
                        <Badge className={`text-xs ${STATUS_COLORS[opp.status] || STATUS_COLORS.open}`}>
                          {opp.status}
                        </Badge>
                        <Badge className={`text-xs ${URGENCY_COLORS[opp.urgency] || URGENCY_COLORS.medium}`}>
                          {opp.urgency}
                        </Badge>
                        {opp.auto_accept && (
                          <Badge className="text-xs bg-emerald-100 text-emerald-700">
                            <Zap className="w-3 h-3 mr-0.5" /> Auto-accept
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{opp.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                        <span>{opp.slots_filled || 0}/{opp.slots_needed} volunteers filled</span>
                        {opp.available_from && (
                          <span>{opp.available_from}{opp.available_to ? ` – ${opp.available_to}` : ""}</span>
                        )}
                        {opp.hours_needed && <span>{opp.hours_needed}h per volunteer</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingId(opp.id); setShowAddForm(false); }}
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
