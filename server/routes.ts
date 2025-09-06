import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, requireSuperAdmin } from "./auth";
import { createUserSchema, updateUserSchema, createEmailSchema, createDomainSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { users, emails, auditLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { emailService } from "./emailService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Health check endpoint for deployment health checks
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.get('/api/user', requireAuth, async (req: any, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // DEBUG: Check if user exists in database
  app.get('/api/debug/check-user/:id', requireSuperAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      // Also try direct database query
      const directQuery = await db.select().from(users).where(eq(users.id, userId));
      
      res.json({
        userId,
        userFromStorage: user,
        directQueryResult: directQuery,
        userExists: !!user,
        directQueryCount: directQuery.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DEBUG: Create a test user that can be deleted
  app.post('/api/debug/create-test-user', requireSuperAdmin, async (req: any, res) => {
    try {
      const testUser = await storage.createUser({
        username: 'testuser' + Date.now(),
        firstName: 'Test',
        lastName: 'User',
        email: 'test' + Date.now() + '@example.com',
        password: 'password123',
        role: 'client'
      }, req.user.id);
      
      res.json({ 
        message: 'Test user created successfully',
        user: testUser 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DEBUG: Test route to verify DELETE is working
  app.get('/api/users/:id/debug', requireSuperAdmin, async (req: any, res) => {
    console.log("🔧 DEBUG ROUTE: Checking user for deletion:", req.params.id);
    try {
      const user = await storage.getUser(req.params.id);
      console.log("🔧 DEBUG: User found:", JSON.stringify(user, null, 2));
      res.json({
        user,
        canDelete: user && user.role !== 'super_admin',
        currentUser: req.user,
        isSameUser: user && user.id === req.user.id
      });
    } catch (error) {
      console.error("🔧 DEBUG ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // User management routes (Admin/Super Admin only)
  app.get('/api/users', requireAdmin, async (req: any, res) => {
    try {
      const { role, search } = req.query;
      let users;

      if (search) {
        users = await storage.searchUsers(search as string);
      } else {
        users = await storage.getUsersByRole(role as any);
      }

      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/stats', requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.post('/api/users', requireSuperAdmin, async (req: any, res) => {
    try {
      const currentUser = req.user;

      const userData = createUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData, currentUser.id);
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id', requireAdmin, async (req: any, res) => {
    try {
      const currentUser = req.user;
      
      const userData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.params.id, userData, currentUser.id);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', requireSuperAdmin, async (req: any, res) => {
    console.log("🚀 DELETE ROUTE CALLED:", req.params.id);
    try {
      const currentUser = req.user;
      const userId = req.params.id;

      console.log("Route: Attempting to delete user:", { 
        userId, 
        currentUserId: currentUser.id, 
        currentUserRole: currentUser.role,
        timestamp: new Date().toISOString()
      });

      // Don't allow self-deletion
      if (userId === currentUser.id) {
        console.log("Route: Self-deletion attempt blocked");
        return res.status(400).json({ 
          message: "Cannot delete your own account - você não pode excluir sua própria conta",
          code: "SELF_DELETE_FORBIDDEN"
        });
      }
      
      // Debug: log both IDs to check if they match
      console.log("🔍 Comparison:", {
        targetUserId: userId,
        currentUserId: currentUser.id,
        areEqual: userId === currentUser.id,
        currentUserEmail: currentUser.email
      });

      const result = await storage.deleteUser(userId, currentUser.id);
      console.log("Route: Delete user result:", result);
      
      if (result !== true) {
        console.log("Route: Delete operation failed with:", result);
        const errorMessages = {
          'USER_NOT_FOUND': 'User not found',
          'CANNOT_DELETE_SUPER_ADMIN': 'Cannot delete super admin user',
        };
        
        const message = typeof result === 'string' && result.startsWith('DATABASE_ERROR:') 
          ? result 
          : errorMessages[result as keyof typeof errorMessages] || 'Cannot delete this user';
          
        return res.status(400).json({ 
          message,
          code: typeof result === 'string' ? result : 'DELETE_FAILED'
        });
      }

      console.log("Route: User deletion successful");
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Route: Error deleting user:", error);
      console.error("Route: Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace"
      });
      res.status(500).json({ 
        message: "Failed to delete user due to server error",
        code: "SERVER_ERROR"
      });
    }
  });

  // ALTERNATIVE DELETE ROUTE - Force delete with detailed logging
  app.post('/api/users/:id/force-delete', requireSuperAdmin, async (req: any, res) => {
    const userId = req.params.id;
    const currentUser = req.user;
    
    console.log("🔥 FORCE DELETE ROUTE - Starting");
    console.log("🔥 Target user ID:", userId);
    console.log("🔥 Current user:", JSON.stringify(currentUser, null, 2));
    
    try {
      // Get the user to delete
      const userToDelete = await storage.getUser(userId);
      console.log("🔥 User to delete:", JSON.stringify(userToDelete, null, 2));
      
      if (!userToDelete) {
        console.log("🔥 ERROR: User not found");
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Check if trying to delete self
      if (userId === currentUser.id) {
        console.log("🔥 ERROR: Self deletion attempt");
        return res.status(400).json({ message: "Você não pode excluir sua própria conta" });
      }
      
      // Check if trying to delete super admin
      if (userToDelete.role === 'super_admin') {
        console.log("🔥 ERROR: Trying to delete super admin");
        return res.status(400).json({ message: "Não é possível excluir um Super Admin" });
      }
      
      console.log("🔥 All checks passed, proceeding with force deletion");
      console.log("🔥 User to delete details:", {
        id: userToDelete.id,
        email: userToDelete.email,
        username: userToDelete.username,
        role: userToDelete.role
      });
      
      // Direct database deletion without transaction for simplicity
      console.log("🔥 Deleting emails...");
      await db.delete(emails).where(eq(emails.userId, userId));
      
      console.log("🔥 Updating audit logs...");
      await db
        .update(auditLogs)
        .set({ targetUserId: null })
        .where(eq(auditLogs.targetUserId, userId));
      
      console.log("🔥 Deleting user...");
      const deleteResult = await db.delete(users).where(eq(users.id, userId));
      console.log("🔥 Delete result:", deleteResult);
      console.log("🔥 Delete result type:", typeof deleteResult);
      console.log("🔥 Delete result keys:", Object.keys(deleteResult || {}));
      
      // Verify the user was actually deleted
      const verifyUser = await storage.getUser(userId);
      console.log("🔥 Verification - user still exists?", !!verifyUser);
      if (verifyUser) {
        console.error("🔥 ERROR: User was NOT deleted from database!");
        throw new Error("User deletion failed - user still exists in database");
      }
      
      // Log the action
      await storage.logAction(currentUser.id, 'FORCE_DELETE_USER', null, {
        deletedUserId: userId,
        deletedUserEmail: userToDelete.email,
        deletedUserName: `${userToDelete.firstName} ${userToDelete.lastName}`
      });
      
      console.log("🔥 SUCCESS: User deleted successfully");
      res.json({ 
        message: "Usuário excluído com sucesso",
        deletedUser: {
          id: userToDelete.id,
          name: `${userToDelete.firstName} ${userToDelete.lastName}`,
          email: userToDelete.email
        }
      });
      
    } catch (error) {
      console.error("🔥 FORCE DELETE ERROR:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Email routes
  app.get('/api/emails', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { folder = 'inbox' } = req.query;
      
      const emails = await storage.getEmailsForUser(userId, folder as string);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.post('/api/emails', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const emailData = createEmailSchema.parse(req.body);
      
      // Use the new email service instead of direct storage
      const result = await emailService.sendEmail(userId, emailData);
      
      res.status(201).json({
        message: "Email sent successfully",
        email: result.email,
        sentViaSmtp: result.sentViaSmtp,
        messageId: result.messageId,
        mockMode: result.mockMode
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.patch('/api/emails/:id/status', requireAuth, async (req: any, res) => {
    try {
      const { isRead, isStarred } = req.body;
      await storage.updateEmailStatus(req.params.id, isRead, isStarred);
      res.json({ message: "Email status updated" });
    } catch (error) {
      console.error("Error updating email status:", error);
      res.status(500).json({ message: "Failed to update email status" });
    }
  });

  app.patch('/api/emails/:id/folder', requireAuth, async (req: any, res) => {
    try {
      const { folder } = req.body;
      await storage.moveEmailToFolder(req.params.id, folder);
      res.json({ message: "Email moved" });
    } catch (error) {
      console.error("Error moving email:", error);
      res.status(500).json({ message: "Failed to move email" });
    }
  });

  // Email service management routes (Admin only)
  app.get('/api/email-service/status', requireAdmin, async (req: any, res) => {
    try {
      const status = emailService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting email service status:", error);
      res.status(500).json({ message: "Failed to get email service status" });
    }
  });

  app.post('/api/email-service/test', requireAdmin, async (req: any, res) => {
    try {
      const isConnected = await emailService.testConnection();
      res.json({ 
        connected: isConnected,
        message: isConnected ? "SMTP connection successful" : "SMTP connection failed"
      });
    } catch (error) {
      console.error("Error testing email service:", error);
      res.status(500).json({ message: "Failed to test email service" });
    }
  });

  // Domain management routes (Super Admin only)
  app.get('/api/domains', requireSuperAdmin, async (req: any, res) => {
    try {
      const domains = await storage.getDomains();
      res.json(domains);
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.post('/api/domains', requireSuperAdmin, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const domainData = createDomainSchema.parse(req.body);
      const newDomain = await storage.createDomain(domainData, currentUser.id);
      res.status(201).json(newDomain);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating domain:", error);
      res.status(500).json({ message: "Failed to create domain" });
    }
  });

  app.patch('/api/domains/:id/status', requireSuperAdmin, async (req: any, res) => {
    try {
      const { isActive } = req.body;
      await storage.updateDomainStatus(req.params.id, isActive);
      res.json({ message: "Domain status updated" });
    } catch (error) {
      console.error("Error updating domain status:", error);
      res.status(500).json({ message: "Failed to update domain status" });
    }
  });

  // Audit logs route (Admin/Super Admin only)
  app.get('/api/audit-logs', requireAdmin, async (req: any, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
