import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Heart, ArrowRight, CheckCircle } from "lucide-react";

export default function UserTypeSelection() {
  const navigate = useNavigate();
  const { user, updateMe, signInWithGoogle } = useAuth();
  const [selecting, setSelecting] = React.useState(null);

  // If user already has an account type, redirect appropriately
  React.useEffect(() => {
    if (user?.account_type === "volunteer") {
      navigate(createPageUrl("Profile"));
    } else if (user?.account_type === "business") {
      if (user?.is_business_owner) {
        navigate(createPageUrl("BusinessDashboard"));
      } else {
        navigate(createPageUrl("BusinessSignup"));
      }
    }
  }, [user, navigate]);

  const handleSelect = async (type) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    setSelecting(type);
    try {
      await updateMe({ account_type: type });
      if (type === "volunteer") {
        navigate(createPageUrl("Profile"));
      } else {
        navigate(createPageUrl("BusinessSignup"));
      }
    } catch (error) {
      console.error("Failed to set account type:", error);
      setSelecting(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to BeyondNeighborly</h1>
          <p className="text-gray-600">Sign in to get started and choose your account type.</p>
          <Button
            onClick={signInWithGoogle}
            className="w-full bg-blue-900 hover:bg-blue-800"
            size="lg"
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.full_name}!
          </h1>
          <p className="text-lg text-gray-600">
            How would you like to use BeyondNeighborly?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Volunteer Account */}
          <Card
            className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
              selecting === "volunteer"
                ? "border-blue-600 shadow-lg"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => !selecting && handleSelect("volunteer")}
          >
            <CardContent className="p-8 space-y-5">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-blue-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Volunteer</h2>
                <p className="text-gray-600 mt-2">
                  Find and sign up for volunteer opportunities in your community.
                </p>
              </div>
              <ul className="space-y-2">
                {[
                  "Browse local volunteer opportunities",
                  "Track your volunteer hours",
                  "Get matched based on your skills",
                  "Earn perks from local businesses"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-blue-900 hover:bg-blue-800"
                disabled={!!selecting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect("volunteer");
                }}
              >
                {selecting === "volunteer" ? (
                  "Setting up..."
                ) : (
                  <>
                    Continue as Volunteer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Business Account */}
          <Card
            className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
              selecting === "business"
                ? "border-blue-600 shadow-lg"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => !selecting && handleSelect("business")}
          >
            <CardContent className="p-8 space-y-5">
              <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-sky-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Business</h2>
                <p className="text-gray-600 mt-2">
                  Post volunteer opportunities and offer incentives to attract help.
                </p>
              </div>
              <ul className="space-y-2">
                {[
                  "Post volunteer opportunities",
                  "Offer incentives and perks",
                  "Manage volunteer applications",
                  "Build your community presence"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-sky-700 hover:bg-sky-800"
                disabled={!!selecting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect("business");
                }}
              >
                {selecting === "business" ? (
                  "Setting up..."
                ) : (
                  <>
                    Continue as Business
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
