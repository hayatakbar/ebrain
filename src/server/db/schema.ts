import { pgTable, text, integer, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  handle: text("handle").notNull().unique(),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "personal" | "business"
  slug: text("slug").notNull().unique(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id).notNull(),
  counterpartyHandle: text("counterparty_handle"), // syncs across ebrain network!
  title: text("title").notNull(),
  category: text("category").notNull(), // "income" | "expense" | "receivable" | "payable"
  amountPkr: integer("amount_pkr").notNull(),
  status: text("status").default("synced").notNull(), // "pending" | "synced"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
