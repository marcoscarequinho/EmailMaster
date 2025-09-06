import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
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
    createTableIfMissing: true, // Re-enabled but table already exists
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'default-secret-key-for-dev',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: false, // Keep false for Replit dev environment
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: 'lax', // Allow cross-site requests for Replit URLs
      domain: undefined // Let the browser handle domain automatically
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        let user;
        
        if (username.includes('@')) {
          // Check if it's an email format first
          const emailUser = await storage.getUserByEmail(username);
          if (emailUser) {
            user = emailUser;
          } else {
            // Try username@domain format
            const [usernameOnly, domainName] = username.split('@');
            user = await storage.getUserByUsernameAndDomain(usernameOnly, domainName);
          }
        } else {
          // Plain username - check if there's only one user with this username
          const users = await storage.getUsersByUsername(username);
          if (users.length === 1) {
            user = users[0];
          } else if (users.length > 1) {
            // Multiple users with same username - require domain specification
            return done(null, false, { message: "Multiple users found. Please specify domain: username@domain" });
          } else {
            // No user found
            return done(null, false);
          }
        }
        
        if (!user || !user.isActive) {
          return done(null, false);
        }
        
        // Check password with bcrypt
        const isValid = await bcrypt.compare(password, user.password);
        if (isValid) {
          return done(null, user);
        }
        
        return done(null, false);
      } catch (error) {
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


  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        const message = info?.message || "Usuário ou senha incorretos";
        return res.status(401).json({ message });
      }
      
      req.logIn(user, async (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        try {
          // Update last login time
          await storage.updateUser(user.id, { lastLoginAt: new Date() as any }, user.id);
          res.status(200).json(user);
        } catch (error) {
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

  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/auth");
    });
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
    console.log("❌ SuperAdmin middleware: User not authenticated");
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user;
  console.log("🔒 SuperAdmin middleware check:", { 
    hasUser: !!user, 
    userRole: user?.role,
    userId: user?.id 
  });
  
  if (!user || user.role !== 'super_admin') {
    console.log("❌ SuperAdmin middleware: Access denied - insufficient permissions");
    return res.status(403).json({ message: "Super admin access required" });
  }
  
  console.log("✅ SuperAdmin middleware: Access granted");
  next();
};