import { ArrowRight, Check, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SaladImage from '../components/SaladImage';
import { useCart } from '../context/CartContext';
import { fetchPlans, fetchSalads } from '../services/supabaseData';
import { Plan, Salad } from '../types';

export default function HomePage() {
  const [salads, setSalads] = useState<Salad[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    Promise.all([fetchSalads(), fetchPlans()])
      .then(([saladsList, plansList]) => {
        setSalads(saladsList.slice(0, 3));
        setPlans(plansList);
      })
      .catch(() => {});
  }, []);

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
    setTimeout(() => setAddedId((prev) => (prev === salad._id ? null : prev)), 1400);
  };

  return (
    <div>
      {/* Hero Split */}
      <section className="max-w-[1280px] mx-auto px-6 pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-4 lg:pr-6">
            <p className="text-xs font-medium text-[#166534] tracking-wide mb-3">
              Fresh Daily Kitchen · Macro-Calibrated Bowls
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#1A241E] leading-[1.12] text-balance">
              Clean, measured nutrition delivered to your table every day.
            </h1>
            <p className="mt-5 text-base text-[#526056] leading-relaxed max-w-xl">
              Chef-crafted diet salads built with crisp hydroponic greens, clean proteins, and
              cold-pressed dressings. Order on demand or subscribe to a flexible monthly meal plan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="px-6 py-3 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>Explore Salad Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/builder"
                className="px-5 py-3 bg-white border border-[#DDE4DA] hover:border-[#166534] text-[#1A241E] text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Build Custom Bowl
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] lg:min-h-[440px] rounded-xl overflow-hidden border border-[#DDE4DA] bg-[#EDF2EA]">
              <SaladImage
                src="/src/assets/images/hero_salad_editorial_1794738480041.jpg"
                alt="Fresh green diet salad bowl with avocado, quinoa, and roasted chickpeas"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 4-Column Metric Strip */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 border border-[#DDE4DA] bg-white rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-[#E8EDE5]">
          <div className="p-5">
            <p className="text-xs text-[#647469]">Calorie Range</p>
            <p className="font-mono tabular-nums text-lg font-semibold text-[#1A241E] mt-1">
              360 – 490 kcal
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-[#647469]">Harvest Window</p>
            <p className="font-mono tabular-nums text-lg font-semibold text-[#1A241E] mt-1">
              Under 18 Hours
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-[#647469]">Member Savings</p>
            <p className="font-mono tabular-nums text-lg font-semibold text-[#1A241E] mt-1">
              10% – 25% Off
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-[#647469]">Monthly Cadence</p>
            <p className="font-mono tabular-nums text-lg font-semibold text-[#1A241E] mt-1">
              20 or 26 Days
            </p>
          </div>
        </div>
      </section>

      {/* Featured Signature Bowls */}
      <section className="max-w-[1280px] mx-auto px-6 py-12 border-t border-[#E8EDE5]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-blue-700">
              Featured Signature Bowls
            </h2>
            <p className="text-sm text-[#526056] mt-1.5">
              Balanced macronutrients prepared fresh each morning without refined oils.
            </p>
          </div>
          <Link
            to="/menu"
            className="text-sm font-medium text-[#166534] hover:underline whitespace-nowrap"
          >
            View full menu →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {salads.map((salad) => (
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
                <h3 className="text-base font-semibold text-[#1A241E] mt-2">{salad.name}</h3>
                <p className="text-sm text-[#526056] mt-1.5 line-clamp-2 flex-1">
                  {salad.description}
                </p>
                <div className="mt-5 pt-4 border-t border-[#E8EDE5] flex items-center justify-between gap-4">
                  <span className="font-mono tabular-nums text-base font-semibold text-[#1A241E]">
                    ₹{salad.price}
                  </span>
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
      </section>

      {/* Membership Plans Overview */}
      <section className="max-w-[1280px] mx-auto px-6 py-12 border-t border-[#E8EDE5]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-blue-700">
              Monthly Nutrition Memberships
            </h2>
            <p className="text-sm text-[#526056] mt-1.5">
              Automated daily deliveries with member discounts on every custom or extra bowl.
            </p>
          </div>
          <Link
            to="/plans"
            className="text-sm font-medium text-[#166534] hover:underline whitespace-nowrap"
          >
            Compare plans &amp; subscribe →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`bg-white rounded-xl p-6 flex flex-col border ${
                plan.slug === 'premium' ? 'border-[#166534]' : 'border-[#DDE4DA]'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-xl font-semibold text-[#1A241E]">{plan.name}</h3>
                <span className="text-xs font-mono text-[#166534]">
                  {plan.discountPercent}% Member Off
                </span>
              </div>
              <p className="text-sm text-[#526056] mt-1.5">{plan.tagline}</p>

              <div className="mt-5 pb-5 border-b border-[#E8EDE5] flex items-baseline gap-1">
                <span className="font-mono tabular-nums text-3xl font-semibold text-[#1A241E]">
                  ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#647469]">/ month</span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-[#35473B] flex-1">
                <p className="font-mono tabular-nums text-xs text-[#1A241E]">
                  {plan.saladsPerDay} {plan.saladsPerDay === 1 ? 'salad' : 'salads'}/day ·{' '}
                  {plan.daysPerMonth} days/month
                  {plan.freeDelivery ? ' · Free delivery' : ''}
                </p>
                <ul className="space-y-2 pt-2">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-[#526056]">
                      <Check className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={`/plans?selected=${plan.slug}`}
                className={`mt-6 w-full py-2.5 px-4 rounded-lg text-sm font-medium text-center transition-colors ${
                  plan.slug === 'premium'
                    ? 'bg-[#166534] hover:bg-[#14532D] text-white'
                    : 'bg-[#F4F7F2] hover:bg-[#E7ECE4] text-[#1A241E]'
                }`}
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
