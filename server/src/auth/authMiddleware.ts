import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb, schema } from '../db/index.js';
import { eq, or } from 'drizzle-orm';
import { User } from '../../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-campus-bid-secret-key-2026';

export interface AuthRequest extends Request {
  user?: User;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const devUserId = req.headers['x-user-id'] as string;

    const db = await getDb();

    // 1. Authoritative Bearer Token Check (JWT Session)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.id) {
          const users = await db
            .select()
            .from(schema.users)
            .where(
              or(
                eq(schema.users.id, decoded.id),
                eq(schema.users.studentId, decoded.id)
              )
            );
          if (users.length > 0) {
            req.user = users[0] as unknown as User;
            return next();
          }
        }
      } catch (jwtErr) {
        // Fallback check if token is mock user ID
        const users = await db
          .select()
          .from(schema.users)
          .where(
            or(
              eq(schema.users.id, token),
              eq(schema.users.studentId, token)
            )
          );
        if (users.length > 0) {
          req.user = users[0] as unknown as User;
          return next();
        }
      }
    }

    // 2. Developer header fallback for integration tests without JWT
    if (devUserId) {
      const users = await db
        .select()
        .from(schema.users)
        .where(
          or(
            eq(schema.users.id, devUserId),
            eq(schema.users.studentId, devUserId)
          )
        );
      if (users.length > 0) {
        req.user = users[0] as unknown as User;
        return next();
      }
    }

    // Default student user for local testing if no header is supplied
    const defaultUser = await db.select().from(schema.users).where(eq(schema.users.id, 'usr-rohan-24'));
    if (defaultUser.length > 0) {
      req.user = defaultUser[0] as unknown as User;
      return next();
    }

    return res.status(401).json({ error: 'Unauthorized. Please sign in with your campus credentials.' });
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({ error: 'Internal authentication error.' });
  }
}

export function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}
