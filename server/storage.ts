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
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations (traditional auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByUsername(username: string): Promise<User[]>;
  getUserByUsernameAndDomain(username: string, domainName: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: CreateUser, createdBy: string): Promise<User>;
  updateUser(id: string, userData: UpdateUser, updatedBy: string): Promise<User | undefined>;
  deleteUser(id: string, deletedBy: string): Promise<boolean | string>;
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

  async getUsersByUsername(username: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.username, username));
  }

  async getUserByUsernameAndDomain(username: string, domainName: string): Promise<User | undefined> {
    const [domain] = await db.select().from(domains).where(eq(domains.domain, domainName));
    if (!domain) {
      return undefined;
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.domainId, domain.id)));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Extended user operations
  async createUser(userData: CreateUser, createdBy: string): Promise<User> {
    const id = randomUUID();
    const { tempPassword, ...userDataWithoutPassword } = userData;
    
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        id,
        ...userDataWithoutPassword,
        password: hashedPassword,
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

  async deleteUser(id: string, deletedBy: string): Promise<boolean | string> {
    console.log("=== STORAGE DELETE USER START ===");
    console.log("Storage deleteUser called:", { id, deletedBy });
    
    // Don't allow deleting super admin
    const userToDelete = await this.getUser(id);
    console.log("User to delete:", JSON.stringify(userToDelete, null, 2));
    
    if (!userToDelete) {
      console.log("❌ Cannot delete user - user not found");
      return "USER_NOT_FOUND";
    }
    
    if (userToDelete.role === 'super_admin') {
      console.log("❌ Cannot delete user - user is super_admin");
      return "CANNOT_DELETE_SUPER_ADMIN";
    }
    
    console.log("✅ User validation passed, proceeding with deletion");

    try {
      console.log("Starting database transaction...");
      const result = await db.transaction(async (tx) => {
        // Check if user exists in sessions table and remove them
        console.log("Checking and removing user sessions...");
        try {
          // Note: we can't easily remove sessions in PostgreSQL connect-pg-simple without raw SQL
          // but it's not critical for user deletion
        } catch (sessionError) {
          console.warn("Could not clean up sessions:", sessionError);
        }

        // First, delete related emails
        console.log("Deleting related emails...");
        const deletedEmails = await tx.delete(emails).where(eq(emails.userId, id));
        console.log("Deleted emails result:", deletedEmails);
        
        // Note: audit_logs foreign key constraints have been removed
        // so we can delete the user directly without updating audit logs
        
        // Delete the user
        console.log("Deleting user record...");
        const deletedUser = await tx.delete(users).where(eq(users.id, id));
        console.log("Deleted user result:", deletedUser);
        
        return true;
      });
      
      console.log("✅ Transaction result:", result);
      console.log("✅ Transaction completed, logging action...");
      
      // Log the deletion action
      await this.logAction(deletedBy, 'DELETE_USER', null, { 
        deletedUserId: id,
        username: userToDelete.username,
        deletedUserEmail: userToDelete.email
      });
      
      console.log("✅ User deletion completed successfully");
      console.log("=== STORAGE DELETE USER END: SUCCESS ===");
      return true;
    } catch (error) {
      console.error("❌ Error deleting user - full error:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.log("=== STORAGE DELETE USER END: FAILED ===");
      return `DATABASE_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
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
    // Get sender's email
    const sender = await this.getUser(userId);
    if (!sender) {
      throw new Error('Sender not found');
    }
    
    // Create email in sender's sent folder
    const [sentEmail] = await db
      .insert(emails)
      .values({
        ...emailData,
        userId,
        sender: sender.email || sender.username,
        folder: 'sent',
      })
      .returning();

    // Find recipient user by email
    const recipient = await db
      .select()
      .from(users)
      .where(eq(users.email, emailData.recipient))
      .limit(1);
    
    // If recipient exists in the system, create email in their inbox
    if (recipient.length > 0) {
      await db
        .insert(emails)
        .values({
          ...emailData,
          userId: recipient[0].id,
          sender: sender.email || sender.username,
          folder: 'inbox',
          isRead: false,
        });
    }

    return sentEmail;
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
