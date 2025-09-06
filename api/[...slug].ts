import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { setupAuth, requireAuth, requireAdmin, requireSuperAdmin } from '../server/auth';
import { storage } from '../server/storage';
import { createUserSchema, updateUserSchema, createEmailSchema, createDomainSchema } from '../shared/schema';
import { emailService } from '../server/emailService';
import { z } from 'zod';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://mail.marcoscarequinho.com.br'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for Vercel
app.use(session({
  secret: process.env.SESSION_SECRET || 'vercel-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  }
}));

// Setup authentication
setupAuth(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// User management routes (Super Admin only)
app.get('/api/users', requireSuperAdmin, async (req: any, res) => {
  try {
    const users = await storage.getUsersByRole();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.post('/api/users', requireSuperAdmin, async (req: any, res) => {
  try {
    const userData = createUserSchema.parse(req.body);
    const user = await storage.createUser(userData, req.user.id);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

app.patch('/api/users/:id', requireSuperAdmin, async (req: any, res) => {
  try {
    const userData = updateUserSchema.parse(req.body);
    const user = await storage.updateUser(req.params.id, userData, req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});

app.delete('/api/users/:id', requireSuperAdmin, async (req: any, res) => {
  try {
    const result = await storage.deleteUser(req.params.id, req.user.id);
    if (result === true) {
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(400).json({ message: result });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

app.get('/api/users/stats', requireSuperAdmin, async (req: any, res) => {
  try {
    const stats = await storage.getUserStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Failed to fetch user stats" });
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

// Export handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}