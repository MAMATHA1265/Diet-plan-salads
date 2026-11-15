import { Router } from 'express';
import { AuthRequest, authorize, protect } from '../middleware/auth.ts';
import { dbRepo } from '../utils/store.ts';

const router = Router();

// GET /api/salads
router.get('/', async (req, res) => {
  try {
    const { dietaryType, search } = req.query as Record<string, string>;
    let salads = await dbRepo.findAll('salads');

    if (dietaryType && dietaryType !== 'all') {
      salads = salads.filter((s) => s.dietaryType === dietaryType);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      salads = salads.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (Array.isArray(s.tags) && s.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    return res.json({ salads });
  } catch (err) {
    console.error('[Salads List Error]', err);
    return res.status(500).json({ message: 'Failed to load salad menu.' });
  }
});

// GET /api/salads/custom (Member's saved favorite custom salads)
router.get('/custom', protect, async (req: AuthRequest, res) => {
  try {
    const customSalads = await dbRepo.findAll('customSalads', { userId: req.user!._id });
    return res.json({ customSalads });
  } catch (err) {
    console.error('[Custom Salads List Error]', err);
    return res.status(500).json({ message: 'Failed to load saved custom salads.' });
  }
});

// POST /api/salads/custom (Save a favorite custom salad)
router.post('/custom', protect, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      baseId,
      baseName,
      proteinIds = [],
      proteinNames = [],
      toppingIds = [],
      toppingNames = [],
      dressingId,
      dressingName,
      specialInstructions = '',
      totalPrice,
      totalCalories,
      totalProtein = 0,
    } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Please name your custom salad bowl.' });
    }
    if (!baseId || !dressingId) {
      return res.status(400).json({ message: 'Please select a base and a dressing.' });
    }

    const created = await dbRepo.create('customSalads', {
      userId: req.user!._id,
      name: String(name).trim(),
      baseId,
      baseName,
      proteinIds,
      proteinNames,
      toppingIds,
      toppingNames,
      dressingId,
      dressingName,
      specialInstructions: String(specialInstructions).trim(),
      totalPrice: Number(totalPrice),
      totalCalories: Number(totalCalories),
      totalProtein: Number(totalProtein),
    });

    return res.status(201).json({ customSalad: created });
  } catch (err) {
    console.error('[Custom Salad Save Error]', err);
    return res.status(500).json({ message: 'Failed to save custom salad.' });
  }
});

// DELETE /api/salads/custom/:id
router.delete('/custom/:id', protect, async (req: AuthRequest, res) => {
  try {
    const item = await dbRepo.findById('customSalads', req.params.id);
    if (!item || String(item.userId) !== String(req.user!._id)) {
      return res.status(404).json({ message: 'Saved salad not found.' });
    }
    await dbRepo.deleteById('customSalads', req.params.id);
    return res.json({ message: 'Favorite custom salad removed.' });
  } catch (err) {
    console.error('[Custom Salad Delete Error]', err);
    return res.status(500).json({ message: 'Failed to remove saved salad.' });
  }
});

// POST /api/salads (Admin create salad)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      calories,
      protein = 15,
      carbs = 28,
      fats = 16,
      fiber = 8,
      dietaryType = 'veg',
      tags = [],
      ingredientsList = [],
      imageUrl = '/src/assets/images/salad_quinoa_power_1794738480377.jpg',
      isAvailable = true,
      featured = false,
    } = req.body;

    if (!name || !description || price === undefined || calories === undefined) {
      return res
        .status(400)
        .json({ message: 'Name, description, price, and calories are required.' });
    }

    const created = await dbRepo.create('salads', {
      name: String(name).trim(),
      description: String(description).trim(),
      price: Number(price),
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fats: Number(fats),
      fiber: Number(fiber),
      dietaryType,
      tags: Array.isArray(tags) ? tags : [],
      ingredientsList: Array.isArray(ingredientsList) ? ingredientsList : [],
      imageUrl: String(imageUrl).trim() || '/src/assets/images/salad_quinoa_power_1794738480377.jpg',
      isAvailable: Boolean(isAvailable),
      featured: Boolean(featured),
    });

    return res.status(201).json({ salad: created });
  } catch (err) {
    console.error('[Salad Create Error]', err);
    return res.status(500).json({ message: 'Failed to create salad item.' });
  }
});

// PUT /api/salads/:id (Admin update salad)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const updated = await dbRepo.updateById('salads', req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Salad not found.' });
    }
    return res.json({ salad: updated });
  } catch (err) {
    console.error('[Salad Update Error]', err);
    return res.status(500).json({ message: 'Failed to update salad item.' });
  }
});

// DELETE /api/salads/:id (Admin delete salad)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const deleted = await dbRepo.deleteById('salads', req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Salad not found.' });
    }
    return res.json({ message: 'Salad removed from menu.' });
  } catch (err) {
    console.error('[Salad Delete Error]', err);
    return res.status(500).json({ message: 'Failed to delete salad.' });
  }
});

export default router;
