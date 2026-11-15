import { Router } from 'express';
import { AuthRequest, authorize, protect } from '../middleware/auth.ts';
import { dbRepo } from '../utils/store.ts';

const router = Router();

export async function generateDailySubscriptionOrders({
  userId,
  subscriptionId,
  plan,
  deliveryAddress,
  timeSlot,
  startDate,
  paymentId,
}: {
  userId: string;
  subscriptionId: string;
  plan: any;
  deliveryAddress: string;
  timeSlot: string;
  startDate: Date;
  paymentId: string;
}) {
  const days = Number(plan.daysPerMonth || 20);
  const saladsPerDay = Number(plan.saladsPerDay || 1);
  const salads = await dbRepo.findAll('salads', { isAvailable: true });
  const rotation =
    salads.length > 0
      ? salads
      : [{ _id: 'default', name: 'Chef Daily Greens Bowl', calories: 410 }];

  const generatedOrders = [];
  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const scheduled = new Date(startDate);
    scheduled.setDate(startDate.getDate() + dayIndex);

    const dayItems = [];
    for (let s = 0; s < saladsPerDay; s++) {
      const bowl = rotation[(dayIndex + s) % rotation.length];
      dayItems.push({
        saladId: bowl._id,
        name: `${bowl.name} (${plan.name} Daily Plan)`,
        quantity: 1,
        unitPrice: 0,
        calories: Number(bowl.calories || 420),
        isCustom: false,
      });
    }

    const orderNumber = `SUB-${String(subscriptionId).slice(-4).toUpperCase()}-D${String(
      dayIndex + 1
    ).padStart(2, '0')}-${Math.floor(100 + Math.random() * 899)}`;

    const createdOrder = await dbRepo.create('orders', {
      orderNumber,
      userId,
      items: dayItems,
      subtotal: 0,
      discountPercent: plan.discountPercent,
      discountAmount: 0,
      deliveryFee: 0,
      totalAmount: 0,
      deliveryAddress,
      timeSlot,
      status: dayIndex === 0 ? 'Preparing' : 'Pending',
      orderType: 'subscription',
      subscriptionId,
      scheduledDate: scheduled.toISOString(),
      paymentStatus: 'paid',
      paymentId,
    });
    generatedOrders.push(createdOrder);
  }
  return generatedOrders;
}

// GET /api/subscriptions/my
router.get('/my', protect, async (req: AuthRequest, res) => {
  try {
    const subs = await dbRepo.findAll('subscriptions', { userId: req.user!._id });
    const plans = await dbRepo.findAll('plans');
    const planMap = new Map(plans.map((p) => [p._id, p]));

    const enriched: Array<Record<string, any>> = subs.map((s) => ({
      ...s,
      plan: planMap.get(String(s.planId)) || null,
    }));

    const current =
      enriched.find((s) => s.status === 'active' || s.status === 'paused') || enriched[0] || null;

    return res.json({ subscription: current, history: enriched });
  } catch (err) {
    console.error('[My Subscription Error]', err);
    return res.status(500).json({ message: 'Failed to load subscription.' });
  }
});

// GET /api/subscriptions (Admin: view all subscriptions)
router.get('/', protect, authorize('admin'), async (_req, res) => {
  try {
    const subs = await dbRepo.findAll('subscriptions');
    const users = await dbRepo.findAll('users');
    const plans = await dbRepo.findAll('plans');

    const userMap = new Map(users.map((u) => [u._id, u]));
    const planMap = new Map(plans.map((p) => [p._id, p]));

    const enriched = subs.map((s) => {
      const member = userMap.get(String(s.userId));
      const plan = planMap.get(String(s.planId));
      return {
        ...s,
        memberName: member?.name || 'Unknown',
        memberEmail: member?.email || '',
        planName: plan?.name || 'Plan',
        monthlyPrice: plan?.monthlyPrice || 0,
      };
    });

    return res.json({ subscriptions: enriched });
  } catch (err) {
    console.error('[Admin Subscriptions Error]', err);
    return res.status(500).json({ message: 'Failed to load subscriptions.' });
  }
});

