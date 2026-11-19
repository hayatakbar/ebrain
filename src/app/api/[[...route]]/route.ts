import { Hono } from "hono";
import { handle } from "hono/vercel";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

const app = new Hono().basePath("/api");

async function logAudit(params: {
  actorId?: string | null;
  actorEmail?: string | null;
  organizationId?: string | null;
  action: string;
  target?: string | null;
  details?: string | null;
}) {
  await db.insert(schema.auditLog).values({
    id: crypto.randomUUID(),
    actorId: params.actorId ?? null,
    actorEmail: params.actorEmail ?? null,
    organizationId: params.organizationId ?? null,
    action: params.action,
    target: params.target ?? null,
    details: params.details ?? null,
  });
}

async function getAccess(userId: string, userRole: string | null | undefined, orgId: string) {
  const [membership] = await db
    .select()
    .from(schema.member)
    .where(and(eq(schema.member.userId, userId), eq(schema.member.organizationId, orgId)))
    .limit(1);

  const isSuperAdmin = userRole === "admin";
  const orgRole = membership?.role ?? null;
  const canManageOrg = isSuperAdmin || orgRole === "owner" || orgRole === "admin";
  const canWriteCrm = canManageOrg || orgRole === "employee";
  const isMember = isSuperAdmin || Boolean(membership);

  return { membership, isSuperAdmin, orgRole, canManageOrg, canWriteCrm, isMember };
}

// Mount Better Auth (/api/auth/*)
app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

app.get("/health", async (c) => {
  try {
    await db.select().from(schema.user).limit(1);
    return c.json({ ok: true, db: "connected", platform: "ebrain" });
  } catch (err) {
    return c.json({ ok: false, db: "error", message: String(err) }, 500);
  }
});

// Current User + Profile + Memberships
app.get("/me", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const [dbUser] = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      phone: schema.user.phone,
      role: schema.user.role,
    })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  const memberships = await db
    .select({
      memberId: schema.member.id,
      role: schema.member.role,
      orgId: schema.organization.id,
      orgName: schema.organization.name,
      orgSlug: schema.organization.slug,
      joinedAt: schema.member.createdAt,
    })
    .from(schema.member)
    .innerJoin(schema.organization, eq(schema.member.organizationId, schema.organization.id))
    .where(eq(schema.member.userId, session.user.id));

  return c.json({
    user: dbUser ?? session.user,
    session: session.session,
    memberships,
  });
});

// Update My Profile
app.patch("/me/profile", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json<{ name?: string; phone?: string }>();
  const cleanName = body.name?.trim();
  if (!cleanName) return c.json({ error: "Name is required" }, 400);

  await db
    .update(schema.user)
    .set({
      name: cleanName,
      phone: body.phone?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, session.user.id));

  await logAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "profile.updated",
    target: session.user.email,
    details: `Updated name/phone`,
  });

  return c.json({ ok: true });
});

// Update Organization Settings (Owner/Admin only)
app.patch("/org/:orgId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canManageOrg) {
    return c.json({ error: "Only Organization Owners or Admins can edit settings." }, 403);
  }

  const body = await c.req.json<{ name?: string; slug?: string }>();
  const cleanName = body.name?.trim();
  const cleanSlug = body.slug
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!cleanName || !cleanSlug) {
    return c.json({ error: "Organization name and valid slug are required." }, 400);
  }

  await db
    .update(schema.organization)
    .set({ name: cleanName, slug: cleanSlug })
    .where(eq(schema.organization.id, orgId));

  await logAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    organizationId: orgId,
    action: "organization.updated",
    target: cleanName,
    details: `Slug: /${cleanSlug}`,
  });

  return c.json({ ok: true });
});

// Org Members (Read: any org member; Write: Owner/Admin only)
app.get("/org/:orgId/members", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.isMember) return c.json({ error: "Forbidden" }, 403);

  const rows = await db
    .select({
      memberId: schema.member.id,
      role: schema.member.role,
      userId: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      joinedAt: schema.member.createdAt,
    })
    .from(schema.member)
    .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
    .where(eq(schema.member.organizationId, orgId));

  return c.json({ members: rows });
});

