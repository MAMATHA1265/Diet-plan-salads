import { Bookmark, Check, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  fetchCustomSalads,
  fetchIngredients,
  removeCustomSalad,
  saveCustomSalad,
} from '../services/supabaseData';
import { CustomSalad, Ingredient } from '../types';

export default function SaladBuilderPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [savedSalads, setSavedSalads] = useState<CustomSalad[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBaseId, setSelectedBaseId] = useState<string>('');
  const [selectedProteinIds, setSelectedProteinIds] = useState<string[]>([]);
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
  const [selectedDressingId, setSelectedDressingId] = useState<string>('');
  const [bowlName, setBowlName] = useState('My Custom Diet Bowl');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchIngredients()
      .then((all) => {
        const list = all.filter((i) => i.isAvailable !== false);
        setIngredients(list);

        const firstBase = list.find((i) => i.category === 'base');
        const firstDressing = list.find((i) => i.category === 'dressing');
        if (firstBase) setSelectedBaseId(firstBase._id);
        if (firstDressing) setSelectedDressingId(firstDressing._id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      fetchCustomSalads(user._id)
        .then((list) => setSavedSalads(list))
        .catch(() => {});
    }
  }, [user]);

  const bases = ingredients.filter((i) => i.category === 'base');
  const proteins = ingredients.filter((i) => i.category === 'protein');
  const toppings = ingredients.filter((i) => i.category === 'topping');
  const dressings = ingredients.filter((i) => i.category === 'dressing');

  const selectedBase = bases.find((b) => b._id === selectedBaseId) || null;
  const selectedProteins = proteins.filter((p) => selectedProteinIds.includes(p._id));
  const selectedToppings = toppings.filter((t) => selectedToppingIds.includes(t._id));
  const selectedDressing = dressings.find((d) => d._id === selectedDressingId) || null;

  const chosenList = [
    ...(selectedBase ? [selectedBase] : []),
    ...selectedProteins,
    ...selectedToppings,
    ...(selectedDressing ? [selectedDressing] : []),
  ];

  const totalPrice = chosenList.reduce((sum, item) => sum + Number(item.price), 0);
  const totalCalories = chosenList.reduce((sum, item) => sum + Number(item.calories), 0);
  const totalProtein = chosenList.reduce((sum, item) => sum + Number(item.protein || 0), 0);

  const toggleMulti = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleAddToCart = () => {
    setErrorMessage('');
    if (!selectedBase || !selectedDressing) {
      setErrorMessage('Please select at least 1 base and 1 dressing.');
      return;
    }

    const uniqueKey = `custom_${Date.now()}`;
    addItem({
      id: uniqueKey,
      name: bowlName.trim() || 'Custom Diet Salad',
      unitPrice: totalPrice,
      calories: totalCalories,
      isCustom: true,
      customDetails: {
        base: selectedBase.name,
        proteins: selectedProteins.map((p) => p.name),
        toppings: selectedToppings.map((t) => t.name),
        dressing: selectedDressing.name,
        specialInstructions: specialInstructions.trim(),
      },
    });
    setStatusMessage('Custom bowl added to your cart.');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleSaveFavorite = async () => {
    setErrorMessage('');
    setStatusMessage('');
    if (!user) {
      navigate('/login?redirect=/builder');
      return;
    }
    if (!selectedBase || !selectedDressing) {
      setErrorMessage('Please pick a base and dressing before saving.');
      return;
    }
    if (bowlName.trim().length < 2) {
      setErrorMessage('Please give your custom salad a name.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveCustomSalad(user._id, {
        name: bowlName.trim(),
        baseId: selectedBase._id,
        baseName: selectedBase.name,
        proteinIds: selectedProteins.map((p) => p._id),
        proteinNames: selectedProteins.map((p) => p.name),
        toppingIds: selectedToppings.map((t) => t._id),
        toppingNames: selectedToppings.map((t) => t.name),
        dressingId: selectedDressing._id,
        dressingName: selectedDressing.name,
        specialInstructions: specialInstructions.trim(),
        totalPrice,
        totalCalories,
        totalProtein,
      });
      setSavedSalads((prev) => [saved, ...prev]);
      setStatusMessage('Saved to your favorite custom salads.');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to save favorite salad.');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadFavorite = (fav: CustomSalad) => {
    setBowlName(fav.name);
    setSelectedBaseId(fav.baseId);
    setSelectedProteinIds(fav.proteinIds || []);
    setSelectedToppingIds(fav.toppingIds || []);
    setSelectedDressingId(fav.dressingId);
    setSpecialInstructions(fav.specialInstructions || '');
    setStatusMessage(`Loaded "${fav.name}" into builder.`);
  };

  const handleAddFavoriteToCart = (fav: CustomSalad) => {
    addItem({
      id: `custom_fav_${fav._id}_${Date.now()}`,
      name: fav.name,
      unitPrice: fav.totalPrice,
      calories: fav.totalCalories,
      isCustom: true,
      customDetails: {
        base: fav.baseName,
        proteins: fav.proteinNames,
        toppings: fav.toppingNames,
        dressing: fav.dressingName,
        specialInstructions: fav.specialInstructions,
      },
    });
    setStatusMessage(`"${fav.name}" added to cart.`);
  };

  const handleDeleteFavorite = async (id: string) => {
    try {
      await removeCustomSalad(id);
      setSavedSalads((prev) => prev.filter((s) => s._id !== id));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="text-sm text-[#526056]">Loading ingredients...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="pb-8 border-b border-[#DDE4DA]">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1A241E]">
          Custom Salad Builder
        </h1>
        <p className="text-sm text-[#526056] mt-2">
          Pick your base, proteins, fresh toppings, and cold-pressed dressing with live calorie and
          price calculation.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Selection Steps */}
        <div className="lg:col-span-8 space-y-10">
          {/* 1. Pick Base */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1A241E]">01. Pick a Base</h2>
              <span className="text-xs text-[#647469]">Select 1</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bases.map((item) => {
                const active = selectedBaseId === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedBaseId(item._id)}
                    className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      active
                        ? 'bg-[#EDF5EE] border-[#166534]'
                        : 'bg-white border-[#DDE4DA] hover:border-[#8AA392]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A241E]">{item.name}</p>
                      <p className="text-xs font-mono tabular-nums text-[#647469] mt-0.5">
                        {item.calories} kcal · {item.protein}g protein
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-sm font-semibold text-[#1A241E]">
                      ₹{item.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Pick Proteins */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1A241E]">02. Pick Proteins</h2>
              <span className="text-xs text-[#647469]">Select one or more</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {proteins.map((item) => {
                const active = selectedProteinIds.includes(item._id);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => toggleMulti(item._id, selectedProteinIds, setSelectedProteinIds)}
                    className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      active
                        ? 'bg-[#EDF5EE] border-[#166534]'
                        : 'bg-white border-[#DDE4DA] hover:border-[#8AA392]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A241E]">{item.name}</p>
                      <p className="text-xs font-mono tabular-nums text-[#647469] mt-0.5">
                        {item.calories} kcal · {item.protein}g protein · {item.dietaryTag}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-sm font-semibold text-[#1A241E]">
                        +₹{item.price}
                      </span>
                      {active && <Check className="w-4 h-4 text-[#166534]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Pick Toppings */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1A241E]">03. Pick Toppings</h2>
              <span className="text-xs text-[#647469]">Select any</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {toppings.map((item) => {
                const active = selectedToppingIds.includes(item._id);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => toggleMulti(item._id, selectedToppingIds, setSelectedToppingIds)}
                    className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      active
                        ? 'bg-[#EDF5EE] border-[#166534]'
                        : 'bg-white border-[#DDE4DA] hover:border-[#8AA392]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A241E]">{item.name}</p>
                      <p className="text-xs font-mono tabular-nums text-[#647469] mt-0.5">
                        {item.calories} kcal
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-sm font-semibold text-[#1A241E]">
                        +₹{item.price}
                      </span>
                      {active && <Check className="w-4 h-4 text-[#166534]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Pick Dressing */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1A241E]">04. Pick a Dressing</h2>
              <span className="text-xs text-[#647469]">Select 1</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dressings.map((item) => {
                const active = selectedDressingId === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedDressingId(item._id)}
                    className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      active
                        ? 'bg-[#EDF5EE] border-[#166534]'
                        : 'bg-white border-[#DDE4DA] hover:border-[#8AA392]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A241E]">{item.name}</p>
                      <p className="text-xs font-mono tabular-nums text-[#647469] mt-0.5">
                        {item.calories} kcal · {item.dietaryTag}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-sm font-semibold text-[#1A241E]">
                      +₹{item.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Special Instructions */}
          <section>
            <h2 className="text-lg font-semibold text-[#1A241E] mb-3">05. Special Instructions</h2>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. No onion, extra lemon, dressing packed separately"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DDE4DA] rounded-xl focus:outline-none focus:border-[#166534]"
            />
          </section>
        </div>

        {/* Right Sticky Summary & Nutrition Calculator */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white border border-[#DDE4DA] rounded-xl p-6">
            <h2 className="font-display text-xl font-semibold text-[#1A241E]">
              Live Bowl Summary
            </h2>

            <div className="mt-4">
              <label className="block text-xs font-medium text-[#526056] mb-1">
                Bowl Name
              </label>
              <input
                type="text"
                value={bowlName}
                onChange={(e) => setBowlName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>

            {/* Live Calorie & Price Readout */}
            <div className="mt-5 grid grid-cols-3 gap-2 py-4 border-y border-[#E8EDE5]">
              <div>
                <p className="text-[11px] text-[#647469]">Calories</p>
                <p className="font-mono tabular-nums text-lg font-semibold text-[#1A241E]">
                  {totalCalories}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#647469]">Protein</p>
                <p className="font-mono tabular-nums text-lg font-semibold text-[#1A241E]">
                  {totalProtein}g
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#647469]">Price</p>
                <p className="font-mono tabular-nums text-lg font-semibold text-[#166534]">
                  ₹{totalPrice}
                </p>
              </div>
            </div>

            {/* Ingredient Breakdown */}
            <div className="mt-4 space-y-2 text-xs text-[#526056]">
              <div>
                <span className="font-medium text-[#1A241E]">Base: </span>
                <span>{selectedBase?.name || 'None'}</span>
              </div>
              <div>
                <span className="font-medium text-[#1A241E]">Proteins: </span>
                <span>
                  {selectedProteins.length > 0
                    ? selectedProteins.map((p) => p.name).join(', ')
                    : 'None'}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#1A241E]">Toppings: </span>
                <span>
                  {selectedToppings.length > 0
                    ? selectedToppings.map((t) => t.name).join(', ')
                    : 'None'}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#1A241E]">Dressing: </span>
                <span>{selectedDressing?.name || 'None'}</span>
              </div>
              {specialInstructions.trim() && (
                <div>
                  <span className="font-medium text-[#1A241E]">Notes: </span>
                  <span>{specialInstructions}</span>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            {statusMessage && (
              <div className="mt-4 p-3 bg-[#EDF5EE] border border-[#BBF7D0] text-[#166534] text-xs rounded-lg">
                {statusMessage}
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-2.5 px-4 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add Bowl to Cart · ₹{totalPrice}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveFavorite}
                disabled={saving}
                className="w-full py-2.5 px-4 bg-[#F4F7F2] hover:bg-[#E7ECE4] text-[#1A241E] text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                <Bookmark className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Favorite Salad'}</span>
              </button>
            </div>
          </div>

          {/* Saved Favorites List */}
          {user && (
            <div className="bg-white border border-[#DDE4DA] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#1A241E]">Saved Favorite Bowls</h3>
              {savedSalads.length === 0 ? (
                <p className="text-xs text-[#647469] mt-2">
                  No saved custom bowls yet. Build one above and click Save Favorite Salad.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-[#E8EDE5]">
                  {savedSalads.map((fav) => (
                    <li key={fav._id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-[#1A241E]">{fav.name}</p>
                          <p className="text-xs font-mono tabular-nums text-[#647469]">
                            {fav.totalCalories} kcal · ₹{fav.totalPrice}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLoadFavorite(fav)}
                            className="px-2 py-1 text-xs text-[#35473B] hover:bg-[#F4F7F2] rounded cursor-pointer"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddFavoriteToCart(fav)}
                            title="Add to cart"
                            className="p-1.5 text-[#166534] hover:bg-[#EDF5EE] rounded cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFavorite(fav._id)}
                            title="Remove favorite"
                            className="p-1.5 text-[#647469] hover:text-[#DC2626] rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
