import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { storage } from '../server/storage';
import { setupServerlessAuth, requireAuth, requireAdmin, requireSuperAdmin, AuthenticatedRequest } from '../server/auth-serverless';

// Create Express app instance
const app = express();

// Initialize the app once
let initialized = false;
let server: any;

async function initializeApp() {
  if (!initialized) {
    try {
      console.log('Initializing EmailMaster API...');
      
      // Setup CORS
      app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
      }));
      
      // Setup serverless authentication
      setupServerlessAuth(app);
      
      // Health check endpoint
      app.get('/api/health', (req, res) => {
        res.status(200).json({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        });
      });

      // User endpoint
      app.get('/api/user', (req: AuthenticatedRequest, res) => {
        if (!req.isAuthenticated()) {
          return res.json(null);
        }
        res.json(req.user);
      });

      // Users management (admin only)
      app.get('/api/users', requireAdmin, async (req: AuthenticatedRequest, res) => {
        try {
          const users = await storage.getUsersByRole();
          res.json(users);
        } catch (error) {
          console.error("Error fetching users:", error);
          res.status(500).json({ message: "Failed to fetch users" });
        }
      });

      // Domains management (admin only)
      app.get('/api/domains', requireAdmin, async (req: AuthenticatedRequest, res) => {
        try {
          const domains = await storage.getDomains();
          res.json(domains);
        } catch (error) {
          console.error("Error fetching domains:", error);
          res.status(500).json({ message: "Failed to fetch domains" });
        }
      });

      // Emails endpoint
      app.get('/api/emails', requireAuth, async (req: AuthenticatedRequest, res) => {
        try {
          const { folder = 'inbox' } = req.query;
          const emails = await storage.getEmailsForUser(req.user!.id, folder as string);
          res.json(emails);
        } catch (error) {
          console.error("Error fetching emails:", error);
          res.status(500).json({ message: "Failed to fetch emails" });
        }
      });

      initialized = true;
      console.log('API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize API:', error);
      throw error;
    }
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize the Express app with all routes
    const expressApp = await initializeApp();

    // Convert Vercel request/response to Express-compatible format
    (req as any).originalUrl = req.url;
    (req as any).path = new URL(req.url || '/', `http://${req.headers.host}`).pathname;
    
    // Add request body parsing manually since we're not using Express middleware in Vercel
    if (req.method === 'POST' || req.method === 'PUT') {
      (req as any).body = req.body;
    }

    // Create a promise to handle the Express app response
    return new Promise((resolve, reject) => {
      // Set up response handlers
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;
      
      let handled = false;

      res.send = function(body: any) {
        if (!handled) {
          handled = true;
          resolve(originalSend.call(this, body));
        }
        return this;
      };

      res.json = function(obj: any) {
        if (!handled) {
          handled = true;
          resolve(originalJson.call(this, obj));
        }
        return this;
      };

      res.end = function(chunk?: any, encoding?: any) {
        if (!handled) {
          handled = true;
          resolve(originalEnd.call(this, chunk, encoding));
        }
        return this;
      };

      // Handle the request through Express
      expressApp(req as any, res as any, (err: any) => {
        if (!handled) {
          handled = true;
          if (err) {
            console.error('Express app error:', err);
            reject(err);
          } else {
            // If no route was matched, return 404
            res.status(404).json({ error: 'Route not found' });
            resolve(undefined);
          }
        }
      });

      // Set a timeout to prevent hanging
      setTimeout(() => {
        if (!handled) {
          handled = true;
          console.error('Request timeout');
          res.status(500).json({ error: 'Request timeout' });
          resolve(undefined);
        }
      }, 25000); // 25 seconds (less than Vercel's 30s limit)
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}