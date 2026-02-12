import React, { useState } from "react";
import { entities } from "@/api/gcpClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Save } from "lucide-react";

const CATEGORIES = [
  { value: "food", label: "Food & Restaurants" },
  { value: "retail", label: "Retail & Shopping" },
  { value: "services", label: "Services" },
  { value: "nonprofit", label: "Nonprofits" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "arts", label: "Arts & Culture" },
  { value: "environment", label: "Environment" },
  { value: "other", label: "Other" }
];

export default function BusinessProfileEditor({ business, onUpdate }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: business.name,
    category: business.category,
    description: business.description,
    address: business.address || "",
    email: business.email,
    min_volunteer_age: business.min_volunteer_age || 16
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => entities.Business.update(business.id, data),
    onSuccess: (updatedBusiness) => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onUpdate(updatedBusiness);
      queryClient.invalidateQueries(['business']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>Edit Business Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {saveSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({...formData, category: value})}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="min_age">Minimum Volunteer Age</Label>
            <Input
              id="min_age"
              type="number"
              value={formData.min_volunteer_age}
              onChange={(e) => setFormData({...formData, min_volunteer_age: parseInt(e.target.value)})}
              min="0"
              className="mt-2"
            />
          </div>

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-blue-900 hover:bg-blue-800"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}