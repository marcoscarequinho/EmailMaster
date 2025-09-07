import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';

const app = express();

// Initialize the app with all routes
let serverInitialized = false;
let server: any;

async function initializeServer() {
  if (!serverInitialized) {
    server = await registerRoutes(app);
    serverInitialized = true;
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await initializeServer();
    
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