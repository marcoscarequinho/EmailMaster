import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin, requireSuperAdmin } from "./auth";
import { createUserSchema, updateUserSchema, createEmailSchema, createDomainSchema } from "@shared/schema";
import { z } from "zod";

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
