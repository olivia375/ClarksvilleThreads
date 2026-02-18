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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle, Plus, Trash2, Briefcase, ChevronRight, ChevronLeft, Zap } from "lucide-react";

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

const EMPTY_OPPORTUNITY = {
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
  auto_accept: false
};

export default function BusinessSignup() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, updateMe } = useAuth();
  const [step, setStep] = useState(1); // 1 = Business Info, 2 = Volunteer Opportunities

  const [businessData, setBusinessData] = useState({
    name: "",
    category: "",
    description: "",
    address: "",
    email: "",
    min_volunteer_age: 0
  });

  const [opportunities, setOpportunities] = useState([{ ...EMPTY_OPPORTUNITY }]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.is_business_owner) {
      navigate(createPageUrl("BusinessDashboard"));
    }
  }, [user, navigate]);

  // Step 1 submit: validate business fields then advance to step 2
  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError("");
    if (!businessData.name || !businessData.category || !businessData.description) {
      setError("Please fill in all required fields");
      return;
    }
    setStep(2);
    window.scrollTo(0, 0);
  };

  // Opportunity helpers
  const addOpportunity = () => setOpportunities(prev => [...prev, { ...EMPTY_OPPORTUNITY }]);

  const removeOpportunity = (idx) => {
    if (opportunities.length === 1) return; // must keep at least one
    setOpportunities(prev => prev.filter((_, i) => i !== idx));
  };

  const updateOpportunity = (idx, field, value) => {
    setOpportunities(prev => prev.map((opp, i) => i === idx ? { ...opp, [field]: value } : opp));
  };

  const signupMutation = useMutation({
    mutationFn: async () => {
      // Validate opportunities
      for (const opp of opportunities) {
        if (!opp.title || !opp.description) {
          throw new Error("Each opportunity must have a role/title and description");
        }
      }

      // Create business
      const business = await entities.Business.create({
        ...businessData,
        verified: false,
        needs_help: true,
        average_rating: 0,
        review_count: 0
      });

      // Create all opportunities
      await Promise.all(opportunities.map(opp =>
        entities.VolunteerOpportunity.create({
          title: opp.title,
          description: opp.description,
          location: opp.location,
          available_from: opp.available_from,
          available_to: opp.available_to,
          slots_needed: parseInt(opp.slots_needed) || 1,
          slots_filled: 0,
          min_age: parseInt(opp.min_age) || 0,
          urgency: opp.urgency,
          hours_needed: opp.hours_needed ? parseInt(opp.hours_needed) : null,
          skills_needed: opp.skills_needed ? opp.skills_needed.split(',').map(s => s.trim()).filter(Boolean) : [],
          special_offer: opp.special_offer,
          auto_accept: opp.auto_accept,
          status: "open",
          business_id: business.id,
          business_name: business.name
        })
      ));

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

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setError("");
    signupMutation.mutate();
  };

  // ── Not signed in ──
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
                {[
                  "Post volunteer opportunities with roles, dates, and requirements",
                  "Receive and manage volunteer applications",
                  "Auto-accept or manually review volunteers per opportunity",
                  "View your confirmed volunteer roster with contact info"
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
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
      {/* Header */}
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

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mt-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            step === 1 ? 'bg-blue-900 text-white' : 'bg-green-100 text-green-700'
          }`}>
            {step > 1 ? <CheckCircle className="w-4 h-4" /> : <span>1</span>}
            Business Info
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            step === 2 ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <span>2</span>
            Volunteer Opportunities
          </div>
        </div>
      </div>

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Business registered successfully! Redirecting to your dashboard...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Step 1: Business Info ── */}
      {step === 1 && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={businessData.name}
                  onChange={(e) => setBusinessData({...businessData, name: e.target.value})}
                  placeholder="Your business name"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={businessData.category}
                  onValueChange={(value) => setBusinessData({...businessData, category: value})}
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
                  value={businessData.description}
                  onChange={(e) => setBusinessData({...businessData, description: e.target.value})}
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
                  value={businessData.address}
                  onChange={(e) => setBusinessData({...businessData, address: e.target.value})}
                  placeholder="123 Main St, Clarksville, TN"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={businessData.email}
                  onChange={(e) => setBusinessData({...businessData, email: e.target.value})}
                  placeholder="contact@yourbusiness.com"
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="min_age">Default Minimum Volunteer Age</Label>
                <Input
                  id="min_age"
                  type="number"
                  value={businessData.min_volunteer_age}
                  onChange={(e) => setBusinessData({...businessData, min_volunteer_age: parseInt(e.target.value) || 0})}
                  min="0"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">Set to 0 for no age requirement. You can override this per opportunity.</p>
              </div>

              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">
                Continue to Volunteer Opportunities
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Volunteer Opportunities ── */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Add at least one volunteer opportunity to get started. You can always add more from your dashboard.
            </AlertDescription>
          </Alert>

          {opportunities.map((opp, idx) => (
            <Card key={idx} className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Opportunity #{idx + 1}
                    {opp.title && (
                      <span className="ml-2 text-base font-normal text-gray-500">— {opp.title}</span>
                    )}
                  </CardTitle>
                  {opportunities.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOpportunity(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Role / Title */}
                <div>
                  <Label>Role / Title *</Label>
                  <Input
                    value={opp.title}
                    onChange={(e) => updateOpportunity(idx, 'title', e.target.value)}
                    placeholder="e.g., Event Assistant, Kitchen Helper, Social Media Volunteer"
                    required
                    className="mt-2"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={opp.description}
                    onChange={(e) => updateOpportunity(idx, 'description', e.target.value)}
                    placeholder="Describe what volunteers will be doing, what to expect..."
                    rows={3}
                    required
                    className="mt-2"
                  />
                </div>

                {/* Location */}
                <div>
                  <Label>Volunteer Location / Address</Label>
                  <Input
                    value={opp.location}
                    onChange={(e) => updateOpportunity(idx, 'location', e.target.value)}
                    placeholder="e.g., 123 Main St (leave blank to use your business address)"
                    className="mt-2"
                  />
                </div>

                {/* Dates */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Available From</Label>
                    <Input
                      type="date"
                      value={opp.available_from}
                      onChange={(e) => updateOpportunity(idx, 'available_from', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Available To</Label>
                    <Input
                      type="date"
                      value={opp.available_to}
                      onChange={(e) => updateOpportunity(idx, 'available_to', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Volunteers Needed + Min Age */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Volunteers Needed *</Label>
                    <Input
                      type="number"
                      value={opp.slots_needed}
                      onChange={(e) => updateOpportunity(idx, 'slots_needed', e.target.value)}
                      min="1"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Minimum Age Requirement</Label>
                    <Input
                      type="number"
                      value={opp.min_age}
                      onChange={(e) => updateOpportunity(idx, 'min_age', e.target.value)}
                      min="0"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = no age requirement</p>
                  </div>
                </div>

                {/* Priority + Est. Hours */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={opp.urgency}
                      onValueChange={(value) => updateOpportunity(idx, 'urgency', value)}
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
                    <Label>Estimated Hours per Volunteer</Label>
                    <Input
                      type="number"
                      value={opp.hours_needed}
                      onChange={(e) => updateOpportunity(idx, 'hours_needed', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <Label>Skills Needed (comma-separated)</Label>
                  <Input
                    value={opp.skills_needed}
                    onChange={(e) => updateOpportunity(idx, 'skills_needed', e.target.value)}
                    placeholder="Marketing, Social Media, Writing"
                    className="mt-2"
                  />
                </div>

                {/* Volunteer Perk */}
                <div>
                  <Label>Volunteer Perk / Special Offer (Optional)</Label>
                  <Input
                    value={opp.special_offer}
                    onChange={(e) => updateOpportunity(idx, 'special_offer', e.target.value)}
                    placeholder="e.g., Free meal, 20% discount coupon"
                    className="mt-2"
                  />
                </div>

                {/* Auto-Accept Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      Auto-Accept Volunteers
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Qualifying volunteers are confirmed immediately without manual review.
                    </p>
                  </div>
                  <Switch
                    checked={opp.auto_accept}
                    onCheckedChange={(checked) => updateOpportunity(idx, 'auto_accept', checked)}
                  />
                </div>

              </CardContent>
            </Card>
          ))}

          {/* Add Another Opportunity */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addOpportunity}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Opportunity
          </Button>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setStep(1); setError(""); window.scrollTo(0, 0); }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="flex-1 bg-blue-900 hover:bg-blue-800"
            >
              {signupMutation.isPending ? "Registering Business..." : "Register Business & Post Opportunities"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
