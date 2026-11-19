"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Activity,
  Brain,
  Briefcase,
  Building2,
  Check,
  ChevronsUpDown,
  Copy,
  Link2,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Shield,
  Sliders,
  Sun,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type SectionTab = "crm" | "team" | "audit" | "org-settings";

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

interface InvitationRow {
  id: string;
  email: string;
  role: string | null;
  status: string;
}

interface CrmRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  kind: string;
  status: string;
  notes: string | null;
}

interface AuditRow {
  id: string;
  actorEmail: string | null;
  action: string;
  target: string | null;
  details: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session, isPending } = authClient.useSession();

  const [tab, setTab] = useState<SectionTab>("crm");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [crmRows, setCrmRows] = useState<CrmRow[]>([]);
  const [canWriteCrm, setCanWriteCrm] = useState(false);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);

  const [statusMsg, setStatusMsg] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");

  const [crmOpen, setCrmOpen] = useState(false);
  const [crmSearch, setCrmSearch] = useState("");
  const [crmName, setCrmName] = useState("");
  const [crmEmail, setCrmEmail] = useState("");
  const [crmPhone, setCrmPhone] = useState("");
  const [crmKind, setCrmKind] = useState("client");
  const [crmNotes, setCrmNotes] = useState("");

  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgSlug, setEditOrgSlug] = useState("");

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/me");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const data = await res.json();
    const list: Membership[] = data.memberships || [];
    setMemberships(list);
    const chosen =
      list.find((m) => m.orgId === data.session?.activeOrganizationId)?.orgId ||
      list[0]?.orgId ||
      null;
    setActiveOrgId(chosen);
  }, [router]);

  const loadOrgData = useCallback(async (orgId: string) => {
    const [mRes, cRes, iRes, aRes] = await Promise.all([
      fetch(`/api/org/${orgId}/members`),
      fetch(`/api/org/${orgId}/crm`),
      fetch(`/api/org/${orgId}/invitations`),
      fetch(`/api/org/${orgId}/audit`),
    ]);

    if (mRes.ok) setMembers((await mRes.json()).members || []);
    if (cRes.ok) {
      const cData = await cRes.json();
      setCrmRows(cData.records || []);
      setCanWriteCrm(Boolean(cData.canWrite));
    }
    if (iRes.ok) setInvitations((await iRes.json()).invitations || []);
    if (aRes.ok) setAuditRows((await aRes.json()).logs || []);
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
      return;
    }
    if (session) loadMe();
  }, [isPending, session, router, loadMe]);

  useEffect(() => {
    if (activeOrgId) {
      loadOrgData(activeOrgId);
      const org = memberships.find((m) => m.orgId === activeOrgId);
      if (org) {
        setEditOrgName(org.orgName);
        setEditOrgSlug(org.orgSlug);
      }
    }
  }, [activeOrgId, memberships, loadOrgData]);

  const activeOrg = memberships.find((m) => m.orgId === activeOrgId);
  const canManageOrg =
    session?.user?.role === "admin" ||
    activeOrg?.role === "owner" ||
    activeOrg?.role === "admin";

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreatingOrg(true);
    setStatusMsg("");
    const slug =
      newOrgSlug.trim() ||
      newOrgName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const { data, error } = await authClient.organization.create({
      name: newOrgName.trim(),
      slug,
    });
    setCreatingOrg(false);
    if (error) {
      setStatusMsg(error.message || "Could not create organization.");
      return;
    }
    setNewOrgName("");
    setNewOrgSlug("");
    setCreateOpen(false);
    await loadMe();
    if (data?.id) setActiveOrgId(data.id);
    setStatusMsg("Organization created!");
  }

  async function handleSwitchOrg(orgId: string) {
    await authClient.organization.setActive({ organizationId: orgId });
    setActiveOrgId(orgId);
    setStatusMsg("");
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    setStatusMsg("");
    const res = await fetch(`/api/org/${activeOrgId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(data.error || "Could not create invite.");
      return;
    }
    setInviteEmail("");
    setStatusMsg("Invite link created! Copy and send it to the user.");
    await loadOrgData(activeOrgId);
  }

  async function handleAddExistingMember() {
    if (!activeOrgId || !inviteEmail.trim()) return;
    setStatusMsg("");
    const res = await fetch(`/api/org/${activeOrgId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(data.error || "Could not add user directly.");
      return;
    }
    setInviteEmail("");
    setStatusMsg("Existing user added directly!");
    await loadOrgData(activeOrgId);
  }

  async function handleChangeMemberRole(memberId: string, role: string) {
    if (!activeOrgId) return;
    const res = await fetch(`/api/org/${activeOrgId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(data.error || "Permission denied.");
      return;
    }
    setStatusMsg("Member role updated.");
    await loadOrgData(activeOrgId);
  }

  async function handleRevokeInvite(invId: string) {
    if (!activeOrgId) return;
    await fetch(`/api/org/${activeOrgId}/invitations/${invId}`, { method: "DELETE" });
    await loadOrgData(activeOrgId);
  }

  function handleCopyInvite(invId: string) {
    const url = `${window.location.origin}/invite/${invId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleAddCrm(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    const res = await fetch(`/api/org/${activeOrgId}/crm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: crmName,
        email: crmEmail,
        phone: crmPhone,
        kind: crmKind,
        notes: crmNotes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(data.error || "Could not save CRM record.");
      return;
    }
    setCrmName("");
    setCrmEmail("");
    setCrmPhone("");
    setCrmNotes("");
    setCrmOpen(false);
    setStatusMsg("Record added to organization CRM.");
    await loadOrgData(activeOrgId);
  }

  async function handleToggleCrmStatus(recId: string, current: string) {
    if (!activeOrgId) return;
    const next = current === "active" ? "completed" : "active";
    await fetch(`/api/org/${activeOrgId}/crm/${recId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await loadOrgData(activeOrgId);
  }

  async function handleDeleteCrm(recId: string) {
    if (!activeOrgId) return;
    await fetch(`/api/org/${activeOrgId}/crm/${recId}`, { method: "DELETE" });
    await loadOrgData(activeOrgId);
  }

  async function handleSaveOrgSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrgId) return;
    const res = await fetch(`/api/org/${activeOrgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editOrgName, slug: editOrgSlug }),
    });
    const data = await res.json();
    setStatusMsg(res.ok ? "Organization settings saved!" : data.error || "Update failed.");
    if (res.ok) await loadMe();
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading ebrain workspace...
      </div>
    );
  }

  const filteredCrm = crmRows.filter(
    (r) =>
      r.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
      (r.email || "").toLowerCase().includes(crmSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-muted/20">
      <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2 font-bold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-emerald-500 text-white">
            <Brain className="h-4 w-4" />
          </div>
          <span>ebrain</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mb-5 w-full justify-between px-3"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0 text-indigo-600" />
              <span className="truncate text-sm font-medium">
                {activeOrg ? activeOrg.orgName : "No Organization"}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Organizations ({memberships.length})</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {memberships.map((m) => (
              <DropdownMenuItem
                key={m.orgId}
                onClick={() => handleSwitchOrg(m.orgId)}
                className="flex items-center justify-between"
              >
                <span className="truncate">
                  {m.orgName}{" "}
                  <span className="text-[11px] text-muted-foreground capitalize">({m.role})</span>
                </span>
                {m.orgId === activeOrgId && <Check className="h-4 w-4 text-indigo-600" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCreateOpen(true)} className="text-indigo-600">
              <Plus className="mr-2 h-4 w-4" /> New Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <nav className="flex-1 space-y-1 text-sm">
          <Button
            variant={tab === "crm" ? "secondary" : "ghost"}
            className="w-full justify-start gap-2.5"
            onClick={() => setTab("crm")}
          >
            <Briefcase className="h-4 w-4 text-indigo-600" /> Clients &amp; CRM
          </Button>
          <Button
            variant={tab === "team" ? "secondary" : "ghost"}
            className="w-full justify-start gap-2.5"
            onClick={() => setTab("team")}
          >
            <Users className="h-4 w-4 text-emerald-600" /> Team &amp; Invites
          </Button>
          {canManageOrg && (
            <>
              <Button
                variant={tab === "audit" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2.5"
                onClick={() => setTab("audit")}
              >
                <Activity className="h-4 w-4 text-sky-600" /> Audit Logs
              </Button>
              <Button
                variant={tab === "org-settings" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2.5"
                onClick={() => setTab("org-settings")}
              >
                <Sliders className="h-4 w-4" /> Org Settings
              </Button>
            </>
          )}
        </nav>

        <div className="space-y-1 border-t pt-3 text-sm">
          {session.user.role === "admin" && (
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start gap-2.5")}
            >
              <Shield className="h-4 w-4 text-amber-500" /> Super Admin Panel
            </Link>
          )}
          <Link
            href="/settings"
            className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start gap-2.5")}
          >
            <Settings className="h-4 w-4" /> Account Settings
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-rose-600"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="md:hidden shrink-0">
              <Brain className="h-6 w-6 text-indigo-600" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold sm:text-lg">
                  {activeOrg ? activeOrg.orgName : "Welcome to ebrain"}
                </h1>
                {activeOrg && (
                  <Badge variant="outline" className="capitalize text-xs">
                    {activeOrg.role}
                  </Badge>
                )}
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Signed in as {session.user.name} ({session.user.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger
                className={cn(buttonVariants({ size: "sm" }), "bg-indigo-600 text-white hover:bg-indigo-700")}
              >
                <Plus className="mr-1.5 h-4 w-4" /> New Org
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Create a company or client workspace. You will be assigned as Owner.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateOrg} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-org-name">Organization Name</Label>
                    <Input
                      id="new-org-name"
                      placeholder="e.g., ebrain HQ or TaxationPk"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-org-slug">URL Slug (Optional)</Label>
                    <Input
                      id="new-org-slug"
                      placeholder="e.g., taxationpk"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={creatingOrg}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {creatingOrg ? "Creating..." : "Create Organization"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 sm:p-6">
          {statusMsg && (
            <div className="rounded-lg border bg-background px-4 py-3 text-sm font-medium">
              {statusMsg}
            </div>
          )}

          {!activeOrg ? (
            <Card>
              <CardHeader>
                <CardTitle>Create or Join Your First Organization</CardTitle>
                <CardDescription>
                  Click <strong>+ New Org</strong> in the top right to create your first business or
                  workspace, or open an invite link from a team owner.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {memberships.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
                  {memberships.map((m) => (
                    <Button
                      key={m.orgId}
                      size="sm"
                      variant={m.orgId === activeOrgId ? "default" : "outline"}
                      onClick={() => handleSwitchOrg(m.orgId)}
                    >
                      {m.orgName} ({m.role})
                    </Button>
                  ))}
                </div>
              )}

              {tab === "crm" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search clients, leads, requests..."
                        className="pl-8 bg-background"
                        value={crmSearch}
                        onChange={(e) => setCrmSearch(e.target.value)}
                      />
                    </div>

                    {canWriteCrm && (
                      <Dialog open={crmOpen} onOpenChange={setCrmOpen}>
                        <DialogTrigger
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            "bg-emerald-600 text-white hover:bg-emerald-700"
                          )}
                        >
                          <Plus className="mr-1.5 h-4 w-4" /> Add Client / Request
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>New CRM Record</DialogTitle>
                            <DialogDescription>
                              Saved privately inside {activeOrg.orgName}.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddCrm} className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="c-name">Client / Task Name</Label>
                              <Input
                                id="c-name"
                                placeholder="e.g., ABC Traders — Tax Filing"
                                value={crmName}
                                onChange={(e) => setCrmName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="c-kind">Type</Label>
                                <select
                                  id="c-kind"
                                  value={crmKind}
                                  onChange={(e) => setCrmKind(e.target.value)}
                                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="client">Client</option>
                                  <option value="lead">Lead</option>
                                  <option value="request">Work Request</option>
                                  <option value="vendor">Vendor</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="c-phone">Phone (Optional)</Label>
                                <Input
                                  id="c-phone"
                                  placeholder="0300-1234567"
                                  value={crmPhone}
                                  onChange={(e) => setCrmPhone(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="c-email">Client Email (Optional — lets Client view it)</Label>
                              <Input
                                id="c-email"
                                type="email"
                                placeholder="client@company.com"
                                value={crmEmail}
                                onChange={(e) => setCrmEmail(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="c-notes">Notes</Label>
                              <Input
                                id="c-notes"
                                placeholder="Details or deliverables..."
                                value={crmNotes}
                                onChange={(e) => setCrmNotes(e.target.value)}
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Save Record
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {activeOrg.orgName} — Clients &amp; Work Directory ({filteredCrm.length})
                      </CardTitle>
                      <CardDescription>
                        {canWriteCrm
                          ? "Owners, Admins, and Employees can manage organization records."
                          : "Client view: showing records shared with your email address."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y p-0">
                      {filteredCrm.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          No records yet.
                        </div>
                      ) : (
                        filteredCrm.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{rec.name}</p>
                                <Badge variant="outline" className="capitalize text-[11px]">
                                  {rec.kind}
                                </Badge>
                                <Badge
                                  variant={rec.status === "completed" ? "secondary" : "default"}
                                  className="capitalize text-[11px]"
                                >
                                  {rec.status}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {[rec.email, rec.phone, rec.notes].filter(Boolean).join(" • ") ||
                                  "No additional details"}
                              </p>
                            </div>

                            {canWriteCrm && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleCrmStatus(rec.id, rec.status)}
                                >
                                  {rec.status === "active" ? "Mark Completed" : "Reopen"}
                                </Button>
                                {canManageOrg && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-rose-600"
                                    onClick={() => handleDeleteCrm(rec.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {tab === "team" && (
                <div className="space-y-6">
                  {canManageOrg && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Link2 className="h-4 w-4 text-indigo-600" /> Invite or Add Member
                        </CardTitle>
                        <CardDescription>
                          Generate a 1-click Invite Link for new users, or add an already-registered
                          user immediately.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <form onSubmit={handleCreateInvite} className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            type="email"
                            placeholder="Person's email address..."
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
                          <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">
                            <Link2 className="mr-1.5 h-4 w-4" /> Create Invite Link
                          </Button>
                          <Button type="button" variant="outline" onClick={handleAddExistingMember}>
                            <UserPlus className="mr-1.5 h-4 w-4" /> Add Directly
                          </Button>
                        </form>

                        {invitations.length > 0 && (
                          <div className="divide-y rounded-lg border">
                            {invitations.map((inv) => (
                              <div
                                key={inv.id}
                                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="text-sm">
                                  <span className="font-medium">{inv.email}</span>{" "}
                                  <Badge variant="outline" className="ml-1 capitalize text-[11px]">
                                    {inv.role}
                                  </Badge>{" "}
                                  <Badge variant="secondary" className="ml-1 capitalize text-[11px]">
                                    {inv.status}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  {inv.status === "pending" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCopyInvite(inv.id)}
                                    >
                                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                                      {copiedId === inv.id ? "Copied!" : "Copy Invite Link"}
                                    </Button>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-rose-600"
                                    onClick={() => handleRevokeInvite(inv.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Organization Members ({members.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y p-0">
                      {members.map((mem) => (
                        <div key={mem.memberId} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium">{mem.name}</p>
                            <p className="text-xs text-muted-foreground">{mem.email}</p>
                          </div>
                          {canManageOrg ? (
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
                          ) : (
                            <Badge variant="outline" className="capitalize">
                              {mem.role}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {tab === "audit" && canManageOrg && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Organization Activity &amp; Audit Log</CardTitle>
                    <CardDescription>Last 50 tracked events in {activeOrg.orgName}.</CardDescription>
                  </CardHeader>
                  <CardContent className="divide-y p-0">
                    {auditRows.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground">No audit events yet.</div>
                    ) : (
                      auditRows.map((log) => (
                        <div key={log.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                          <div>
                            <p className="font-medium">
                              {log.action}{" "}
                              {log.target && (
                                <span className="text-muted-foreground">→ {log.target}</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              By {log.actorEmail || "system"} {log.details ? `• ${log.details}` : ""}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {tab === "org-settings" && canManageOrg && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Organization Settings</CardTitle>
                    <CardDescription>Update your organization display name and URL slug.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveOrgSettings} className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="edit-org-name">Organization Name</Label>
                        <Input
                          id="edit-org-name"
                          value={editOrgName}
                          onChange={(e) => setEditOrgName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-org-slug">Organization Slug</Label>
                        <Input
                          id="edit-org-slug"
                          value={editOrgSlug}
                          onChange={(e) => setEditOrgSlug(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">
                        Save Organization
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur md:hidden">
        <button
          onClick={() => setTab("crm")}
          className={cn(
            "flex flex-col items-center gap-1 text-[11px]",
            tab === "crm" ? "text-indigo-600 font-medium" : "text-muted-foreground"
          )}
        >
          <Briefcase className="h-4 w-4" /> CRM
        </button>
        <button
          onClick={() => setTab("team")}
          className={cn(
            "flex flex-col items-center gap-1 text-[11px]",
            tab === "team" ? "text-indigo-600 font-medium" : "text-muted-foreground"
          )}
        >
          <Users className="h-4 w-4" /> Team
        </button>
        {canManageOrg && (
          <button
            onClick={() => setTab("audit")}
            className={cn(
              "flex flex-col items-center gap-1 text-[11px]",
              tab === "audit" ? "text-indigo-600 font-medium" : "text-muted-foreground"
            )}
          >
            <Activity className="h-4 w-4" /> Logs
          </button>
        )}
        <Link href="/settings" className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
          <Settings className="h-4 w-4" /> Account
        </Link>
      </nav>
    </div>
  );
}