// POST /api/subscriptions (Direct create or post-payment activation)
router.post('/', protect, async (req: AuthRequest, res) => {
  try {
    const { planId, deliveryAddress, timeSlot, razorpayPaymentId, razorpayOrderId } = req.body;
    const plan = await dbRepo.findById('plans', String(planId));
    if (!plan) {
      return res.status(404).json({ message: 'Membership plan not found.' });
    }

    if (!deliveryAddress || String(deliveryAddress).trim().length < 5) {
      return res.status(400).json({ message: 'Valid delivery address is required.' });
    }

    // Cancel any previous active/paused subscription for clean transition
    await dbRepo.updateMany(
      'subscriptions',
      { userId: req.user!._id, status: { $in: ['active', 'paused'] } },
      { status: 'cancelled' }
    );

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Number(plan.daysPerMonth));

    const subscription = await dbRepo.create('subscriptions', {
      userId: req.user!._id,
      planId: plan._id,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      pausedAt: null,
      deliveryAddress: String(deliveryAddress).trim(),
      timeSlot: timeSlot || '12:00 PM - 1:00 PM',
      razorpayPaymentId: razorpayPaymentId || `pay_sub_${Date.now()}`,
      razorpayOrderId: razorpayOrderId || `order_sub_${Date.now()}`,
      autoRenew: true,
    });

    await dbRepo.updateById('users', req.user!._id, { planId: plan._id });

    const generatedOrders = await generateDailySubscriptionOrders({
      userId: req.user!._id,
      subscriptionId: subscription._id,
      plan,
      deliveryAddress: String(deliveryAddress).trim(),
      timeSlot: timeSlot || '12:00 PM - 1:00 PM',
      startDate,
      paymentId: subscription.razorpayPaymentId,
    });

    return res.status(201).json({
      subscription: { ...subscription, plan },
      generatedOrdersCount: generatedOrders.length,
    });
  } catch (err) {
    console.error('[Create Subscription Error]', err);
    return res.status(500).json({ message: 'Failed to activate subscription.' });
  }
});

// PATCH /api/subscriptions/:id/pause
router.patch('/:id/pause', protect, async (req: AuthRequest, res) => {
  try {
    const sub = await dbRepo.findById('subscriptions', req.params.id);
    if (!sub || (String(sub.userId) !== String(req.user!._id) && req.user!.role !== 'admin')) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }
    if (sub.status !== 'active') {
      return res.status(400).json({ message: 'Only active subscriptions can be paused.' });
    }

    const updated = await dbRepo.updateById('subscriptions', sub._id, {
      status: 'paused',
      pausedAt: new Date().toISOString(),
    });
    const plan = await dbRepo.findById('plans', String(sub.planId));

    return res.json({ subscription: { ...updated, plan } });
  } catch (err) {
    console.error('[Pause Subscription Error]', err);
    return res.status(500).json({ message: 'Failed to pause subscription.' });
  }
});

// PATCH /api/subscriptions/:id/resume
router.patch('/:id/resume', protect, async (req: AuthRequest, res) => {
  try {
    const sub = await dbRepo.findById('subscriptions', req.params.id);
    if (!sub || (String(sub.userId) !== String(req.user!._id) && req.user!.role !== 'admin')) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }
    if (sub.status !== 'paused') {
      return res.status(400).json({ message: 'Only paused subscriptions can be resumed.' });
    }

    // Extend end date by paused days
    const pausedMs = sub.pausedAt ? Date.now() - new Date(sub.pausedAt).getTime() : 0;
    const extraDays = Math.max(0, Math.floor(pausedMs / 86400000));
    const currentEnd = new Date(sub.endDate);
    currentEnd.setDate(currentEnd.getDate() + extraDays);

    const updated = await dbRepo.updateById('subscriptions', sub._id, {
      status: 'active',
      pausedAt: null,
      endDate: currentEnd.toISOString(),
    });
    const plan = await dbRepo.findById('plans', String(sub.planId));

    return res.json({ subscription: { ...updated, plan } });
  } catch (err) {
    console.error('[Resume Subscription Error]', err);
    return res.status(500).json({ message: 'Failed to resume subscription.' });
  }
});

// PATCH /api/subscriptions/:id/cancel
router.patch('/:id/cancel', protect, async (req: AuthRequest, res) => {
  try {
    const sub = await dbRepo.findById('subscriptions', req.params.id);
    if (!sub || (String(sub.userId) !== String(req.user!._id) && req.user!.role !== 'admin')) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    const updated = await dbRepo.updateById('subscriptions', sub._id, {
      status: 'cancelled',
      autoRenew: false,
    });

    // Cancel future pending subscription deliveries
    await dbRepo.updateMany(
      'orders',
      { subscriptionId: sub._id, status: 'Pending' },
      { status: 'Cancelled' }
    );

    await dbRepo.updateById('users', String(sub.userId), { planId: null });
    const plan = await dbRepo.findById('plans', String(sub.planId));

    return res.json({ subscription: { ...updated, plan } });
  } catch (err) {
    console.error('[Cancel Subscription Error]', err);
    return res.status(500).json({ message: 'Failed to cancel subscription.' });
  }
});

export default router;
