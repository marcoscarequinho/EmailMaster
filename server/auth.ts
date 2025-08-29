import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[PASSPORT DEBUG] Authenticating username: "${username}"`);
        const user = await storage.getUserByUsername(username);
        console.log(`[PASSPORT DEBUG] User lookup result:`, user ? { 
          id: user.id, 
          username: user.username, 
          role: user.role, 
          isActive: user.isActive,
          passwordLength: user.password ? user.password.length : 0
        } : null);
        
        if (!user || !user.isActive) {
          console.log(`[PASSPORT DEBUG] User not found or inactive`);
          return done(null, false);
        }
        
        console.log(`[PASSPORT DEBUG] Comparing passwords - provided: "${password}" vs stored: "${user.password}"`);
        // Check password (plain text for demo purposes)
        if (password === user.password) {
          console.log(`[PASSPORT DEBUG] Password match - authentication successful`);
          return done(null, user);
        }
        
        console.log(`[PASSPORT DEBUG] Password mismatch - authentication failed`);
        return done(null, false);
      } catch (error) {
        console.log(`[PASSPORT DEBUG] Error during authentication:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const { tempPassword, ...userData } = req.body;
      const user = await storage.createUser({
        ...userData,
        tempPassword: await hashPassword(tempPassword),
      }, 'system');

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`[LOGIN DEBUG] Login request received:`, { body: req.body, isAuthenticated: req.isAuthenticated() });
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      console.log(`[LOGIN DEBUG] Passport result:`, { err, user: user ? { id: user.id, username: user.username } : null, info });
      
      if (err) {
        console.log(`[LOGIN DEBUG] Authentication error:`, err);
        return res.status(500).json({ message: "Internal server error" });
      }
      
      if (!user) {
        console.log(`[LOGIN DEBUG] No user - sending 401`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.log(`[LOGIN DEBUG] Login error:`, loginErr);
          return res.status(500).json({ message: "Session error" });
        }
        
        try {
          console.log(`[LOGIN DEBUG] Login successful, updating timestamp`);
          await storage.updateUser(user.id, { lastLoginAt: new Date() as any }, user.id);
          res.status(200).json(user);
        } catch (error) {
          console.log(`[LOGIN DEBUG] Error updating timestamp:`, error);
          res.status(200).json(user);
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// Middleware to check authentication
export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware to check admin permissions
export const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user;
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  
  next();
};

// Middleware to check super admin permissions
export const requireSuperAdmin = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user;
  if (!user || user.role !== 'super_admin') {
    return res.status(403).json({ message: "Super admin access required" });
  }
  
  next();
};