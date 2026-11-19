import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { count } from "drizzle-orm";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import {
  ac,
  owner as orgOwner,
  admin as orgAdmin,
  employee as orgEmployee,
  client as orgClient,
  member as orgMember,
} from "./permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production-min-32-chars",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://ebrain.158.220.75.77.sslip.io",
    "https://ebrain.158.220.75.77.sslip.io",
  ],
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const existing = await db.select({ total: count() }).from(schema.user);
          const isFirstUser = Number(existing[0]?.total ?? 0) === 0;
          return {
            data: {
              ...user,
              role: isFirstUser ? "admin" : "user",
            },
          };
        },
        after: async (createdUser) => {
          await db.insert(schema.auditLog).values({
            id: crypto.randomUUID(),
            actorId: createdUser.id,
            actorEmail: createdUser.email,
            action: "user.registered",
            target: createdUser.email,
            details: `Role assigned: ${createdUser.role || "user"}`,
          });
        },
      },
    },
  },
  plugins: [
    admin(),
    organization({
      ac,
      roles: {
        owner: orgOwner,
        admin: orgAdmin,
        employee: orgEmployee,
        client: orgClient,
        member: orgMember,
      },
    }),
    nextCookies(),
  ],
});
