import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { AuthRequest, protect, signToken } from '../middleware/auth.ts';
import { dbRepo } from '../utils/store.ts';

const router = Router();

async function hydrateUser(user: any) {
  let plan = null;
  if (user.planId) {
    plan = await dbRepo.findById('plans', String(user.planId));
  }
  const activeSub = await dbRepo.findOne('subscriptions', {
    userId: user._id,
    status: 'active',
  });
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    planId: user.planId || null,
    plan,
    activeSubscriptionId: activeSub?._id || null,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, planId } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(String(email))) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (!phone || String(phone).trim().length < 8) {
      return res.status(400).json({ message: 'Please provide a valid phone number.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await dbRepo.findOne('users', { email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    let validPlanId: string | null = null;
    if (planId) {
      const plan = await dbRepo.findById('plans', String(planId));
      if (plan) validPlanId = plan._id;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const created = await dbRepo.create('users', {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      phone: String(phone).trim(),
      address: address ? String(address).trim() : '',
      role: 'member',
      planId: validPlanId,
      isActive: true,
    });

    const token = signToken(created._id, created.role);
    const userPayload = await hydrateUser(created);

    return res.status(201).json({ token, user: userPayload });
  } catch (err) {
    console.error('[Auth Register Error]', err);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await dbRepo.findOne('users', { email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isActive === false) {
      return res
        .status(403)
        .json({ message: 'Your membership account has been deactivated. Contact support.' });
    }

    const isMatch = await bcrypt.compare(String(password), String(user.passwordHash));
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user._id, user.role);
    const userPayload = await hydrateUser(user);

    return res.json({ token, user: userPayload });
  } catch (err) {
    console.error('[Auth Login Error]', err);
    return res.status(500).json({ message: 'Sign in failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res) => {
  try {
    const user = await dbRepo.findById('users', req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const userPayload = await hydrateUser(user);
    return res.json({ user: userPayload });
  } catch (err) {
    console.error('[Auth Me Error]', err);
    return res.status(500).json({ message: 'Failed to load profile.' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', protect, async (req: AuthRequest, res) => {
  try {
    const { name, phone, address } = req.body;
    const updates: Record<string, any> = {};
    if (name && String(name).trim().length >= 2) updates.name = String(name).trim();
    if (phone && String(phone).trim().length >= 8) updates.phone = String(phone).trim();
    if (address !== undefined) updates.address = String(address).trim();

    const updated = await dbRepo.updateById('users', req.user!._id, updates);
    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const userPayload = await hydrateUser(updated);
    return res.json({ user: userPayload });
  } catch (err) {
    console.error('[Auth Profile Update Error]', err);
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
});

export default router;
