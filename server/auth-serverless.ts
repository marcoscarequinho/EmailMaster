import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sign, verify } from "jsonwebtoken";
import { Express, Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const JWT_SECRET = process.env.SESSION_SECRET || 'default-secret-key-for-dev';

export interface AuthenticatedRequest extends Request {
  user?: SelectUser;
  isAuthenticated(): boolean;
}

// JWT token generation
export function generateToken(user: SelectUser): string {
  return sign(
    { 
      id: user.id, 
      username: user.username,
      email: user.email,
      role: user.role,
      domainId: user.domainId
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
}

// JWT token verification
export function verifyToken(token: string): SelectUser | null {
  try {
    const decoded = verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // Also check cookies for token
    const cookieToken = req.headers.cookie
      ?.split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
    
    if (!cookieToken) {
      req.user = undefined;
      req.isAuthenticated = () => false;
      return next();
    }

    const user = verifyToken(cookieToken);
    req.user = user || undefined;
    req.isAuthenticated = () => !!user;
    return next();
  }

  const user = verifyToken(token);
  req.user = user || undefined;
  req.isAuthenticated = () => !!user;
  next();
}

// Login endpoint
export async function loginHandler(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

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
        return res.status(400).json({ 
          message: "Multiple users found. Please specify domain: username@domain" 
        });
      }
    }
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check password with bcrypt
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set cookie and return user data
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        domainId: user.domainId,
        isActive: user.isActive
      },
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Logout endpoint
export function logoutHandler(req: Request, res: Response) {
  res.clearCookie('auth_token');
  res.json({ message: "Logged out successfully" });
}

// Middleware functions
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: "Super admin access required" });
  }
  
  next();
}

export function setupServerlessAuth(app: Express) {
  // Add JSON parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add authentication middleware to all routes
  app.use(authenticateToken);
  
  // Auth routes
  app.post('/api/auth/login', loginHandler);
  app.post('/api/auth/logout', logoutHandler);
}