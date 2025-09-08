import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { setupAuth, requireAuth, requireAdmin, requireSuperAdmin } from '../server/auth';
import { storage } from '../server/storage';
import { createUserSchema, updateUserSchema, createEmailSchema, createDomainSchema } from '../shared/schema';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize auth
let initialized = false;
async function initializeApp() {
  if (!initialized) {
    setupAuth(app);
    
    // Health check
    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Auth routes
    app.get('/api/user', async (req: any, res) => {
      try {
        if (!req.isAuthenticated()) {
          return res.json(null);
        }
        res.json(req.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    });

    // User management routes
    app.get('/api/users', requireAdmin, async (req: any, res) => {
      try {
        const users = await storage.getUsersByRole();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    });

    // Domains routes
    app.get('/api/domains', requireAdmin, async (req: any, res) => {
      try {
        const domains = await storage.getDomains();
        res.json(domains);
      } catch (error) {
        console.error("Error fetching domains:", error);
        res.status(500).json({ message: "Failed to fetch domains" });
      }
    });

    // Emails routes
    app.get('/api/emails', requireAuth, async (req: any, res) => {
      try {
        const { folder = 'inbox' } = req.query;
        const emails = await storage.getEmailsForUser(req.user.id, folder);
        res.json(emails);
      } catch (error) {
        console.error("Error fetching emails:", error);
        res.status(500).json({ message: "Failed to fetch emails" });
      }
    });

    initialized = true;
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await initializeApp();
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(200).end();
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Convert Vercel request/response to Express format
    (req as any).originalUrl = req.url;
    (req as any).path = new URL(req.url || '/', `http://${req.headers.host}`).pathname;
    
    return app(req as any, res as any);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}