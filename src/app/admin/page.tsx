"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Building2, CheckCircle, Shield, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  createdAt: string;
}

interface PlatformOrg {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [stats, setStats] = useState({ totalUsers: 0, totalOrganizations: 0, totalMemberships: 0 });
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [orgs, setOrgs] = useState<PlatformOrg[]>([]);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/platform/overview");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (res.status === 403) {
      setError("Access Denied: Only Platform Super Admins can access this panel.");
      return;
    }
    const data = await res.json();
    setStats(data.stats || { totalUsers: 0, totalOrganizations: 0, totalMemberships: 0 });
    setUsers(data.users || []);
    setOrgs(data.organizations || []);
  }, [router]);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
      return;
    }
    if (session) {
      loadOverview();
    }
  }, [isPending, session, router, loadOverview]);

  async function togglePlatformRole(userId: string, currentRole: string | null) {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    await authClient.admin.setRole({ userId, role: nextRole });
    await loadOverview();
  }

  async function toggleBan(userId: string, isBanned: boolean | null) {
    if (isBanned) {
      await authClient.admin.unbanUser({ userId });
    } else {
      await authClient.admin.banUser({ userId, banReason: "Suspended by Super Admin" });
    }
    await loadOverview();
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Platform Super Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage all registered users, organizations, roles, and platform access.
            </p>
          </div>
        </div>

        {error ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-rose-600">{error}</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Registered Users</CardDescription>
                  <CardTitle className="text-3xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" /> {stats.totalUsers}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Organizations</CardDescription>
                  <CardTitle className="text-3xl font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" /> {stats.totalOrganizations}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Org Memberships</CardDescription>
                  <CardTitle className="text-3xl font-bold">{stats.totalMemberships}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registered Users</CardTitle>
                <CardDescription>Promote staff to Super Admin or manage user access.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{u.name}</p>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role || "user"}
                        </Badge>
                        {u.banned && <Badge variant="destructive">Banned</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>

                    {u.id !== session?.user?.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePlatformRole(u.id, u.role)}
                        >
                          {u.role === "admin" ? "Demote to User" : "Make Super Admin"}
                        </Button>
                        <Button
                          size="sm"
                          variant={u.banned ? "secondary" : "destructive"}
                          onClick={() => toggleBan(u.id, u.banned)}
                        >
                          {u.banned ? (
                            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Unban</span>
                          ) : (
                            <span className="flex items-center gap-1"><Ban className="h-3.5 w-3.5" /> Ban</span>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organizations on Platform</CardTitle>
                <CardDescription>Businesses and customer workspaces registered in PostgreSQL.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {orgs.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">No organizations created yet.</div>
                ) : (
                  orgs.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-sm">{o.name}</p>
                        <p className="text-xs text-muted-foreground">/{o.slug}</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
