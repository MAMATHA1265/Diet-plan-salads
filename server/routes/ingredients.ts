import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.ts';
import { dbRepo } from '../utils/store.ts';

const router = Router();

// GET /api/ingredients
router.get('/', async (req, res) => {
  try {
    const { category } = req.query as Record<string, string>;
    let ingredients = await dbRepo.findAll('ingredients');
    if (category && category !== 'all') {
      ingredients = ingredients.filter((i) => i.category === category);
    }
    return res.json({ ingredients });
  } catch (err) {
    console.error('[Ingredients List Error]', err);
    return res.status(500).json({ message: 'Failed to fetch ingredients.' });
  }
});

// POST /api/ingredients (Admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, category, price, calories, protein = 0, dietaryTag = 'vegan', isAvailable = true } =
      req.body;
    if (!name || !category || price === undefined || calories === undefined) {
      return res
        .status(400)
        .json({ message: 'Name, category, price, and calories are required.' });
    }

    const created = await dbRepo.create('ingredients', {
      name: String(name).trim(),
      category,
      price: Number(price),
      calories: Number(calories),
      protein: Number(protein),
      dietaryTag,
      isAvailable: Boolean(isAvailable),
    });

    return res.status(201).json({ ingredient: created });
  } catch (err) {
    console.error('[Ingredient Create Error]', err);
    return res.status(500).json({ message: 'Failed to create ingredient.' });
  }
});

// PUT /api/ingredients/:id (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const updated = await dbRepo.updateById('ingredients', req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Ingredient not found.' });
    }
    return res.json({ ingredient: updated });
  } catch (err) {
    console.error('[Ingredient Update Error]', err);
    return res.status(500).json({ message: 'Failed to update ingredient.' });
  }
});

// DELETE /api/ingredients/:id (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const deleted = await dbRepo.deleteById('ingredients', req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Ingredient not found.' });
    }
    return res.json({ message: 'Ingredient deleted.' });
  } catch (err) {
    console.error('[Ingredient Delete Error]', err);
    return res.status(500).json({ message: 'Failed to delete ingredient.' });
  }
});

export default router;
