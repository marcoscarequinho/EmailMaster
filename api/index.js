// Vercel serverless function entry point
const path = require('path');
const express = require('express');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Import and setup routes
const { registerRoutes } = require('../dist/routes');
const { serveStatic } = require('../dist/vite');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup API routes
registerRoutes(app).then(() => {
  // Serve static files in production
  serveStatic(app);
}).catch(console.error);

// Export for Vercel
module.exports = app;