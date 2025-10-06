import {
  users,
  domains,
  emails,
  auditLogs,
  type User,
  type CreateUser,
  type UpdateUser,
  type Email,
  type CreateEmail,
  type CreateDomain,
  type Domain,
  type AuditLog,
  type UserRole,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, or, like, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (traditional auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: CreateUser, createdBy: string): Promise<User>;
  updateUser(id: string, userData: UpdateUser, updatedBy: string): Promise<User | undefined>;
  getUsersByRole(role?: UserRole): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  getUserStats(): Promise<{
    total: number;
    admins: number;
    clients: number;
    activeToday: number;
  }>;
  
  // Domain operations
  getDomains(): Promise<Domain[]>;
  createDomain(domainData: CreateDomain, createdBy: string): Promise<Domain>;
  updateDomainStatus(id: string, isActive: boolean): Promise<void>;
  
  // Email operations
  getEmailsForUser(userId: string, folder?: string): Promise<Email[]>;
  createEmail(userId: string, emailData: CreateEmail): Promise<Email>;
  updateEmailStatus(emailId: string, isRead?: boolean, isStarred?: boolean): Promise<void>;
  moveEmailToFolder(emailId: string, folder: string): Promise<void>;
  
  // Audit log operations
  logAction(userId: string, action: string, targetUserId?: string, details?: any): Promise<void>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (traditional auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  // Extended user operations
  async createUser(userData: CreateUser, createdBy: string): Promise<User> {
    const id = randomUUID();
    const { tempPassword, ...userDataWithoutPassword } = userData;
    const [user] = await db
      .insert(users)
      .values({
        id,
        ...userDataWithoutPassword,
        password: tempPassword, // In real app, hash this password
      })
      .returning();

    // Log the action
    await this.logAction(createdBy, 'CREATE_USER', user.id, {
      userEmail: userData.email,
      userRole: userData.role,
    });

    return user;
  }

  async updateUser(id: string, userData: UpdateUser, updatedBy: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (user) {
      await this.logAction(updatedBy, 'UPDATE_USER', user.id, userData);
    }

    return user;
  }

  async getUsersByRole(role?: UserRole): Promise<User[]> {
    if (role) {
      return await db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
    }
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          like(users.firstName, `%${query}%`),
          like(users.lastName, `%${query}%`),
          like(users.email, `%${query}%`)
        )
      )
      .orderBy(desc(users.createdAt));
  }

  async getUserStats(): Promise<{
    total: number;
    admins: number;
    clients: number;
    activeToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult] = await db.select({ count: count() }).from(users);
    const [adminResult] = await db.select({ count: count() }).from(users).where(eq(users.role, 'admin'));
    const [clientResult] = await db.select({ count: count() }).from(users).where(eq(users.role, 'client'));
    const [activeTodayResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.isActive, true), eq(users.lastLoginAt, today)));

    return {
      total: totalResult.count,
      admins: adminResult.count,
      clients: clientResult.count,
      activeToday: activeTodayResult.count,
    };
  }

  // Domain operations
  async getDomains(): Promise<Domain[]> {
    return await db.select().from(domains).orderBy(desc(domains.createdAt));
  }

  async createDomain(domainData: CreateDomain, createdBy: string): Promise<Domain> {
    const [domain] = await db
      .insert(domains)
      .values({
        ...domainData,
        createdBy,
      })
      .returning();

    // Log the action
    await this.logAction(createdBy, 'CREATE_DOMAIN', undefined, {
      domain: domainData.domain,
    });

    return domain;
  }

  async updateDomainStatus(id: string, isActive: boolean): Promise<void> {
    await db.update(domains).set({ isActive }).where(eq(domains.id, id));
  }

  // Email operations
  async getEmailsForUser(userId: string, folder = 'inbox'): Promise<Email[]> {
    return await db
      .select()
      .from(emails)
      .where(and(eq(emails.userId, userId), eq(emails.folder, folder as any)))
      .orderBy(desc(emails.createdAt));
  }

  async createEmail(userId: string, emailData: CreateEmail): Promise<Email> {
    const [email] = await db
      .insert(emails)
      .values({
        ...emailData,
        userId,
        sender: 'user@emailserver.com', // In real app, get from user profile
        folder: 'sent',
      })
      .returning();

    return email;
  }

  async updateEmailStatus(emailId: string, isRead?: boolean, isStarred?: boolean): Promise<void> {
    const updateData: any = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isStarred !== undefined) updateData.isStarred = isStarred;

    if (Object.keys(updateData).length > 0) {
      await db.update(emails).set(updateData).where(eq(emails.id, emailId));
    }
  }

  async moveEmailToFolder(emailId: string, folder: string): Promise<void> {
    await db.update(emails).set({ folder: folder as any }).where(eq(emails.id, emailId));
  }

  // Audit log operations
  async logAction(userId: string, action: string, targetUserId?: string, details?: any): Promise<void> {
    await db.insert(auditLogs).values({
      userId,
      action,
      targetUserId,
      details,
    });
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
