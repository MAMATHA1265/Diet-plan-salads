import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, authorize, getJwtSecret, protect } from '../middleware/auth.ts';
import { dbRepo } from '../utils/store.ts';

const router = Router();

function extractOptionalUserId(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string };
    return decoded.id || null;
  } catch {
    return null;
  }
}

// POST /api/appointments (Public or Authenticated)
router.post('/', async (req, res) => {
  try {
    const { memberName, memberEmail, phone, goal, appointmentDate, timeSlot, notes = '' } =
      req.body;

    if (!memberName || String(memberName).trim().length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    }
    if (!memberEmail || !/^\S+@\S+\.\S+$/.test(String(memberEmail))) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }
    if (!phone || String(phone).trim().length < 8) {
      return res.status(400).json({ message: 'Please provide a valid phone number.' });
    }
    if (!appointmentDate) {
      return res.status(400).json({ message: 'Please choose an appointment date.' });
    }
    if (!timeSlot) {
      return res.status(400).json({ message: 'Please select a time slot.' });
    }

    const userId = extractOptionalUserId(req.headers.authorization);

    const created = await dbRepo.create('appointments', {
      userId,
      memberName: String(memberName).trim(),
      memberEmail: String(memberEmail).trim().toLowerCase(),
      phone: String(phone).trim(),
      goal: goal ? String(goal).trim() : 'Balanced Nutrition',
      appointmentDate: String(appointmentDate),
      timeSlot: String(timeSlot),
      notes: String(notes).trim(),
      status: 'Scheduled',
    });

    return res.status(201).json({ appointment: created });
  } catch (err) {
    console.error('[Appointments Create Error]', err);
    return res.status(500).json({ message: 'Failed to book appointment.' });
  }
});

// GET /api/appointments/my
router.get('/my', protect, async (req: AuthRequest, res) => {
  try {
    const all = await dbRepo.findAll('appointments');
    const mine = all.filter(
      (a) =>
        String(a.userId) === String(req.user!._id) ||
        String(a.memberEmail).toLowerCase() === String(req.user!.email).toLowerCase()
    );
    return res.json({ appointments: mine });
  } catch (err) {
    console.error('[My Appointments Error]', err);
    return res.status(500).json({ message: 'Failed to load appointments.' });
  }
});

// GET /api/appointments (Admin: list all appointments)
router.get('/', protect, authorize('admin'), async (_req, res) => {
  try {
    const appointments = await dbRepo.findAll('appointments');
    return res.json({ appointments });
  } catch (err) {
    console.error('[Admin Appointments Error]', err);
    return res.status(500).json({ message: 'Failed to load appointments.' });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid appointment status.' });
    }
    const updated = await dbRepo.updateById('appointments', req.params.id, { status });
    if (!updated) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    return res.json({ appointment: updated });
  } catch (err) {
    console.error('[Appointment Status Error]', err);
    return res.status(500).json({ message: 'Failed to update appointment.' });
  }
});

export default router;
