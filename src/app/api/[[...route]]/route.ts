import { Hono } from "hono";
import { handle } from "hono/vercel";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

const app = new Hono().basePath("/api");

// Mount Better Auth endpoints (/api/auth/*)
app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

app.get("/health", async (c) => {
  try {
    await db.select().from(schema.user).limit(1);
    return c.json({ ok: true, db: "connected", platform: "ebrain" });
  } catch (err) {
    return c.json({ ok: false, db: "error", message: String(err) }, 500);
  }
});

// Get current user + all their organizations & roles
app.get("/me", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

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
    user: session.user,
    session: session.session,
    memberships,
  });
});

// Org members list + add existing registered user by email with role
app.get("/org/:orgId/members", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const orgId = c.req.param("orgId");
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
  const body = await c.req.json<{ email: string; role: string }>();
  const targetEmail = body.email?.trim().toLowerCase();
  const targetRole = body.role || "employee";

  const [targetUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, targetEmail))
    .limit(1);

  if (!targetUser) {
    return c.json({ error: "No registered user found with that email yet." }, 404);
  }

  const existing = await db
    .select()
    .from(schema.member)
    .where(eq(schema.member.organizationId, orgId));

  if (existing.some((m) => m.userId === targetUser.id)) {
    return c.json({ error: "User is already a member of this organization." }, 400);
  }

  const newId = crypto.randomUUID();
  await db.insert(schema.member).values({
    id: newId,
    organizationId: orgId,
    userId: targetUser.id,
    role: targetRole,
  });

  return c.json({ ok: true, memberId: newId });
});

app.patch("/org/:orgId/members/:memberId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const memberId = c.req.param("memberId");
  const body = await c.req.json<{ role: string }>();
  await db
    .update(schema.member)
    .set({ role: body.role })
    .where(eq(schema.member.id, memberId));

  return c.json({ ok: true });
});

// Super Admin Platform Overview (strictly role === "admin")
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

  return c.json({
    stats: {
      totalUsers: allUsers.length,
      totalOrganizations: allOrgs.length,
      totalMemberships: allMembers.length,
    },
    users: allUsers,
    organizations: allOrgs,
  });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
