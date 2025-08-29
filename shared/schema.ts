import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoles = ['super_admin', 'admin', 'client'] as const;
export type UserRole = typeof userRoles[number];

// Users table with role-based hierarchy
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: userRoles }).default('client').notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// Mock emails table for demonstration
export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sender: varchar("sender").notNull(),
  recipient: varchar("recipient").notNull(),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  folder: varchar("folder", { enum: ['inbox', 'sent', 'drafts', 'spam', 'trash'] }).default('inbox').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs for admin actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for user upsert (Replit Auth)
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Schema for creating new users (Admin functionality)
export const createUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  role: true,
}).extend({
  tempPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// Schema for updating user
export const updateUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
}).partial();

// Schema for email creation
export const createEmailSchema = createInsertSchema(emails).pick({
  recipient: true,
  subject: true,
  body: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type CreateEmail = z.infer<typeof createEmailSchema>;
export type User = typeof users.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