app.post("/org/:orgId/members", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canManageOrg) {
    return c.json({ error: "Only Owners or Admins can add members." }, 403);
  }

  const body = await c.req.json<{ email: string; role: string }>();
  const targetEmail = body.email?.trim().toLowerCase();
  const targetRole = body.role || "employee";

  const [targetUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, targetEmail))
    .limit(1);

  if (!targetUser) {
    return c.json(
      { error: "User not registered yet. Use 'Create Invite Link' below so they can sign up!" },
      404
    );
  }

  const existing = await db
    .select()
    .from(schema.member)
    .where(and(eq(schema.member.organizationId, orgId), eq(schema.member.userId, targetUser.id)))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "User is already in this organization." }, 400);
  }

  const newId = crypto.randomUUID();
  await db.insert(schema.member).values({
    id: newId,
    organizationId: orgId,
    userId: targetUser.id,
    role: targetRole,
  });

  await logAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    organizationId: orgId,
    action: "member.added",
    target: targetEmail,
    details: `Role: ${targetRole}`,
  });

  return c.json({ ok: true, memberId: newId });
});

app.patch("/org/:orgId/members/:memberId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canManageOrg) {
    return c.json({ error: "Only Owners or Admins can change roles." }, 403);
  }

  const memberId = c.req.param("memberId");
  const body = await c.req.json<{ role: string }>();

  await db
    .update(schema.member)
    .set({ role: body.role })
    .where(and(eq(schema.member.id, memberId), eq(schema.member.organizationId, orgId)));

  await logAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    organizationId: orgId,
    action: "member.role_changed",
    target: memberId,
    details: `New role: ${body.role}`,
  });

  return c.json({ ok: true });
});

// Invite Links (Create/List/Revoke by Owner/Admin; View/Accept by Invitee)
app.get("/org/:orgId/invitations", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canManageOrg) return c.json({ invitations: [] });

  const list = await db
    .select()
    .from(schema.invitation)
    .where(eq(schema.invitation.organizationId, orgId))
    .orderBy(desc(schema.invitation.createdAt));

  return c.json({ invitations: list });
});

app.post("/org/:orgId/invitations", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canManageOrg) {
    return c.json({ error: "Only Owners or Admins can create invite links." }, 403);
  }

  const body = await c.req.json<{ email: string; role: string }>();
  const cleanEmail = body.email?.trim().toLowerCase();
  if (!cleanEmail) return c.json({ error: "Email is required" }, 400);

  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(schema.invitation).values({
    id,
    organizationId: orgId,
    email: cleanEmail,
    role: body.role || "employee",
    status: "pending",
    expiresAt,
    inviterId: session.user.id,
  });

  await logAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    organizationId: orgId,
    action: "invitation.created",
    target: cleanEmail,
    details: `Invited as ${body.role || "employee"}`,
  });

  return c.json({ ok: true, id });
});

app.delete("/org/:orgId/invitations/:invId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const invId = c.req.param("invId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canManageOrg) return c.json({ error: "Forbidden" }, 403);

  await db
    .delete(schema.invitation)
    .where(and(eq(schema.invitation.id, invId), eq(schema.invitation.organizationId, orgId)));

  return c.json({ ok: true });
});

app.get("/invitations/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db
    .select({
      id: schema.invitation.id,
      email: schema.invitation.email,
      role: schema.invitation.role,
      status: schema.invitation.status,
      expiresAt: schema.invitation.expiresAt,
      orgId: schema.organization.id,
      orgName: schema.organization.name,
      orgSlug: schema.organization.slug,
    })
    .from(schema.invitation)
    .innerJoin(schema.organization, eq(schema.invitation.organizationId, schema.organization.id))
    .where(eq(schema.invitation.id, id))
    .limit(1);

  if (!row) return c.json({ error: "Invitation not found" }, 404);
  return c.json({ invitation: row });
});

app.post("/invitations/:id/accept", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Please sign in or register first." }, 401);

  const id = c.req.param("id");
  const [inv] = await db
    .select()
    .from(schema.invitation)
    .where(eq(schema.invitation.id, id))
    .limit(1);

  if (!inv) return c.json({ error: "Invitation not found." }, 404);
  if (inv.status !== "pending") return c.json({ error: "Invitation already used or expired." }, 400);
  if (new Date(inv.expiresAt).getTime() < Date.now()) {
    return c.json({ error: "Invitation has expired." }, 400);
  }
  if (inv.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return c.json(
      { error: `This invite was sent to ${inv.email}, but you are signed in as ${session.user.email}.` },
      403
    );
  }

  const existing = await db
    .select()
    .from(schema.member)
    .where(and(eq(schema.member.organizationId, inv.organizationId), eq(schema.member.userId, session.user.id)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(schema.member).values({
      id: crypto.randomUUID(),
      organizationId: inv.organizationId,
      userId: session.user.id,
      role: inv.role || "member",
    });
  }

  await db
    .update(schema.invitation)
    .set({ status: "accepted" })
    .where(eq(schema.invitation.id, inv.id));

  await logAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    organizationId: inv.organizationId,
    action: "invitation.accepted",
    target: session.user.email,
    details: `Joined as ${inv.role || "member"}`,
  });

  return c.json({ ok: true, organizationId: inv.organizationId });
});

