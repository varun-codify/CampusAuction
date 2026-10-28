import { Router, Response } from 'express';
import { getDb, schema } from '../db/index.js';
import { eq, or } from 'drizzle-orm';
import { authMiddleware, AuthRequest, generateToken } from '../auth/authMiddleware.js';
import crypto from 'crypto';

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

// 1. Get Current User Profile
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// 2. Campus Student Registration (Sign Up)
router.post('/register', async (req, res) => {
  try {
    const { name, email, studentId, campus, hall, phone, password, role = 'student' } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters long.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid campus email address is required.' });
    }
    if (!studentId || studentId.trim().length < 3) {
      return res.status(400).json({ error: 'Valid Student Roll / ID is required.' });
    }
    if (!password || password.trim().length < 4) {
      return res.status(400).json({ error: 'Password or PIN must be at least 4 characters long.' });
    }

    const db = await getDb();

    // Check if email or studentId already exists
    const existing = await db
      .select()
      .from(schema.users)
      .where(
        or(
          eq(schema.users.email, email.trim().toLowerCase()),
          eq(schema.users.studentId, studentId.trim().toUpperCase())
        )
      );

    if (existing.length > 0) {
      if (existing[0].email.toLowerCase() === email.trim().toLowerCase()) {
        return res.status(400).json({ error: 'An account with this campus email already exists. Please sign in.' });
      }
      return res.status(400).json({ error: 'An account with this Student ID already exists. Please sign in.' });
    }

    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = hashPassword(password);

    const newUser = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      studentId: studentId.trim().toUpperCase(),
      campus: campus?.trim() || 'IIT Kharagpur',
      hall: hall?.trim() || 'General Campus Residence',
      phone: phone?.trim() || null,
      isVerified: true,
      trustScore: 100, // Starts at 100 for clean slate
      role: role === 'admin' ? 'admin' : (role === 'seller' ? 'seller' : 'buyer'),
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 50000000)}?auto=format&fit=crop&q=80&w=256`,
      passwordHash,
      createdAt: new Date(),
    };

    await db.insert(schema.users).values(newUser);

    const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    return res.status(201).json({
      message: 'Campus account registered successfully!',
      user: newUser,
      token,
    });
  } catch (err: any) {
    console.error('[Register Error]:', err);
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// 3. Campus Login (supports campus email or student ID with password verification)
router.post('/login', async (req, res) => {
  try {
    const { credential, email, studentId, password } = req.body;
    const queryTerm = (credential || email || studentId || '').trim();

    if (!queryTerm) {
      return res.status(400).json({ error: 'Please enter your Student ID or Campus Email.' });
    }

    const db = await getDb();

    // Search by email or student ID
    const users = await db
      .select()
      .from(schema.users)
      .where(
        or(
          eq(schema.users.email, queryTerm.toLowerCase()),
          eq(schema.users.studentId, queryTerm.toUpperCase()),
          eq(schema.users.id, queryTerm)
        )
      );

    if (users.length === 0) {
      return res.status(401).json({
        error: `No campus account found for "${queryTerm}". Please verify your Roll No/Email or register a new account.`,
      });
    }

    const user = users[0];

    // Check if login request specified a portal role (buyer vs seller)
    const { expectedRole } = req.body;
    if (expectedRole && expectedRole !== 'any' && user.role !== 'admin' && user.role !== expectedRole) {
      const isSeller = user.role === 'seller';
      const actualLabel = isSeller ? 'Campus Seller' : 'Campus Buyer';
      const expectedLabel = expectedRole === 'seller' ? 'Campus Seller' : 'Campus Buyer';
      return res.status(403).json({
        error: `Portal Mismatch: "${user.name}" is registered as a ${actualLabel}. Please use the ${actualLabel} login tab or switch portals.`,
        userRole: user.role,
        expectedRole,
      });
    }

    // If password provided and user has passwordHash, verify it
    if (password && user.passwordHash) {
      const inputHash = hashPassword(password);
      if (inputHash !== user.passwordHash) {
        return res.status(401).json({ error: 'Incorrect password or campus PIN. Please try again.' });
      }
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return res.json({
      message: 'Sign in successful!',
      user,
      token,
    });
  } catch (err: any) {
    console.error('[Login Error]:', err);
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// 4. Logout Endpoint
router.post('/logout', (_req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// 5. Demo/Testing Switch User (switch between Rohan, Ananya, Vikram, Priya, Proctor)
router.get('/switch-user/:id', async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.id, req.params.id));
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = users[0];
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ user, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. List all campus test accounts for quick UI selector
router.get('/test-accounts', async (_req, res) => {
  try {
    const db = await getDb();
    const allUsers = await db.select().from(schema.users);
    return res.json({ users: allUsers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
