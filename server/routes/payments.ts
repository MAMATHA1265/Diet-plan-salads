import crypto from 'crypto';
import { Router } from 'express';
import { AuthRequest, protect } from '../middleware/auth.ts';
import { dbRepo } from '../utils/store.ts';
import { generateDailySubscriptionOrders } from './subscriptions.ts';

const router = Router();

const TEST_CHECKOUT_KEY_ID = 'rzp_test_verdantbowl_demo';
const TEST_CHECKOUT_SECRET = 'verdantbowl_test_checkout_signing_key';

// POST /api/payments/create-order
router.post('/create-order', protect, async (req: AuthRequest, res) => {
  try {
    const { amount, purpose = 'subscription', planId } = req.body;
    let finalAmount = Number(amount);

    if (purpose === 'subscription' && planId) {
      const plan = await dbRepo.findById('plans', String(planId));
      if (!plan) {
        return res.status(404).json({ message: 'Selected plan not found.' });
      }
      finalAmount = Number(plan.monthlyPrice);
    }

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount.' });
    }

    const checkoutOrder = {
      id: `order_test_${crypto.randomBytes(6).toString('hex')}`,
      entity: 'order',
      amount: Math.round(finalAmount * 100),
      amount_paid: 0,
      amount_due: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: `vb_rcpt_${Date.now()}`,
      status: 'created',
      testMode: true,
    };

    await dbRepo.create('payments', {
      userId: req.user!._id,
      amount: finalAmount,
      currency: 'INR',
      purpose,
      referenceId: planId || '',
      razorpayOrderId: checkoutOrder.id,
      razorpayPaymentId: '',
      razorpaySignature: '',
      status: 'created',
    });

    return res.json({
      order: checkoutOrder,
      keyId: TEST_CHECKOUT_KEY_ID,
      testMode: true,
    });
  } catch (err) {
    console.error('[Payment Create Order Error]', err);
    return res.status(500).json({ message: 'Failed to initialize test checkout order.' });
  }
});

// POST /api/payments/verify
router.post('/verify', protect, async (req: AuthRequest, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      purpose = 'subscription',
      planId,
      deliveryAddress,
      timeSlot,
      simulateTestMode = true,
    } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ message: 'Missing checkout order ID.' });
    }

    const paymentId = razorpay_payment_id || `pay_test_${crypto.randomBytes(6).toString('hex')}`;

    let signatureValid = false;
    if (simulateTestMode) {
      signatureValid = true;
    } else if (razorpay_signature) {
      const expected = crypto
        .createHmac('sha256', TEST_CHECKOUT_SECRET)
        .update(`${razorpay_order_id}|${paymentId}`)
        .digest('hex');
      signatureValid = expected === razorpay_signature;
    }

    if (!signatureValid) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    const existingPayment = await dbRepo.findOne('payments', {
      razorpayOrderId: razorpay_order_id,
    });

    if (existingPayment) {
      await dbRepo.updateById('payments', existingPayment._id, {
        razorpayPaymentId: paymentId,
        razorpaySignature: razorpay_signature || 'test_mode_verified',
        status: 'captured',
      });
    }

    let subscription = null;
    let generatedOrdersCount = 0;

    if (purpose === 'subscription' && planId) {
      const plan = await dbRepo.findById('plans', String(planId));
      if (!plan) {
        return res.status(404).json({ message: 'Membership plan not found.' });
      }

      await dbRepo.updateMany(
        'subscriptions',
        { userId: req.user!._id, status: { $in: ['active', 'paused'] } },
        { status: 'cancelled' }
      );

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Number(plan.daysPerMonth));

      const addressToUse =
        (deliveryAddress && String(deliveryAddress).trim()) ||
        req.user!.address ||
        'Default Member Address';

      const createdSub = await dbRepo.create('subscriptions', {
        userId: req.user!._id,
        planId: plan._id,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pausedAt: null,
        deliveryAddress: addressToUse,
        timeSlot: timeSlot || '12:00 PM - 1:00 PM',
        razorpayPaymentId: paymentId,
        razorpayOrderId: razorpay_order_id,
        autoRenew: true,
      });

      await dbRepo.updateById('users', req.user!._id, { planId: plan._id });

      const generated = await generateDailySubscriptionOrders({
        userId: req.user!._id,
        subscriptionId: createdSub._id,
        plan,
        deliveryAddress: addressToUse,
        timeSlot: timeSlot || '12:00 PM - 1:00 PM',
        startDate,
        paymentId,
      });

      subscription = { ...createdSub, plan };
      generatedOrdersCount = generated.length;
    }

    return res.json({
      verified: true,
      paymentId,
      subscription,
      generatedOrdersCount,
    });
  } catch (err) {
    console.error('[Payment Verify Error]', err);
    return res.status(500).json({ message: 'Payment verification failed.' });
  }
});

// GET /api/payments/my
router.get('/my', protect, async (req: AuthRequest, res) => {
  try {
    const payments = await dbRepo.findAll('payments', { userId: req.user!._id });
    return res.json({ payments });
  } catch (err) {
    console.error('[My Payments Error]', err);
    return res.status(500).json({ message: 'Failed to load payment history.' });
  }
});

export default router;
