import { Router } from 'express';
import { AuthRequest, authorize, protect } from '../middleware/auth.ts';
import { dbRepo } from '../utils/store.ts';

const router = Router();

const VALID_STATUSES = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

async function getMemberPlanBenefits(userId: string, fallbackPlanId?: string | null) {
  const activeSub = await dbRepo.findOne('subscriptions', { userId, status: 'active' });
  const planId = activeSub?.planId || fallbackPlanId;
  if (!planId) {
    return { discountPercent: 0, freeDelivery: false, planName: null };
  }
  const plan = await dbRepo.findById('plans', String(planId));
  if (!plan) {
    return { discountPercent: 0, freeDelivery: false, planName: null };
  }
  return {
    discountPercent: Number(plan.discountPercent || 0),
    freeDelivery: Boolean(plan.freeDelivery),
    planName: plan.name,
  };
}

// POST /api/orders (Place an order - Member/Admin)
router.post('/', protect, async (req: AuthRequest, res) => {
  try {
    const { items, deliveryAddress, timeSlot, paymentId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }
    if (!deliveryAddress || String(deliveryAddress).trim().length < 5) {
      return res.status(400).json({ message: 'Please provide a valid delivery address.' });
    }
    if (!timeSlot) {
      return res.status(400).json({ message: 'Please select a delivery time slot.' });
    }

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.unitPrice) * Number(item.quantity || 1),
      0
    );

    const benefits = await getMemberPlanBenefits(req.user!._id, req.user!.planId);
    const discountAmount = Math.round(subtotal * (benefits.discountPercent / 100));
    const deliveryFee = benefits.freeDelivery ? 0 : 35;
    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

    const orderNumber = `VB-${Math.floor(1050 + Math.random() * 8949)}`;

    const order = await dbRepo.create('orders', {
      orderNumber,
      userId: req.user!._id,
      items: items.map((i: any) => ({
        saladId: i.saladId || undefined,
        name: String(i.name),
        quantity: Number(i.quantity || 1),
        unitPrice: Number(i.unitPrice),
        calories: Number(i.calories || 0),
        isCustom: Boolean(i.isCustom),
        customDetails: i.customDetails || undefined,
      })),
      subtotal,
      discountPercent: benefits.discountPercent,
      discountAmount,
      deliveryFee,
      totalAmount,
      deliveryAddress: String(deliveryAddress).trim(),
      timeSlot: String(timeSlot),
      status: 'Pending',
      orderType: 'one-time',
      subscriptionId: null,
      scheduledDate: new Date().toISOString(),
      paymentStatus: 'paid',
      paymentId: paymentId || `pay_ord_${Date.now()}`,
    });

    return res.status(201).json({ order });
  } catch (err) {
    console.error('[Orders Create Error]', err);
    return res.status(500).json({ message: 'Failed to place order.' });
  }
});

// GET /api/orders/my (Logged-in member's orders)
router.get('/my', protect, async (req: AuthRequest, res) => {
  try {
    const orders = await dbRepo.findAll('orders', { userId: req.user!._id });
    orders.sort(
      (a, b) => new Date(b.scheduledDate || b.createdAt).getTime() - new Date(a.scheduledDate || a.createdAt).getTime()
    );
    return res.json({ orders });
  } catch (err) {
    console.error('[My Orders Error]', err);
    return res.status(500).json({ message: 'Failed to fetch your orders.' });
  }
});

// GET /api/orders (Admin: view all orders)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status = 'all', orderType = 'all' } = req.query as Record<string, string>;
    let orders = await dbRepo.findAll('orders');
    const users = await dbRepo.findAll('users');
    const userMap = new Map(users.map((u) => [u._id, u]));

    let enriched: Array<Record<string, any>> = orders.map((o) => {
      const customer = userMap.get(String(o.userId));
      return {
        ...o,
        customerName: customer?.name || 'Member',
        customerEmail: customer?.email || '',
        customerPhone: customer?.phone || '',
      };
    });

    if (status !== 'all') {
      enriched = enriched.filter((o) => o.status === status);
    }
    if (orderType !== 'all') {
      enriched = enriched.filter((o) => o.orderType === orderType);
    }

    return res.json({ orders: enriched });
  } catch (err) {
    console.error('[Admin Orders List Error]', err);
    return res.status(500).json({ message: 'Failed to load orders.' });
  }
});

// PATCH /api/orders/:id/status (Admin: update order status)
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }

    const updated = await dbRepo.updateById('orders', req.params.id, { status });
    if (!updated) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    return res.json({ order: updated });
  } catch (err) {
    console.error('[Order Status Update Error]', err);
    return res.status(500).json({ message: 'Failed to update order status.' });
  }
});

export default router;
