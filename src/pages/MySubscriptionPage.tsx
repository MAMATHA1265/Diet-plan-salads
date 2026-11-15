import { CheckCircle2, Pause, Play, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Subscription } from '../types';

export default function MySubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [feedback, setFeedback] = useState('');

  const { refreshUser } = useAuth();
  const location = useLocation();
  const navState = location.state as {
    justSubscribed?: boolean;
    generatedOrdersCount?: number;
    planName?: string;
  } | null;

  const loadSubscription = () => {
    setLoading(true);
    api
      .get('/subscriptions/my')
      .then((res) => {
        setSubscription(res.data.subscription || null);
        setHistory(res.data.history || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const handlePause = async () => {
    if (!subscription) return;
    setActionLoading(true);
    setFeedback('');
    try {
      const { data } = await api.patch(`/subscriptions/${subscription._id}/pause`);
      setSubscription(data.subscription);
      setFeedback('Subscription paused. Your remaining days are preserved.');
      await refreshUser();
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!subscription) return;
    setActionLoading(true);
    setFeedback('');
    try {
      const { data } = await api.patch(`/subscriptions/${subscription._id}/resume`);
      setSubscription(data.subscription);
      setFeedback('Subscription resumed! End date adjusted for paused duration.');
      await refreshUser();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    setActionLoading(true);
    setFeedback('');
    try {
      const { data } = await api.patch(`/subscriptions/${subscription._id}/cancel`);
      setSubscription(data.subscription);
      setConfirmCancel(false);
      setFeedback('Subscription cancelled. Future pending subscription deliveries were stopped.');
      await refreshUser();
      loadSubscription();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="My Subscription"
      breadcrumb="Member Portal / Membership"
      action={
        <Link
          to="/plans"
          className="px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg whitespace-nowrap"
        >
          {subscription && subscription.status !== 'cancelled' ? 'Change Plan' : 'Browse Plans'}
        </Link>
      }
    >
      {navState?.justSubscribed && (
        <div className="mb-6 p-4 bg-[#EDF5EE] border border-[#BBF7D0] text-[#166534] rounded-xl flex items-start gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {navState.planName} Subscription Activated
            </p>
            <p className="text-xs mt-0.5">
              {navState.generatedOrdersCount} daily salad deliveries have been automatically
              scheduled to your address.
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div className="mb-6 p-3.5 bg-[#EDF5EE] border border-[#BBF7D0] text-[#166534] text-sm rounded-xl">
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="h-48 bg-white border border-[#DDE4DA] rounded-xl animate-pulse" />
      ) : !subscription ? (
        <div className="bg-white border border-[#DDE4DA] rounded-xl p-10 text-center">
          <p className="text-base font-medium text-[#1A241E]">No active subscription</p>
          <p className="text-sm text-[#526056] mt-1">
            Choose Basic, Standard, or Premium to unlock daily scheduled bowls and member discounts.
          </p>
          <Link
            to="/plans"
            className="mt-5 inline-block px-5 py-2.5 bg-[#166534] text-white text-sm font-medium rounded-lg"
          >
            View Membership Plans
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Subscription Card */}
          <div className="bg-white border border-[#DDE4DA] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8EDE5]">
              <div>
                <p className="text-xs text-[#647469]">Current Plan</p>
                <h2 className="font-display text-2xl font-semibold text-[#1A241E] mt-0.5">
                  {subscription.plan?.name || 'Membership'} Plan
                </h2>
                <p className="text-xs font-mono text-[#526056] mt-1">
                  {subscription.plan?.saladsPerDay} salad/day · {subscription.plan?.daysPerMonth}{' '}
                  days/month · {subscription.plan?.discountPercent}% extra order discount
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs text-[#647469]">Status</p>
                <p
                  className={`text-sm font-semibold capitalize mt-0.5 ${
                    subscription.status === 'active'
                      ? 'text-[#16A34A]'
                      : subscription.status === 'paused'
                      ? 'text-[#D97706]'
                      : 'text-[#DC2626]'
                  }`}
                >
                  {subscription.status}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-5 border-b border-[#E8EDE5] text-sm">
              <div>
                <p className="text-xs text-[#647469]">Start Date</p>
                <p className="font-mono tabular-nums font-medium text-[#1A241E] mt-1">
                  {new Date(subscription.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#647469]">End Date</p>
                <p className="font-mono tabular-nums font-medium text-[#1A241E] mt-1">
                  {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#647469]">Daily Time Slot</p>
                <p className="font-mono tabular-nums font-medium text-[#1A241E] mt-1">
                  {subscription.timeSlot}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#647469]">Delivery Address</p>
                <p className="text-[#1A241E] mt-1 line-clamp-2">{subscription.deliveryAddress}</p>
              </div>
            </div>

            {subscription.status !== 'cancelled' && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {subscription.status === 'active' ? (
                  <button
                    type="button"
                    onClick={handlePause}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-[#F4F7F2] hover:bg-[#E7ECE4] text-[#1A241E] text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Subscription</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResume}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Subscription</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-white border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Subscription</span>
                </button>
              </div>
            )}
          </div>

          {/* Subscription History */}
          {history.length > 1 && (
            <div className="bg-white border border-[#DDE4DA] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8EDE5]">
                <h3 className="text-sm font-semibold text-[#1A241E]">Subscription History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EDE5] text-xs text-[#647469] bg-[#FAFBF8]">
                      <th className="py-3 px-4 font-medium">Plan</th>
                      <th className="py-3 px-4 font-medium">Start Date</th>
                      <th className="py-3 px-4 font-medium">End Date</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EDE5]">
                    {history.map((sub) => (
                      <tr key={sub._id}>
                        <td className="py-3 px-4 font-medium text-[#1A241E]">
                          {sub.plan?.name || 'Plan'}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#526056]">
                          {new Date(sub.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#526056]">
                          {new Date(sub.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-xs capitalize text-[#526056]">{sub.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmCancel}
        title="Cancel Monthly Subscription?"
        description="Cancelling stops all upcoming pending subscription deliveries and removes your member order discount."
        confirmLabel="Yes, Cancel Subscription"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </DashboardLayout>
  );
}
