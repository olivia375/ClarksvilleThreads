import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail, Calendar, Clock, Briefcase, Users, CheckCircle, Search, Filter
} from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  confirmed: { bg: "bg-green-100", text: "text-green-700", label: "Confirmed" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "In Progress" },
  completed: { bg: "bg-purple-100", text: "text-purple-700", label: "Completed" },
};

export default function VolunteerRoster({ applications = [], opportunities = [] }) {
  const [search, setSearch] = useState("");
  const [filterOpp, setFilterOpp] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const acceptedVolunteers = applications.filter(a =>
    ["confirmed", "in_progress", "completed"].includes(a.status)
  );

  const getOpportunityTitle = (app) => {
    if (app.opportunity_title) return app.opportunity_title;
    const opp = opportunities.find(o => o.id === app.opportunity_id);
    return opp?.title || "Unknown Opportunity";
  };

  // Unique opportunity titles for filter dropdown
  const oppTitles = [...new Set(acceptedVolunteers.map(v => getOpportunityTitle(v)))];

  // Apply filters
  const filtered = acceptedVolunteers.filter(v => {
    const title = getOpportunityTitle(v);
    const matchesSearch =
      !search ||
      v.volunteer_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.volunteer_email?.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase());
    const matchesOpp = filterOpp === "all" || title === filterOpp;
    const matchesStatus = filterStatus === "all" || v.status === filterStatus;
    return matchesSearch && matchesOpp && matchesStatus;
  });

  // Group filtered volunteers by opportunity
  const byOpportunity = {};
  filtered.forEach(v => {
    const title = getOpportunityTitle(v);
    if (!byOpportunity[title]) byOpportunity[title] = [];
    byOpportunity[title].push(v);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Volunteer Roster</h2>
        <Badge className="bg-green-100 text-green-700 text-sm px-3 py-1">
          <Users className="w-4 h-4 mr-1 inline-block" />
          {acceptedVolunteers.length} Total Volunteer{acceptedVolunteers.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Filters */}
      {acceptedVolunteers.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterOpp} onValueChange={setFilterOpp}>
            <SelectTrigger className="w-full sm:w-52">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="All opportunities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Opportunities</SelectItem>
              {oppTitles.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {acceptedVolunteers.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-16">
            <Users className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-lg">No confirmed volunteers yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Once you accept applications, your volunteer roster will appear here with full contact details.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="text-center py-10">
            <p className="text-gray-500">No volunteers match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(byOpportunity).map(([opportunityTitle, volunteers]) => (
            <div key={opportunityTitle}>
              <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                {opportunityTitle}
                <span className="text-sm font-normal text-gray-400">
                  — {volunteers.length} volunteer{volunteers.length !== 1 ? "s" : ""}
                </span>
              </h3>
              <div className="grid gap-4">
                {volunteers.map(app => (
                  <VolunteerCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VolunteerCard({ app }) {
  const statusColor = STATUS_COLORS[app.status] || STATUS_COLORS.confirmed;

  return (
    <Card className="border-none shadow-md border-l-4 border-l-green-500">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            {app.volunteer_name}
          </CardTitle>
          <Badge className={`${statusColor.bg} ${statusColor.text} flex-shrink-0`}>
            {statusColor.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid sm:grid-cols-2 gap-5 text-sm">
          {/* Contact Info */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Contact Information
            </p>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 flex-shrink-0 text-blue-600" />
              <a
                href={`mailto:${app.volunteer_email}`}
                className="text-blue-700 hover:underline break-all"
              >
                {app.volunteer_email}
              </a>
            </div>
          </div>

          {/* Commitment Details */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Commitment Details
            </p>
            {app.hours_committed && (
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{app.hours_committed} hours committed</span>
              </div>
            )}
            {app.start_date && (
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Start: {format(new Date(app.start_date), "MMM d, yyyy")}</span>
              </div>
            )}
            {app.created_at && (
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4 flex-shrink-0 opacity-50" />
                <span>Applied {format(new Date(app.created_at), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </div>

        {app.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Volunteer's Notes
            </p>
            <p className="text-sm text-gray-700">{app.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
