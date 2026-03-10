import React, { useState } from "react";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { adminClient } from "@/api/gcpClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Building2,
  Briefcase,
  Trash2,
  Pencil,
  ShieldAlert,
  BarChart3,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ─── Stats Cards ─────────────────────────────────────────

function ErrorBanner({ error, label }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
      <p className="text-sm font-medium text-red-800">
        Failed to load {label}: {error?.message || "Unknown error"}
      </p>
      <p className="text-xs text-red-600 mt-1">
        The admin API may not be deployed yet. Try redeploying Cloud Functions.
      </p>
    </div>
  );
}

function StatsOverview() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminClient.getStats,
  });

  // Use list data to compute stats when admin stats endpoint isn't deployed
  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminClient.listUsers,
  });
  const { data: businesses = [] } = useQuery({
    queryKey: ["admin", "businesses"],
    queryFn: adminClient.listBusinesses,
  });
  const { data: opportunities = [] } = useQuery({
    queryKey: ["admin", "opportunities"],
    queryFn: adminClient.listOpportunities,
  });

  const computedStats = {
    total_users: stats?.total_users ?? users.length,
    total_businesses: stats?.total_businesses ?? businesses.length,
    total_opportunities: stats?.total_opportunities ?? opportunities.length,
    total_commitments: stats?.total_commitments ?? 0,
  };

  const isLoading = statsLoading && users.length === 0 && businesses.length === 0;

  const cards = [
    { label: "Users", value: computedStats.total_users, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "Businesses", value: computedStats.total_businesses, icon: Building2, color: "text-green-600 bg-green-100" },
    { label: "Opportunities", value: computedStats.total_opportunities, icon: Briefcase, color: "text-purple-600 bg-purple-100" },
    { label: "Commitments", value: computedStats.total_commitments, icon: BarChart3, color: "text-orange-600 bg-orange-100" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : (c.value ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Search Bar ──────────────────────────────────────────

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────

function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminClient.listUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ uid, data }) => adminClient.updateUser(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setEditUser(null);
      toast.success("User updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (uid) => adminClient.deleteUser(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setDeleteTarget(null);
      toast.success("User deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = users.filter(
    (u) =>
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {error && <ErrorBanner error={error} label="users" />}
      <SearchBar value={search} onChange={setSearch} placeholder="Search users by name or email..." />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {error
                      ? "Failed to load users. The admin API functions may need to be redeployed."
                      : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {u.is_admin && <Badge variant="destructive">Admin</Badge>}
                        {u.is_business_owner && <Badge variant="secondary">Business</Badge>}
                        {!u.is_admin && !u.is_business_owner && <Badge variant="outline">Volunteer</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{u.total_hours_volunteered || 0}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditUser({ ...u })}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile fields.</DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={editUser.full_name || ""}
                  onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={editUser.email || ""} disabled className="bg-gray-50" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editUser.is_business_owner || false}
                    onChange={(e) => setEditUser({ ...editUser, is_business_owner: e.target.checked })}
                    className="rounded"
                  />
                  Business Owner
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editUser.is_admin || false}
                    onChange={(e) => setEditUser({ ...editUser, is_admin: e.target.checked })}
                    className="rounded"
                  />
                  Admin
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editUser.verified_volunteer || false}
                    onChange={(e) => setEditUser({ ...editUser, verified_volunteer: e.target.checked })}
                    className="rounded"
                  />
                  Verified Volunteer
                </label>
              </div>
              <div>
                <Label>Total Hours Volunteered</Label>
                <Input
                  type="number"
                  value={editUser.total_hours_volunteered || 0}
                  onChange={(e) =>
                    setEditUser({ ...editUser, total_hours_volunteered: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                const { id, created_at, updated_at, ...data } = editUser;
                updateMutation.mutate({ uid: id, data });
              }}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong>'s
              account and remove them from Firebase Auth. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Businesses Tab ──────────────────────────────────────

function BusinessesTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editBiz, setEditBiz] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: businesses = [], isLoading, error } = useQuery({
    queryKey: ["admin", "businesses"],
    queryFn: adminClient.listBusinesses,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminClient.updateBusiness(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setEditBiz(null);
      toast.success("Business updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminClient.deleteBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setDeleteTarget(null);
      toast.success("Business deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = businesses.filter(
    (b) =>
      !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {error && <ErrorBanner error={error} label="businesses" />}
      <SearchBar value={search} onChange={setSearch} placeholder="Search businesses by name or category..." />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No businesses found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name || "—"}</TableCell>
                    <TableCell>
                      {b.category ? <Badge variant="outline">{b.category}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{b.location || "—"}</TableCell>
                    <TableCell className="text-right">
                      {b.average_rating ? `${b.average_rating} (${b.total_reviews})` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditBiz({ ...b })}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Business Dialog */}
      <Dialog open={!!editBiz} onOpenChange={(open) => !open && setEditBiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
            <DialogDescription>Update business details.</DialogDescription>
          </DialogHeader>
          {editBiz && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editBiz.name || ""}
                  onChange={(e) => setEditBiz({ ...editBiz, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={editBiz.category || ""}
                  onChange={(e) => setEditBiz({ ...editBiz, category: e.target.value })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={editBiz.location || ""}
                  onChange={(e) => setEditBiz({ ...editBiz, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editBiz.description || ""}
                  onChange={(e) => setEditBiz({ ...editBiz, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBiz(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                const { id, created_at, updated_at, owner_uid, average_rating, total_reviews, ...data } = editBiz;
                updateMutation.mutate({ id, data });
              }}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Business Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Business"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Opportunities Tab ───────────────────────────────────

function OpportunitiesTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editOpp, setEditOpp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: opportunities = [], isLoading, error } = useQuery({
    queryKey: ["admin", "opportunities"],
    queryFn: adminClient.listOpportunities,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminClient.updateOpportunity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setEditOpp(null);
      toast.success("Opportunity updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminClient.deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setDeleteTarget(null);
      toast.success("Opportunity deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = opportunities.filter(
    (o) =>
      !search ||
      o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {error && <ErrorBanner error={error} label="opportunities" />}
      <SearchBar value={search} onChange={setSearch} placeholder="Search opportunities by title or status..." />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Slots Filled</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No opportunities found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.title || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.status === "open" ? "default" : o.status === "closed" ? "secondary" : "outline"
                        }
                      >
                        {o.status || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{o.slots_filled || 0}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {o.date ? new Date(o.date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditOpp({ ...o })}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteTarget(o)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Opportunity Dialog */}
      <Dialog open={!!editOpp} onOpenChange={(open) => !open && setEditOpp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Opportunity</DialogTitle>
            <DialogDescription>Update opportunity details.</DialogDescription>
          </DialogHeader>
          {editOpp && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editOpp.title || ""}
                  onChange={(e) => setEditOpp({ ...editOpp, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={editOpp.status || "open"}
                  onChange={(e) => setEditOpp({ ...editOpp, status: e.target.value })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editOpp.description || ""}
                  onChange={(e) => setEditOpp({ ...editOpp, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editOpp.date ? editOpp.date.split("T")[0] : ""}
                    onChange={(e) => setEditOpp({ ...editOpp, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hours</Label>
                  <Input
                    type="number"
                    value={editOpp.hours || ""}
                    onChange={(e) => setEditOpp({ ...editOpp, hours: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpp(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                const { id, created_at, updated_at, business_id, slots_filled, ...data } = editOpp;
                updateMutation.mutate({ id, data });
              }}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Opportunity Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Opportunity"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Main Admin Dashboard ────────────────────────────────

export default function AdminDashboard() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user?.is_admin) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You do not have administrator privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage users, businesses, and opportunities across the platform.</p>
      </div>

      <StatsOverview />

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="businesses" className="gap-2">
            <Building2 className="w-4 h-4" />
            Businesses
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Opportunities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="businesses">
          <BusinessesTab />
        </TabsContent>
        <TabsContent value="opportunities">
          <OpportunitiesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
