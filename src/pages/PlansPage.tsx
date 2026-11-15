import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RazorpayModal from '../components/RazorpayModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { fetchPlans } from '../services/supabaseData';
import { Plan } from '../types';

const TIME_SLOTS = ['8:00 AM - 9:00 AM', '12:00 PM - 1:00 PM', '7:00 PM - 8:00 PM'];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [address, setAddress] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [error, setError] = useState('');
  const [razorpayOrder, setRazorpayOrder] = useState<{
    orderId: string;
    keyId: string;
    plan: Plan;
  } | null>(null);
  const [startingPayment, setStartingPayment] = useState(false);

  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans()
      .then((list) => {
        setPlans(list);
        const paramSlug = searchParams.get('selected');
        if (paramSlug) {
          const matched = list.find((p) => p.slug === paramSlug);
          if (matched) setSelectedPlan(matched);
        }
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (user?.address && !address) {
      setAddress(user.address);
    }
  }, [user, address]);

  const handleSubscribeClick = async (plan: Plan) => {
    setError('');
    if (!user) {
      navigate(`/login?redirect=/plans?selected=${plan.slug}`);
      return;
    }
    setSelectedPlan(plan);
  };

  const initiateRazorpayCheckout = async () => {
    if (!selectedPlan || !user) return;
    if (address.trim().length < 5) {
      setError('Please enter a complete delivery address (at least 5 characters).');
      return;
    }
    setError('');
    setStartingPayment(true);
    try {
      const { data } = await api.post('/payments/create-order', {
        amount: selectedPlan.monthlyPrice,
        purpose: 'subscription',
        planId: selectedPlan._id,
      });
      setRazorpayOrder({
        orderId: data.order.id,
        keyId: data.keyId,
        plan: selectedPlan,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not initiate Razorpay checkout.');
    } finally {
      setStartingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    simulateTestMode: boolean;
  }) => {
    if (!razorpayOrder) return;
    const { data } = await api.post('/payments/verify', {
      ...paymentDetails,
      purpose: 'subscription',
      planId: razorpayOrder.plan._id,
      deliveryAddress: address.trim(),
      timeSlot,
    });
    setRazorpayOrder(null);
    await refreshUser();
    navigate('/subscription', {
      state: {
        justSubscribed: true,
        generatedOrdersCount: data.generatedOrdersCount,
        planName: razorpayOrder.plan.name,
      },
    });
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      <div className="max-w-2xl pb-8 border-b border-[#DDE4DA]">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1A241E]">
          Membership Plans
        </h1>
        <p className="text-sm text-[#526056] mt-2 leading-relaxed">
          Choose a monthly diet salad schedule. Subscriptions automatically schedule your daily
          deliveries, apply member discounts on every extra order, and can be paused anytime.
        </p>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 bg-white border border-[#DDE4DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isSelected = selectedPlan?._id === plan._id;
            const isCurrent = user?.plan?._id === plan._id;

            return (
              <div
                key={plan._id}
                className={`bg-white rounded-xl p-6 flex flex-col border transition-colors ${
                  isSelected || plan.slug === 'premium'
                    ? 'border-[#166534]'
                    : 'border-[#DDE4DA]'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-2xl font-semibold text-[#1A241E]">{plan.name}</h2>
                  <span className="text-xs font-mono text-[#166534]">
                    {plan.discountPercent}% Extra Off
                  </span>
                </div>
                <p className="text-sm text-[#526056] mt-1.5">{plan.tagline}</p>

                <div className="mt-5 pb-5 border-b border-[#E8EDE5] flex items-baseline gap-1.5">
                  <span className="font-mono tabular-nums text-3xl font-semibold text-[#1A241E]">
                    ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#647469]">/ month</span>
                </div>

                {/* Comparison Summary Matrix */}
                <div className="mt-4 grid grid-cols-2 gap-3 pb-4 border-b border-[#E8EDE5] text-xs">
                  <div>
                    <p className="text-[#647469]">Daily Allowance</p>
                    <p className="font-mono tabular-nums font-semibold text-[#1A241E] mt-0.5">
                      {plan.saladsPerDay} {plan.saladsPerDay === 1 ? 'salad' : 'salads'}/day
                    </p>
                  </div>
                  <div>
                    <p className="text-[#647469]">Active Cycle</p>
                    <p className="font-mono tabular-nums font-semibold text-[#1A241E] mt-0.5">
                      {plan.daysPerMonth} days/month
                    </p>
                  </div>
                  <div>
                    <p className="text-[#647469]">Order Discount</p>
                    <p className="font-mono tabular-nums font-semibold text-[#1A241E] mt-0.5">
                      {plan.discountPercent}% on every order
                    </p>
                  </div>
                  <div>
                    <p className="text-[#647469]">Delivery Fee</p>
                    <p className="font-mono tabular-nums font-semibold text-[#1A241E] mt-0.5">
                      {plan.freeDelivery ? 'Free Delivery' : '₹35 standard'}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2.5 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-[#526056]">
                      <Check className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSubscribeClick(plan)}
                  className={`mt-6 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#14532D] text-white'
                      : plan.slug === 'premium'
                      ? 'bg-[#166534] hover:bg-[#14532D] text-white'
                      : 'bg-[#F4F7F2] hover:bg-[#E7ECE4] text-[#1A241E]'
                  }`}
                >
                  {isCurrent
                    ? `Renew ${plan.name} Plan`
                    : isSelected
                    ? `Selected: ${plan.name}`
                    : `Select ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscription Checkout Panel */}
      {selectedPlan && user && (
        <div className="mt-10 bg-white border border-[#166534] rounded-xl p-6 sm:p-8 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-[#1A241E]">
            Activate {selectedPlan.name} Subscription
          </h2>
          <p className="text-sm text-[#526056] mt-1">
            Confirm your daily delivery details. Razorpay will activate your{' '}
            <span className="font-mono tabular-nums font-medium text-[#1A241E]">
              {selectedPlan.daysPerMonth}-day
            </span>{' '}
            schedule immediately.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1.5">
                Daily Delivery Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment, street, landmark, city & PIN"
                className="w-full px-3.5 py-2.5 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1.5">
                Preferred Daily Delivery Slot
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      timeSlot === slot
                        ? 'bg-[#EDF5EE] border-[#166534] text-[#166534]'
                        : 'bg-white border-[#DDE4DA] text-[#526056] hover:border-[#166534]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs rounded-lg">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-[#E8EDE5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#647469]">Monthly Total</p>
                <p className="font-mono tabular-nums text-2xl font-semibold text-[#1A241E]">
                  ₹{selectedPlan.monthlyPrice.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={initiateRazorpayCheckout}
                disabled={startingPayment}
                className="px-6 py-3 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                {startingPayment ? 'Preparing Razorpay...' : 'Subscribe with Razorpay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {razorpayOrder && user && (
        <RazorpayModal
          open={Boolean(razorpayOrder)}
          amount={razorpayOrder.plan.monthlyPrice}
          title={`${razorpayOrder.plan.name} Monthly Membership`}
          subtitle={`${razorpayOrder.plan.saladsPerDay} salad/day · ${razorpayOrder.plan.daysPerMonth} days`}
          orderId={razorpayOrder.orderId}
          keyId={razorpayOrder.keyId}
          customerName={user.name}
          customerEmail={user.email}
          onSuccess={handlePaymentSuccess}
          onClose={() => setRazorpayOrder(null)}
        />
      )}
    </div>
  );
}
