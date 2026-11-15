import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SUPABASE_URL } from '../config/supabase.ts';
import { dbRepo } from '../utils/store.ts';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'admin' | 'member';
  planId?: string | null;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const INTERNAL_SESSION_SIGNING_KEY = crypto
  .createHash('sha256')
  .update(`verdant-bowl-session:${SUPABASE_URL}`)
  .digest('hex');

export function getJwtSecret(): string {
  return INTERNAL_SESSION_SIGNING_KEY;
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ id: userId, role }, getJwtSecret(), { expiresIn: '7d' });
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: string };

    const user = await dbRepo.findById<AuthUser & { passwordHash?: string }>('users', decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'This member account has been deactivated.' });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      planId: user.planId || null,
      isActive: user.isActive,
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session token.' });
  }
}

export function authorize(...roles: Array<'admin' | 'member'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied for your account role.' });
    }
    next();
  };
}
