import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createUserSchema, updateUserSchema, createEmailSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes (Admin/Super Admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

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

  app.get('/api/users/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Admins can't create other admins, only super_admins can
      if (currentUser.role === 'admin' && req.body.role === 'admin') {
        return res.status(403).json({ message: "Admins cannot create other administrators" });
      }

      const userData = createUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData, userId);
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const userData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.params.id, userData, userId);
      
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

  // Email routes
  app.get('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { folder = 'inbox' } = req.query;
      
      const emails = await storage.getEmailsForUser(userId, folder as string);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.post('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emailData = createEmailSchema.parse(req.body);
      
      const email = await storage.createEmail(userId, emailData);
      res.status(201).json(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.patch('/api/emails/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { isRead, isStarred } = req.body;
      await storage.updateEmailStatus(req.params.id, isRead, isStarred);
      res.json({ message: "Email status updated" });
    } catch (error) {
      console.error("Error updating email status:", error);
      res.status(500).json({ message: "Failed to update email status" });
    }
  });

  app.patch('/api/emails/:id/folder', isAuthenticated, async (req: any, res) => {
    try {
      const { folder } = req.body;
      await storage.moveEmailToFolder(req.params.id, folder);
      res.json({ message: "Email moved" });
    } catch (error) {
      console.error("Error moving email:", error);
      res.status(500).json({ message: "Failed to move email" });
    }
  });

  // Audit logs route (Admin/Super Admin only)
  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

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
