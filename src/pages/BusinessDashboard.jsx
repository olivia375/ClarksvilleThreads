import React, { useState, useEffect } from "react";
import { entities } from "@/api/gcpClient";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Plus, Users, Briefcase, AlertCircle } from "lucide-react";
import BusinessProfileEditor from "../components/business/BusinessProfileEditor";
import OpportunityManager from "../components/business/OpportunityManager";
import ApplicationsManager from "../components/business/ApplicationsManager";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (!user.is_business_owner) {
      navigate(createPageUrl("BusinessSignup"));
    } else if (user.business_id) {
      entities.Business.filter({ id: user.business_id })
        .then(businesses => {
          if (businesses.length > 0) {
            setBusiness(businesses[0]);
          }
        });
    }
  }, [user, navigate]);

  const { data: opportunities = [] } = useQuery({
    queryKey: ['business_opportunities', business?.id],
    queryFn: () => business ? entities.VolunteerOpportunity.filter({ business_id: business.id }) : [],
    enabled: !!business
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['business_applications', business?.id],
    queryFn: () => business ? entities.VolunteerCommitment.filter({ business_id: business.id }) : [],
    enabled: !!business
  });

  if (!user || !business) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900" />
      </div>
    );
  }

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const activeOpportunities = opportunities.filter(opp => opp.status === 'open').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-gray-600">Business Dashboard</p>
            </div>
          </div>
          {!business.verified && (
            <Badge className="bg-yellow-100 text-yellow-700">
              Pending Verification
            </Badge>
          )}
        </div>
      </div>

      {!business.verified && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Your business is under review. You can still post opportunities and manage applications.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeOpportunities}</p>
                <p className="text-sm text-gray-600">Active Opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-sm text-gray-600">Pending Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                <p className="text-sm text-gray-600">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="opportunities">
            Opportunities ({opportunities.length})
          </TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({pendingCount > 0 ? `${pendingCount} pending` : applications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <BusinessProfileEditor business={business} onUpdate={setBusiness} />
        </TabsContent>

        <TabsContent value="opportunities">
          <OpportunityManager business={business} opportunities={opportunities} />
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsManager business={business} applications={applications} />
        </TabsContent>
      </Tabs>
    </div>
  );
}