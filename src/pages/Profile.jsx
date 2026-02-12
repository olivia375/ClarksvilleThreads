
import React, { useState, useEffect } from "react";
import { entities, integrations } from "@/api/gcpClient";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Award, Clock, MapPin, X, Plus, Save, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const COMMON_SKILLS = [
  "Marketing", "Social Media", "Customer Service", "Accounting", "Writing",
  "Design", "Photography", "Web Development", "Teaching", "Event Planning",
  "Fundraising", "Data Entry", "Translation", "Consulting", "Manual Labor"
];

const INTEREST_CATEGORIES = [
  "Food & Restaurants", "Retail & Shopping", "Nonprofits", "Education",
  "Healthcare", "Arts & Culture", "Environment", "Community Services"
];

export default function Profile() {
  const queryClient = useQueryClient();
  const { user, updateMe } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    hours_available: "",
    skills: [],
    interests: [],
    location: "",
    bio: "",
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        age: user.age || "",
        hours_available: user.hours_available || "",
        skills: user.skills || [],
        interests: user.interests || [],
        location: user.location || "",
        bio: user.bio || "",
      });
      if (!user.age && !user.hours_available) {
        setIsEditing(true);
      }
    }
  }, [user]);

  const { data: commitments = [] } = useQuery({
    queryKey: ['commitments', user?.email],
    queryFn: () => user ? entities.VolunteerCommitment.filter({ volunteer_email: user.email }) : [],
    enabled: !!user
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const isFirstTimeSetup = !user.age && !user.hours_available;
      const updatedUser = await updateMe(data);
      
      // Send welcome email on first profile completion
      if (isFirstTimeSetup && (data.age || data.hours_available)) {
        await integrations.Core.SendEmail({
          from_name: "CommunityConnect",
          to: user.email,
          subject: "Welcome to CommunityConnect! 🎉",
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CommunityConnect!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.full_name}! 👋</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Thank you for completing your volunteer profile! We're excited to connect you with local businesses and nonprofits that need your help.
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ec4899;">
                  <h3 style="color: #ec4899; margin-top: 0;">What's Next?</h3>
                  <ul style="color: #4b5563; line-height: 1.8;">
                    <li>Browse volunteer opportunities that match your skills</li>
                    <li>Apply to help local businesses in your community</li>
                    <li>Track your volunteer hours and impact</li>
                    <li>Receive special offers from businesses you help</li>
                  </ul>
                </div>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  <strong>Pro Tip:</strong> Check the "Recommended For You" section on the Explore page to find opportunities that match your interests!
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://communityconnect.com/explore" style="background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Explore Opportunities
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  Thank you for joining us in strengthening local communities! 💗
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                  - The CommunityConnect Team
                </p>
              </div>
            </div>
          `
        });
      }
      
      return updatedUser;
    },
    onSuccess: () => {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      queryClient.invalidateQueries(['user']);
    }
  });

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const addCustomSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate({
      ...formData,
      age: formData.age ? parseInt(formData.age) : null,
      hours_available: formData.hours_available ? parseInt(formData.hours_available) : null
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {saveSuccess && (
        <Alert className="mb-6 bg-pink-50 border-pink-200">
          <CheckCircle className="h-4 w-4 text-pink-600" />
          <AlertDescription className="text-pink-800">
            Profile updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <Card className="border-none shadow-lg sticky top-24">
            <CardHeader className="text-center pb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-2xl">{user.full_name}</CardTitle>
              <p className="text-gray-500">{user.email}</p>
              {user.verified_volunteer && (
                <Badge className="mt-2 bg-pink-100 text-pink-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Volunteer
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                <Clock className="w-5 h-5 text-pink-600" />
                <div>
                  <p className="text-2xl font-bold text-pink-600">
                    {user.total_hours_volunteered || 0}
                  </p>
                  <p className="text-sm text-gray-600">Hours Volunteered</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {commitments.length}
                  </p>
                  <p className="text-sm text-gray-600">Active Commitments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Volunteer Profile</CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="outline">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={updateProfileMutation.isPending}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!user.age && !user.hours_available && !isEditing && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Complete your profile to get matched with volunteer opportunities that fit your skills and availability!
                  </AlertDescription>
              </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="age">Age</Label>
                  {isEditing ? (
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      placeholder="Enter your age"
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-900">{user.age || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="hours">Hours Available (per month)</Label>
                  {isEditing ? (
                    <Input
                      id="hours"
                      type="number"
                      value={formData.hours_available}
                      onChange={(e) => setFormData({...formData, hours_available: e.target.value})}
                      placeholder="e.g., 10"
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-900">{user.hours_available ? `${user.hours_available} hours` : "Not set"}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="City, State"
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-900 flex items-center gap-2">
                      {user.location ? (
                        <>
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {user.location}
                        </>
                      ) : "Not set"}
                    </p>
                  )}
                </div>
                {/* Removed Phone Number section */}
              </div>

              <div>
                <Label htmlFor="bio">About You</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell businesses about yourself, your experience, and why you want to volunteer..."
                    rows={4}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-gray-700">{user.bio || "No bio added yet"}</p>
                )}
              </div>

              <div>
                <Label>Your Skills & Strengths</Label>
                {isEditing ? (
                  <>
                    <div className="flex gap-2 mt-2 mb-3">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add custom skill..."
                        onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                      />
                      <Button onClick={addCustomSkill} type="button" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {COMMON_SKILLS.map(skill => (
                        <Badge
                          key={skill}
                          variant={formData.skills.includes(skill) ? "default" : "outline"}
                          className={`cursor-pointer ${formData.skills.includes(skill) ? 'bg-pink-600' : ''}`}
                          onClick={() => handleSkillToggle(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : null}
                <div className="flex flex-wrap gap-2 mt-2">
                  {(isEditing ? formData.skills : user.skills || []).map(skill => (
                    <Badge key={skill} className="bg-pink-100 text-pink-700 flex items-center gap-1">
                      {skill}
                      {isEditing && (
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeSkill(skill)}
                        />
                      )}
                    </Badge>
                  ))}
                  {(!user.skills || user.skills.length === 0) && !isEditing && (
                    <p className="text-gray-500">No skills added yet</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Areas of Interest</Label>
                {isEditing && (
                  <div className="flex flex-wrap gap-2 mt-2 mb-4">
                    {INTEREST_CATEGORIES.map(interest => (
                      <Badge
                        key={interest}
                        variant={formData.interests.includes(interest) ? "default" : "outline"}
                        className={`cursor-pointer ${formData.interests.includes(interest) ? 'bg-purple-600' : ''}`}
                        onClick={() => handleInterestToggle(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {(isEditing ? formData.interests : user.interests || []).map(interest => (
                    <Badge key={interest} className="bg-purple-100 text-purple-700">
                      {interest}
                    </Badge>
                  ))}
                  {(!user.interests || user.interests.length === 0) && !isEditing && (
                    <p className="text-gray-500">No interests selected yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
