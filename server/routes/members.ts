import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.ts';
import { dbRepo } from '../utils/store.ts';

const router = Router();

// All member management routes require admin role
router.use(protect, authorize('admin'));

// GET /api/members
router.get('/', async (req, res) => {
  try {
    const { search = '', status = 'all', planId = 'all' } = req.query as Record<string, string>;
    const users = await dbRepo.findAll('users', { role: 'member' });
    const plans = await dbRepo.findAll('plans');
    const subscriptions = await dbRepo.findAll('subscriptions');

    const planMap = new Map(plans.map((p) => [p._id, p]));

    let enriched = users.map((u) => {
      const sub = subscriptions.find(
        (s) => String(s.userId) === String(u._id) && s.status !== 'cancelled'
      );
      const effectivePlanId = sub?.planId || u.planId || null;
      const plan = effectivePlanId ? planMap.get(String(effectivePlanId)) || null : null;

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        address: u.address,
        role: u.role,
        planId: effectivePlanId,
        planName: plan?.name || 'No Plan',
        subscriptionStatus: sub?.status || 'none',
        isActive: u.isActive !== false,
        createdAt: u.createdAt,
      };
    });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q)
      );
    }

    if (status === 'active') {
      enriched = enriched.filter((m) => m.isActive);
    } else if (status === 'inactive') {
      enriched = enriched.filter((m) => !m.isActive);
    }

    if (planId !== 'all') {
      enriched = enriched.filter((m) => String(m.planId) === String(planId));
    }

    return res.json({ members: enriched });
  } catch (err) {
    console.error('[Members List Error]', err);
    return res.status(500).json({ message: 'Failed to load members.' });
  }
});

// POST /api/members
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, password, planId } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Member name must be at least 2 characters.' });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(String(email))) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }
    if (!phone || String(phone).trim().length < 8) {
      return res.status(400).json({ message: 'A valid phone number is required.' });
    }
    if (!address || String(address).trim().length < 5) {
      return res.status(400).json({ message: 'Delivery address must be at least 5 characters.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await dbRepo.findOne('users', { email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    let validPlan: any = null;
    if (planId) {
      validPlan = await dbRepo.findById('plans', String(planId));
      if (!validPlan) {
        return res.status(400).json({ message: 'Selected membership plan was not found.' });
      }
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const created = await dbRepo.create('users', {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      phone: String(phone).trim(),
      address: String(address).trim(),
      role: 'member',
      planId: validPlan ? validPlan._id : null,
      isActive: true,
    });

    // If a plan is assigned by admin, initialize an active subscription
    if (validPlan) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + Number(validPlan.daysPerMonth || 26));
      await dbRepo.create('subscriptions', {
        userId: created._id,
        planId: validPlan._id,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pausedAt: null,
        deliveryAddress: created.address,
        timeSlot: '12:00 PM - 1:00 PM',
        razorpayPaymentId: 'admin_assigned',
        razorpayOrderId: 'admin_assigned',
        autoRenew: true,
      });
    }

    return res.status(201).json({
      member: {
        _id: created._id,
        name: created.name,
        email: created.email,
        phone: created.phone,
        address: created.address,
        role: created.role,
        planId: created.planId,
        planName: validPlan?.name || 'No Plan',
        subscriptionStatus: validPlan ? 'active' : 'none',
        isActive: true,
        createdAt: created.createdAt,
      },
    });
  } catch (err) {
    console.error('[Members Create Error]', err);
    return res.status(500).json({ message: 'Failed to create member.' });
  }
});

// PATCH /api/members/:id/deactivate (soft delete: isActive = false)
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const member = await dbRepo.findById('users', req.params.id);
    if (!member || member.role === 'admin') {
      return res.status(404).json({ message: 'Member not found.' });
    }

    const updated = await dbRepo.updateById('users', member._id, { isActive: false });
    await dbRepo.updateMany(
      'subscriptions',
      { userId: member._id, status: 'active' },
      { status: 'cancelled' }
    );

    return res.json({
      message: `${member.name} has been deactivated.`,
      member: { ...updated, passwordHash: undefined },
    });
  } catch (err) {
    console.error('[Members Deactivate Error]', err);
    return res.status(500).json({ message: 'Failed to deactivate member.' });
  }
});

// PATCH /api/members/:id/reactivate
router.patch('/:id/reactivate', async (req, res) => {
  try {
    const member = await dbRepo.findById('users', req.params.id);
    if (!member || member.role === 'admin') {
      return res.status(404).json({ message: 'Member not found.' });
    }

    const updated = await dbRepo.updateById('users', member._id, { isActive: true });
    return res.json({
      message: `${member.name} has been reactivated.`,
      member: { ...updated, passwordHash: undefined },
    });
  } catch (err) {
    console.error('[Members Reactivate Error]', err);
    return res.status(500).json({ message: 'Failed to reactivate member.' });
  }
});

export default router;
