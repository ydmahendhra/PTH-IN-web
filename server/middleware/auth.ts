import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error('JWT_SECRET environment variable is required.');
  }
  console.warn('[Auth] JWT_SECRET not set; using an insecure development-only secret.');
}
const SIGNING_SECRET = JWT_SECRET || 'dev-only-insecure-secret';

export interface AuthUser {
  id: string; // adminId or internId
  username: string;
  email: string;
  role: 'admin' | 'intern';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, SIGNING_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, SIGNING_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }

  req.user = decoded;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  authenticate(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Administrator privileges required.' });
    }
    next();
  });
}

export function requireIntern(req: Request, res: Response, next: NextFunction) {
  authenticate(req, res, () => {
    if (req.user?.role !== 'intern') {
      return res.status(403).json({ success: false, message: 'Forbidden. Intern access only.' });
    }
    next();
  });
}
