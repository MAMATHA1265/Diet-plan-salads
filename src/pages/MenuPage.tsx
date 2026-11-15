import { Check, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SaladImage from '../components/SaladImage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { fetchSalads } from '../services/supabaseData';
import { Salad } from '../types';

const DIETARY_FILTERS = [
  { key: 'all', label: 'All Bowls' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'veg', label: 'Vegetarian' },
  { key: 'high-protein', label: 'High Protein' },
];

export default function MenuPage() {
  const [salads, setSalads] = useState<Salad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    fetchSalads()
      .then((list) => {
        setSalads(list.filter((s) => s.isAvailable !== false));
        setError('');
      })
      .catch(() => setError('Unable to load salad menu right now.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = salads.filter((s) => {
    const matchesDiet = filter === 'all' || s.dietaryType === filter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.ingredientsList.some((i) => i.toLowerCase().includes(q));
    return matchesDiet && matchesSearch;
  });

  const handleAdd = (salad: Salad) => {
    addItem({
      id: `salad_${salad._id}`,
      saladId: salad._id,
      name: salad.name,
      unitPrice: salad.price,
      calories: salad.calories,
      imageUrl: salad.imageUrl,
    });
    setAddedId(salad._id);
    setTimeout(() => setAddedId((prev) => (prev === salad._id ? null : prev)), 1300);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#DDE4DA]">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1A241E]">
            Signature Diet Salads
          </h1>
          <p className="text-sm text-[#526056] mt-2 max-w-2xl">
            Every bowl displays verified calories and protein per serving.
            {user?.plan
              ? ` Your ${user.plan.name} membership applies ${user.plan.discountPercent}% off at checkout.`
              : ''}
          </p>
        </div>

        <Link
          to="/builder"
          className="px-4 py-2.5 bg-[#F4F7F2] hover:bg-[#E7ECE4] border border-[#DDE4DA] text-sm font-medium text-[#1A241E] rounded-lg whitespace-nowrap self-start md:self-auto"
        >
          Or Build Custom Salad →
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#EFF3EC] rounded-lg overflow-x-auto">
          {DIETARY_FILTERS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                filter === tab.key
                  ? 'bg-white text-[#1A241E] shadow-sm'
                  : 'text-[#526056] hover:text-[#1A241E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#647469] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bowls or ingredients..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
          />
        </div>
      </div>

      {/* Content States */}
      {loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-7">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 bg-white border border-[#DDE4DA] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 p-6 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] rounded-xl text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 p-12 bg-white border border-[#DDE4DA] rounded-xl text-center">
          <p className="text-base font-medium text-[#1A241E]">No salads match your current filter</p>
          <p className="text-sm text-[#526056] mt-1">
            Try clearing your search query or switching dietary categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setSearch('');
            }}
            className="mt-4 px-4 py-2 text-xs font-medium bg-[#166534] text-white rounded-lg cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {filtered.map((salad) => (
            <article
              key={salad._id}
              className="bg-white border border-[#DDE4DA] rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] bg-[#F2F5EF] overflow-hidden">
                <SaladImage
                  src={salad.imageUrl}
                  alt={salad.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-xs text-[#647469] font-mono tabular-nums">
                  <span className="capitalize">{salad.dietaryType.replace('-', ' ')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{salad.calories} kcal</span>
                  <span aria-hidden="true">·</span>
                  <span>{salad.protein}g protein</span>
                </div>

                <h2 className="text-base font-semibold text-[#1A241E] mt-2">{salad.name}</h2>
                <p className="text-sm text-[#526056] mt-1.5 flex-1">{salad.description}</p>

                <p className="mt-3 text-xs text-[#647469]">
                  {salad.ingredientsList.slice(0, 5).join(' · ')}
                </p>

                <div className="mt-5 pt-4 border-t border-[#E8EDE5] flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono tabular-nums text-base font-semibold text-[#1A241E]">
                      ₹{salad.price}
                    </span>
                    <span className="text-xs text-[#647469] ml-2 font-mono tabular-nums">
                      C:{salad.carbs}g F:{salad.fats}g
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(salad)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      addedId === salad._id
                        ? 'bg-[#EDF5EE] text-[#166534]'
                        : 'bg-[#166534] hover:bg-[#14532D] text-white'
                    }`}
                  >
                    {addedId === salad._id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
