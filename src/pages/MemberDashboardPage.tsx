import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CustomSalad, Order, Subscription } from '../types';

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedSalads, setSavedSalads] = useState<CustomSalad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/subscriptions/my'),
      api.get('/orders/my'),
      api.get('/salads/custom'),
    ])
      .then(([subRes, ordRes, customRes]) => {
        setSubscription(subRes.data.subscription || null);
        setOrders(ordRes.data.orders || []);
        setSavedSalads(customRes.data.customSalads || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const upcomingCount = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Out for Delivery'
  ).length;

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name || 'Member'}`}
      breadcrumb="Member Portal / Overview"
      action={
        <Link
          to="/menu"
          className="px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg whitespace-nowrap"
        >
          Order a Salad
        </Link>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-white border border-[#DDE4DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#DDE4DA] rounded-xl p-5">
              <p className="text-xs text-[#647469]">Active Membership</p>
              <p className="font-display text-xl font-semibold text-[#1A241E] mt-1">
                {subscription?.plan?.name || user?.plan?.name || 'No Active Plan'}
              </p>
              <p className="text-xs text-[#526056] mt-1">
                {subscription
                  ? `${subscription.status.toUpperCase()} · ${subscription.plan?.discountPercent || 0}% order discount`
                  : 'Subscribe for daily bowls & discounts'}
              </p>
            </div>

            <div className="bg-white border border-[#DDE4DA] rounded-xl p-5">
              <p className="text-xs text-[#647469]">Scheduled &amp; Active Orders</p>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#1A241E] mt-1">
                {upcomingCount}
              </p>
              <p className="text-xs text-[#526056] mt-1">
                {orders.length} total orders placed
              </p>
            </div>

            <div className="bg-white border border-[#DDE4DA] rounded-xl p-5">
              <p className="text-xs text-[#647469]">Saved Custom Bowls</p>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#1A241E] mt-1">
                {savedSalads.length}
              </p>
              <Link to="/builder" className="text-xs text-[#166534] hover:underline mt-1 inline-block">
                Build or reorder custom bowl →
              </Link>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white border border-[#DDE4DA] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8EDE5] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1A241E]">Recent &amp; Upcoming Deliveries</h2>
              <Link to="/orders" className="text-xs font-medium text-[#166534] hover:underline">
                View all orders →
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#526056]">
                No orders yet.{' '}
                <Link to="/menu" className="text-[#166534] font-medium hover:underline">
                  Browse our salad menu
                </Link>
                .
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EDE5] text-xs text-[#647469] bg-[#FAFBF8]">
                      <th className="py-3 px-4 font-medium">Order</th>
                      <th className="py-3 px-4 font-medium">Items</th>
                      <th className="py-3 px-4 font-medium">Scheduled</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EDE5]">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord._id} className="hover:bg-[#FAFBF8]">
                        <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#1A241E]">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3 px-4 text-[#35473B]">
                          {ord.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#526056]">
                          {new Date(ord.scheduledDate).toLocaleDateString()} · {ord.timeSlot}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium">
                          <span
                            className={
                              ord.status === 'Delivered'
                                ? 'text-[#16A34A]'
                                : ord.status === 'Cancelled'
                                ? 'text-[#DC2626]'
                                : 'text-[#D97706]'
                            }
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-right text-[#1A241E]">
                          {ord.orderType === 'subscription' ? 'Plan Included' : `₹${ord.totalAmount}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