// Org Audit Logs (Owner/Admin only)
app.get("/org/:orgId/audit", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canManageOrg) return c.json({ logs: [] });

  const logs = await db
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.organizationId, orgId))
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(50);

  return c.json({ logs });
});

// Module #1: Multi-Tenant CRM & Client Requests
app.get("/org/:orgId/crm", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.isMember) return c.json({ error: "Forbidden" }, 403);

  const allRecords = await db
    .select()
    .from(schema.crmRecord)
    .where(eq(schema.crmRecord.organizationId, orgId))
    .orderBy(desc(schema.crmRecord.createdAt));

  // Clients/Members only see records matching their email unless staff/admin
  const records =
    access.canWriteCrm
      ? allRecords
      : allRecords.filter((r) => r.email?.toLowerCase() === session.user.email.toLowerCase());

  return c.json({ records, canWrite: access.canWriteCrm });
});

app.post("/org/:orgId/crm", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canWriteCrm) {
    return c.json({ error: "Only Owners, Admins, or Employees can add CRM records." }, 403);
  }

  const body = await c.req.json<{
    name: string;
    email?: string;
    phone?: string;
    kind?: string;
    status?: string;
    notes?: string;
  }>();

  if (!body.name?.trim()) return c.json({ error: "Name/Title is required" }, 400);

  const id = crypto.randomUUID();
  await db.insert(schema.crmRecord).values({
    id,
    organizationId: orgId,
    createdById: session.user.id,
    name: body.name.trim(),
    email: body.email?.trim().toLowerCase() || null,
    phone: body.phone?.trim() || null,
    kind: body.kind || "client",
    status: body.status || "active",
    notes: body.notes?.trim() || null,
  });

  await logAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    organizationId: orgId,
    action: "crm.created",
    target: body.name.trim(),
    details: `Type: ${body.kind || "client"}`,
  });

  return c.json({ ok: true, id });
});

app.patch("/org/:orgId/crm/:recId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const recId = c.req.param("recId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canWriteCrm) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json<{ status: string }>();
  await db
    .update(schema.crmRecord)
    .set({ status: body.status })
    .where(and(eq(schema.crmRecord.id, recId), eq(schema.crmRecord.organizationId, orgId)));

  return c.json({ ok: true });
});

app.delete("/org/:orgId/crm/:recId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
  const recId = c.req.param("recId");
  const access = await getAccess(session.user.id, session.user.role, orgId);
  if (!access.canManageOrg) return c.json({ error: "Only Owners or Admins can delete records." }, 403);

  await db
    .delete(schema.crmRecord)
    .where(and(eq(schema.crmRecord.id, recId), eq(schema.crmRecord.organizationId, orgId)));

  return c.json({ ok: true });
});

// Super Admin Platform Overview
app.get("/platform/overview", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || session.user.role !== "admin") {
    return c.json({ error: "Forbidden: Super Admin only" }, 403);
  }

  const allUsers = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      phone: schema.user.phone,
      role: schema.user.role,
      banned: schema.user.banned,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .orderBy(desc(schema.user.createdAt));

  const allOrgs = await db
    .select()
    .from(schema.organization)
    .orderBy(desc(schema.organization.createdAt));

  const allMembers = await db.select().from(schema.member);
  const allCrm = await db.select().from(schema.crmRecord);
  const recentLogs = await db
    .select()
    .from(schema.auditLog)
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(50);

  return c.json({
    stats: {
      totalUsers: allUsers.length,
      totalOrganizations: allOrgs.length,
      totalMemberships: allMembers.length,
      totalCrmRecords: allCrm.length,
    },
    users: allUsers,
    organizations: allOrgs,
    auditLogs: recentLogs,
  });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
