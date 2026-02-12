import React, { useState } from "react";
import { entities } from "@/api/gcpClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";

const URGENCY_COLORS = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

export default function OpportunityManager({ business, opportunities }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skills_needed: "",
    hours_needed: "",
    urgency: "medium",
    status: "open",
    special_offer: "",
    slots_needed: 0
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.VolunteerOpportunity.create({
      ...data,
      business_id: business.id,
      business_name: business.name,
      skills_needed: data.skills_needed ? data.skills_needed.split(',').map(s => s.trim()) : [],
      hours_needed: data.hours_needed ? parseInt(data.hours_needed) : null,
      slots_needed: parseInt(data.slots_needed) || 0,
      slots_filled: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['business_opportunities']);
      setShowDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.VolunteerOpportunity.update(id, {
      ...data,
      skills_needed: data.skills_needed ? data.skills_needed.split(',').map(s => s.trim()) : [],
      hours_needed: data.hours_needed ? parseInt(data.hours_needed) : null,
      slots_needed: parseInt(data.slots_needed) || 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['business_opportunities']);
      setShowDialog(false);
      setEditingOpp(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.VolunteerOpportunity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['business_opportunities']);
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      skills_needed: "",
      hours_needed: "",
      urgency: "medium",
      status: "open",
      special_offer: "",
      slots_needed: 0
    });
  };

  const handleEdit = (opp) => {
    setEditingOpp(opp);
    setFormData({
      title: opp.title,
      description: opp.description,
      skills_needed: opp.skills_needed?.join(', ') || "",
      hours_needed: opp.hours_needed || "",
      urgency: opp.urgency,
      status: opp.status,
      special_offer: opp.special_offer || "",
      slots_needed: opp.slots_needed || 0
    });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingOpp) {
      updateMutation.mutate({ id: editingOpp.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Volunteer Opportunities</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-900 hover:bg-blue-800" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Post New Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOpp ? "Edit Opportunity" : "Post New Opportunity"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  required
                  className="mt-2"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency">Priority</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({...formData, urgency: value})}
                  >
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

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hours">Estimated Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    value={formData.hours_needed}
                    onChange={(e) => setFormData({...formData, hours_needed: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="slots">Number of Volunteers Needed</Label>
                  <Input
                    id="slots"
                    type="number"
                    value={formData.slots_needed}
                    onChange={(e) => setFormData({...formData, slots_needed: e.target.value})}
                    min="0"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for unlimited</p>
                </div>
              </div>

              <div>
                <Label htmlFor="skills">Skills Needed (comma-separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills_needed}
                  onChange={(e) => setFormData({...formData, skills_needed: e.target.value})}
                  placeholder="Marketing, Social Media, Writing"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="offer">Special Offer/Perk (Optional)</Label>
                <Input
                  id="offer"
                  value={formData.special_offer}
                  onChange={(e) => setFormData({...formData, special_offer: e.target.value})}
                  placeholder="e.g., Free meal, 20% discount coupon"
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowDialog(false);
                  setEditingOpp(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-900 hover:bg-blue-800">
                  {editingOpp ? "Update" : "Post"} Opportunity
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {opportunities.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No opportunities posted yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {opportunities.map(opp => (
            <Card key={opp.id} className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{opp.title}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={URGENCY_COLORS[opp.urgency]}>
                        {opp.urgency} priority
                      </Badge>
                      <Badge variant={opp.status === 'open' ? 'default' : 'secondary'}>
                        {opp.status}
                      </Badge>
                      {opp.slots_needed > 0 && (
                        <Badge variant="outline">
                          {opp.slots_filled || 0} / {opp.slots_needed} volunteers
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(opp)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(opp.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">{opp.description}</p>
                {opp.hours_needed && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Estimated: {opp.hours_needed} hours</span>
                  </div>
                )}
                {opp.skills_needed?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Skills:</p>
                    <div className="flex gap-2 flex-wrap">
                      {opp.skills_needed.map(skill => (
                        <Badge key={skill} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {opp.special_offer && (
                  <p className="text-sm text-purple-700"><strong>Perk:</strong> {opp.special_offer}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}