import React, { useState, useEffect } from "react";
import { entities } from "@/api/gcpClient";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, CheckCircle } from "lucide-react";

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

export default function BusinessSignup() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, updateMe } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    address: "",
    email: "",
    min_volunteer_age: 16
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.is_business_owner) {
      navigate(createPageUrl("BusinessDashboard"));
    }
  }, [user, navigate]);

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      // Create business
      const business = await entities.Business.create({
        ...data,
        verified: false,
        needs_help: true,
        average_rating: 0,
        review_count: 0
      });

      // Update user as business owner
      await updateMe({
        business_id: business.id,
        is_business_owner: true
      });

      return business;
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl("BusinessDashboard"));
      }, 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to register business");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.name || !formData.category || !formData.description) {
      setError("Please fill in all required fields");
      return;
    }

    signupMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Register Your Business</CardTitle>
                <p className="text-gray-600">Connect with local volunteers</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                To register your business, you'll need to create an account first.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">What you'll get:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Post unlimited volunteer opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Receive and manage volunteer applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Connect with skilled local volunteers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Build your business profile and reputation</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => signInWithGoogle()}
              className="w-full bg-blue-900 hover:bg-blue-800"
              size="lg"
            >
              Create Account / Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Register Your Business</h1>
            <p className="text-gray-600">Join our platform and connect with local volunteers</p>
          </div>
        </div>
      </div>

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Business registered successfully! Redirecting to dashboard...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Your business name"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
                required
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tell volunteers about your business and mission..."
                rows={4}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="123 Main St, City, State"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email">Contact Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="contact@yourbusiness.com"
                required
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
              <p className="text-sm text-gray-500 mt-1">Set to 0 for no age requirement</p>
            </div>

            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full bg-blue-900 hover:bg-blue-800"
            >
              {signupMutation.isPending ? "Registering..." : "Register Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}