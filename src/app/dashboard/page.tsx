"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Plus, Shield, UserPlus, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface Membership {
  memberId: string;
  role: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
}

interface OrgMember {
  memberId: string;
  role: string;
  userId: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [creating, setCreating] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [statusMsg, setStatusMsg] = useState("");

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/me");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const data = await res.json();
    setMemberships(data.memberships || []);
    const currentActive =
      data.session?.activeOrganizationId || data.memberships?.[0]?.orgId || null;
    setActiveOrgId(currentActive);
  }, [router]);

  const loadMembers = useCallback(async (orgId: string) => {
    const res = await fetch(`/api/org/${orgId}/members`);
    if (res.ok) {
      const data = await res.json();
      setOrgMembers(data.members || []);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
      return;
    }
    if (session) {
      loadMe();
    }
  }, [isPending, session, router, loadMe]);

  useEffect(() => {
    if (activeOrgId) {
      loadMembers(activeOrgId);
    }
  }, [activeOrgId, loadMembers]);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setStatusMsg("");
    const slug =
      orgSlug.trim() ||
      orgName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const { data, error } = await authClient.organization.create({
      name: orgName.trim(),
      slug,
    });

    setCreating(false);
    if (error) {
      setStatusMsg(error.message || "Could not create organization.");
      return;
    }
    setOrgName("");
    setOrgSlug("");
    setCreateOpen(false);
    await loadMe();
    if (data?.id) setActiveOrgId(data.id);
  }

  async function handleSwitchOrg(orgId: string) {
    await authClient.organization.setActive({ organizationId: orgId });
    setActiveOrgId(orgId);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    setStatusMsg("");
    const res = await fetch(`/api/org/${activeOrgId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(data.error || "Could not add member.");
      return;
    }
    setInviteEmail("");
    setStatusMsg("User added to organization!");
    await loadMembers(activeOrgId);
  }

  async function handleChangeMemberRole(memberId: string, role: string) {
    if (!activeOrgId) return;
    await fetch(`/api/org/${activeOrgId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await loadMembers(activeOrgId);
  }

  if (isPending || !session?.user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading workspace...
        </div>
      </div>
    );
  }

  const activeOrg = memberships.find((m) => m.orgId === activeOrgId);

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        {/* User Identity Header */}
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{session.user.name}</CardTitle>
                <Badge variant={session.user.role === "admin" ? "default" : "secondary"}>
                  Platform: {session.user.role || "user"}
                </Badge>
              </div>
              <CardDescription>{session.user.email}</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {session.user.role === "admin" && (
                <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
                  <Shield className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Open Super Admin Panel</span>
                </Link>
              )}

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger
                  className={cn(buttonVariants(), "bg-indigo-600 text-white hover:bg-indigo-700")}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Create Organization
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                      Create your own business or a client organization. You will be assigned as Owner.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrg} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        placeholder="e.g., ebrain HQ or TaxationPk"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-slug">URL Slug (Optional)</Label>
                      <Input
                        id="org-slug"
                        placeholder="e.g., taxationpk"
                        value={orgSlug}
                        onChange={(e) => setOrgSlug(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {creating ? "Creating..." : "Create Organization"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {statusMsg && (
          <div className="rounded-lg border bg-background p-3 text-sm">{statusMsg}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* My Organizations & Roles */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-indigo-600" /> My Organizations ({memberships.length})
              </CardTitle>
              <CardDescription>
                One user can hold different roles across different organizations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {memberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t belong to any organization yet. Click &ldquo;Create Organization&rdquo;
                  to start one.
                </p>
              ) : (
                memberships.map((m) => (
                  <button
                    key={m.orgId}
                    onClick={() => handleSwitchOrg(m.orgId)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-lg border p-3 text-left transition hover:bg-muted/50",
                      m.orgId === activeOrgId && "border-indigo-600 bg-indigo-500/5"
                    )}
                  >
                    <div>
                      <p className="font-medium text-sm flex items-center gap-1.5">
                        {m.orgName}
                        {m.orgId === activeOrgId && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">/{m.orgSlug}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {m.role}
                    </Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Organization Members & Role Manager */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-emerald-600" />
                {activeOrg ? `${activeOrg.orgName} — Members & Roles` : "Select an Organization"}
              </CardTitle>
              <CardDescription>
                {activeOrg
                  ? `Your role here: ${activeOrg.role.toUpperCase()}. Add registered users as Employees, Clients, Admins, or Members.`
                  : "Create or select an organization on the left to manage its employees and clients."}
              </CardDescription>
            </CardHeader>
            {activeOrg && (
              <CardContent className="space-y-6">
                <form onSubmit={handleAddMember} className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="Registered user's email..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="client">Client</option>
                    <option value="admin">Org Admin</option>
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                  <Button type="submit" className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700">
                    <UserPlus className="mr-1.5 h-4 w-4" /> Add User
                  </Button>
                </form>

                <div className="divide-y rounded-lg border">
                  {orgMembers.map((mem) => (
                    <div key={mem.memberId} className="flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="text-sm font-medium">{mem.name}</p>
                        <p className="text-xs text-muted-foreground">{mem.email}</p>
                      </div>
                      <select
                        value={mem.role}
                        onChange={(e) => handleChangeMemberRole(mem.memberId, e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize"
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="employee">Employee</option>
                        <option value="client">Client</option>
                        <option value="member">Member</option>
                      </select>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
