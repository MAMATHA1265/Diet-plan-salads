import { Router } from 'express';
import { dbRepo } from '../utils/store.ts';

const router = Router();

// GET /api/plans
router.get('/', async (_req, res) => {
  try {
    const plans = await dbRepo.findAll('plans', { isActive: true });
    plans.sort((a, b) => Number(a.monthlyPrice) - Number(b.monthlyPrice));
    return res.json({ plans });
  } catch (err) {
    console.error('[Plans List Error]', err);
    return res.status(500).json({ message: 'Failed to fetch membership plans.' });
  }
});

// GET /api/plans/:id
router.get('/:id', async (req, res) => {
  try {
    const plan = await dbRepo.findById('plans', req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Membership plan not found.' });
    }
    return res.json({ plan });
  } catch (err) {
    console.error('[Plan Get Error]', err);
    return res.status(500).json({ message: 'Failed to fetch plan.' });
  }
});

export default router;
