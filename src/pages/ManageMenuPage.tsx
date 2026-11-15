import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import SaladImage from '../components/SaladImage';
import api from '../services/api';
import { Ingredient, Salad } from '../types';

const SAMPLE_IMAGE_CHOICES = [
  {
    label: 'Quinoa Crunch',
    url: '/src/assets/images/salad_quinoa_power_1794738480377.jpg',
  },
  {
    label: 'Grilled Protein',
    url: '/src/assets/images/salad_grilled_protein_1794738481019.jpg',
  },
  {
    label: 'Crispy Tofu',
    url: '/src/assets/images/salad_vegan_tofu_1794738481127.jpg',
  },
  {
    label: 'Herb Paneer',
    url: '/src/assets/images/salad_paneer_spinach_1794738480788.jpg',
  },
  {
    label: 'Citrus Harvest',
    url: '/src/assets/images/salad_mediterranean_olive_1794738481305.jpg',
  },
];

export default function ManageMenuPage() {
  const [tab, setTab] = useState<'salads' | 'ingredients'>('salads');
  const [salads, setSalads] = useState<Salad[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Salad Form State
  const [editingSaladId, setEditingSaladId] = useState<string | null>(null);
  const [saladName, setSaladName] = useState('');
  const [saladDesc, setSaladDesc] = useState('');
  const [saladPrice, setSaladPrice] = useState('299');
  const [saladCalories, setSaladCalories] = useState('410');
  const [saladProtein, setSaladProtein] = useState('20');
  const [saladDiet, setSaladDiet] = useState<'veg' | 'vegan' | 'high-protein'>('vegan');
  const [saladImage, setSaladImage] = useState(SAMPLE_IMAGE_CHOICES[0].url);

  // Ingredient Form State
  const [editingIngId, setEditingIngId] = useState<string | null>(null);
  const [ingName, setIngName] = useState('');
  const [ingCat, setIngCat] = useState<'base' | 'protein' | 'topping' | 'dressing'>('topping');
  const [ingPrice, setIngPrice] = useState('45');
  const [ingCalories, setIngCalories] = useState('60');
  const [ingProtein, setIngProtein] = useState('2');
  const [ingDiet, setIngDiet] = useState<'vegan' | 'veg' | 'non-veg'>('vegan');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, iRes] = await Promise.all([api.get('/salads'), api.get('/ingredients')]);
      setSalads(sRes.data.salads || []);
      setIngredients(iRes.data.ingredients || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetSaladForm = () => {
    setEditingSaladId(null);
    setSaladName('');
    setSaladDesc('');
    setSaladPrice('299');
    setSaladCalories('410');
    setSaladProtein('20');
    setSaladDiet('vegan');
    setSaladImage(SAMPLE_IMAGE_CHOICES[0].url);
  };

  const handleSaveSalad = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: saladName.trim(),
      description: saladDesc.trim(),
      price: Number(saladPrice),
      calories: Number(saladCalories),
      protein: Number(saladProtein),
      dietaryType: saladDiet,
      imageUrl: saladImage,
      isAvailable: true,
    };

    if (editingSaladId) {
      await api.put(`/salads/${editingSaladId}`, payload);
    } else {
      await api.post('/salads', payload);
    }
    resetSaladForm();
    await loadData();
  };

  const handleEditSalad = (s: Salad) => {
    setEditingSaladId(s._id);
    setSaladName(s.name);
    setSaladDesc(s.description);
    setSaladPrice(String(s.price));
    setSaladCalories(String(s.calories));
    setSaladProtein(String(s.protein));
    setSaladDiet(s.dietaryType);
    setSaladImage(s.imageUrl);
  };

  const handleDeleteSalad = async (id: string) => {
    await api.delete(`/salads/${id}`);
    await loadData();
  };

  const resetIngForm = () => {
    setEditingIngId(null);
    setIngName('');
    setIngCat('topping');
    setIngPrice('45');
    setIngCalories('60');
    setIngProtein('2');
    setIngDiet('vegan');
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: ingName.trim(),
      category: ingCat,
      price: Number(ingPrice),
      calories: Number(ingCalories),
      protein: Number(ingProtein),
      dietaryTag: ingDiet,
      isAvailable: true,
    };

    if (editingIngId) {
      await api.put(`/ingredients/${editingIngId}`, payload);
    } else {
      await api.post('/ingredients', payload);
    }
    resetIngForm();
    await loadData();
  };

  const handleEditIngredient = (i: Ingredient) => {
    setEditingIngId(i._id);
    setIngName(i.name);
    setIngCat(i.category);
    setIngPrice(String(i.price));
    setIngCalories(String(i.calories));
    setIngProtein(String(i.protein));
    setIngDiet(i.dietaryTag);
  };

  const handleDeleteIngredient = async (id: string) => {
    await api.delete(`/ingredients/${id}`);
    await loadData();
  };

  return (
    <DashboardLayout title="Manage Menu & Ingredients" breadcrumb="Admin Console / Menu">
      <div className="mb-6 flex items-center gap-1 p-1 bg-[#EFF3EC] rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab('salads')}
          className={`px-4 py-2 text-xs font-medium rounded-md cursor-pointer ${
            tab === 'salads' ? 'bg-white text-[#1A241E] shadow-sm' : 'text-[#526056]'
          }`}
        >
          Signature Salads ({salads.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('ingredients')}
          className={`px-4 py-2 text-xs font-medium rounded-md cursor-pointer ${
            tab === 'ingredients' ? 'bg-white text-[#1A241E] shadow-sm' : 'text-[#526056]'
          }`}
        >
          Builder Ingredients ({ingredients.length})
        </button>
      </div>

      {tab === 'salads' ? (
        <div className="space-y-8">
          {/* Salad Form */}
          <form
            onSubmit={handleSaveSalad}
            className="bg-white border border-[#DDE4DA] rounded-xl p-6 space-y-4"
          >
            <h2 className="text-base font-semibold text-[#1A241E]">
              {editingSaladId ? 'Edit Signature Salad' : 'Add Signature Salad'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#35473B] mb-1">Salad Name</label>
                <input
                  type="text"
                  required
                  value={saladName}
                  onChange={(e) => setSaladName(e.target.value)}
                  placeholder="Harvest Avocado Power Bowl"
                  className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">Price (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={saladPrice}
                  onChange={(e) => setSaladPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">Calories</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={saladCalories}
                  onChange={(e) => setSaladCalories(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">Protein (g)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={saladProtein}
                  onChange={(e) => setSaladProtein(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">
                  Dietary Type
                </label>
                <select
                  value={saladDiet}
                  onChange={(e) => setSaladDiet(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg"
                >
                  <option value="vegan">Vegan</option>
                  <option value="veg">Vegetarian</option>
                  <option value="high-protein">High Protein</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#35473B] mb-1">Photo Preset</label>
                <select
                  value={saladImage}
                  onChange={(e) => setSaladImage(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg"
                >
                  {SAMPLE_IMAGE_CHOICES.map((img) => (
                    <option key={img.url} value={img.url}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-[#35473B] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={saladDesc}
                  onChange={(e) => setSaladDesc(e.target.value)}
                  placeholder="Crisp greens, roasted protein, toasted seeds, and cold-pressed dressing."
                  className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {editingSaladId && (
                <button
                  type="button"
                  onClick={resetSaladForm}
                  className="px-4 py-2 text-xs font-medium bg-[#F4F7F2] rounded-lg cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-[#166534] text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingSaladId ? 'Update Salad' : 'Add Salad'}</span>
              </button>
            </div>
          </form>

          {/* Salads Table */}
          <div className="bg-white border border-[#DDE4DA] rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-6 text-sm text-[#526056]">Loading menu...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EDE5] text-xs text-[#647469] bg-[#FAFBF8]">
                      <th className="py-3 px-4 font-medium">Salad</th>
                      <th className="py-3 px-4 font-medium">Type</th>
                      <th className="py-3 px-4 font-medium text-right">Calories</th>
                      <th className="py-3 px-4 font-medium text-right">Price</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EDE5]">
                    {salads.map((s) => (
                      <tr key={s._id} className="hover:bg-[#FAFBF8]">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-12 h-9 rounded overflow-hidden shrink-0 bg-[#F2F5EF]">
                            <SaladImage
                              src={s.imageUrl}
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-[#1A241E]">{s.name}</p>
                            <p className="text-xs text-[#647469] line-clamp-1 max-w-md">
                              {s.description}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs capitalize text-[#526056]">
                          {s.dietaryType}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-right text-xs text-[#526056]">
                          {s.calories} kcal
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-right font-medium text-[#1A241E]">
                          ₹{s.price}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditSalad(s)}
                              aria-label="Edit salad"
                              className="p-1.5 text-[#526056] hover:text-[#166534] rounded cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSalad(s._id)}
                              aria-label="Delete salad"
                              className="p-1.5 text-[#526056] hover:text-[#DC2626] rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Ingredient Form */}
          <form
            onSubmit={handleSaveIngredient}
            className="bg-white border border-[#DDE4DA] rounded-xl p-6 space-y-4"
          >
            <h2 className="text-base font-semibold text-[#1A241E]">
              {editingIngId ? 'Edit Builder Ingredient' : 'Add Builder Ingredient'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#35473B] mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  placeholder="Roasted Sunflower Seeds"
                  className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">Category</label>
                <select
                  value={ingCat}
                  onChange={(e) => setIngCat(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg"
                >
                  <option value="base">Base</option>
                  <option value="protein">Protein</option>
                  <option value="topping">Topping</option>
                  <option value="dressing">Dressing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">Price (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={ingPrice}
                  onChange={(e) => setIngPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">Calories</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={ingCalories}
                  onChange={(e) => setIngCalories(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">Dietary</label>
                <select
                  value={ingDiet}
                  onChange={(e) => setIngDiet(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg"
                >
                  <option value="vegan">Vegan</option>
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {editingIngId && (
                <button
                  type="button"
                  onClick={resetIngForm}
                  className="px-4 py-2 text-xs font-medium bg-[#F4F7F2] rounded-lg cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-[#166534] text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingIngId ? 'Update Ingredient' : 'Add Ingredient'}</span>
              </button>
            </div>
          </form>

          {/* Ingredients Table */}
          <div className="bg-white border border-[#DDE4DA] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E8EDE5] text-xs text-[#647469] bg-[#FAFBF8]">
                    <th className="py-3 px-4 font-medium">Ingredient</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Dietary</th>
                    <th className="py-3 px-4 font-medium text-right">Calories</th>
                    <th className="py-3 px-4 font-medium text-right">Price</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDE5]">
                  {ingredients.map((ing) => (
                    <tr key={ing._id} className="hover:bg-[#FAFBF8]">
                      <td className="py-3 px-4 font-medium text-[#1A241E]">{ing.name}</td>
                      <td className="py-3 px-4 text-xs capitalize text-[#526056]">
                        {ing.category}
                      </td>
                      <td className="py-3 px-4 text-xs capitalize text-[#526056]">
                        {ing.dietaryTag}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right text-xs text-[#526056]">
                        {ing.calories} kcal
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right font-medium text-[#1A241E]">
                        ₹{ing.price}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditIngredient(ing)}
                            aria-label="Edit ingredient"
                            className="p-1.5 text-[#526056] hover:text-[#166534] rounded cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIngredient(ing._id)}
                            aria-label="Delete ingredient"
                            className="p-1.5 text-[#526056] hover:text-[#DC2626] rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
