import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { MemberRecord, Order, Salad, Subscription } from '../types';

export default function AdminDashboardPage() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [salads, setSalads] = useState<Salad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/members'),
      api.get('/orders'),
      api.get('/subscriptions'),
      api.get('/salads'),
    ])
      .then(([mRes, oRes, sRes, salRes]) => {
        setMembers(mRes.data.members || []);
        setOrders(oRes.data.orders || []);
        setSubscriptions(sRes.data.subscriptions || []);
        setSalads(salRes.data.salads || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeMembersCount = members.filter((m) => m.isActive).length;
  const activeSubsCount = subscriptions.filter((s) => s.status === 'active').length;
  const openOrdersCount = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Out for Delivery'
  ).length;

  return (
    <DashboardLayout
      title="Operations Overview"
      breadcrumb="Admin Console / Dashboard"
      action={
        <Link
          to="/admin/members"
          className="px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg whitespace-nowrap"
        >
          Add Member
        </Link>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white border border-[#DDE4DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#DDE4DA] rounded-xl p-5">
              <p className="text-xs text-[#647469]">Active Members</p>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#1A241E] mt-1">
                {activeMembersCount}
              </p>
              <p className="text-xs text-[#526056] mt-1">{members.length} total registered</p>
            </div>
            <div className="bg-white border border-[#DDE4DA] rounded-xl p-5">
              <p className="text-xs text-[#647469]">Active Subscriptions</p>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#1A241E] mt-1">
                {activeSubsCount}
              </p>
              <p className="text-xs text-[#526056] mt-1">Recurring monthly plans</p>
            </div>
            <div className="bg-white border border-[#DDE4DA] rounded-xl p-5">
              <p className="text-xs text-[#647469]">Open Kitchen Orders</p>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#1A241E] mt-1">
                {openOrdersCount}
              </p>
              <Link to="/admin/orders" className="text-xs text-[#166534] hover:underline mt-1 inline-block">
                Manage fulfillment →
              </Link>
            </div>
            <div className="bg-white border border-[#DDE4DA] rounded-xl p-5">
              <p className="text-xs text-[#647469]">Menu Salads</p>
              <p className="font-mono tabular-nums text-2xl font-semibold text-[#1A241E] mt-1">
                {salads.length}
              </p>
              <Link to="/admin/menu" className="text-xs text-[#166534] hover:underline mt-1 inline-block">
                Edit menu &amp; ingredients →
              </Link>
            </div>
          </div>

          {/* Active Subscriptions Table */}
          <div className="bg-white border border-[#DDE4DA] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8EDE5] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1A241E]">Member Subscriptions</h2>
              <span className="text-xs font-mono tabular-nums text-[#647469]">
                {subscriptions.length} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E8EDE5] text-xs text-[#647469] bg-[#FAFBF8]">
                    <th className="py-3 px-4 font-medium">Member</th>
                    <th className="py-3 px-4 font-medium">Plan</th>
                    <th className="py-3 px-4 font-medium">Period</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Monthly Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDE5]">
                  {subscriptions.slice(0, 8).map((sub) => (
                    <tr key={sub._id} className="hover:bg-[#FAFBF8]">
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#1A241E]">{sub.memberName}</p>
                        <p className="text-xs text-[#647469]">{sub.memberEmail}</p>
                      </td>
                      <td className="py-3 px-4 text-[#35473B]">{sub.planName}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#526056]">
                        {new Date(sub.startDate).toLocaleDateString()} –{' '}
                        {new Date(sub.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium capitalize">
                        <span
                          className={
                            sub.status === 'active'
                              ? 'text-[#16A34A]'
                              : sub.status === 'paused'
                              ? 'text-[#D97706]'
                              : 'text-[#DC2626]'
                          }
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right text-[#1A241E]">
                        ₹{(sub.monthlyPrice || 0).toLocaleString('en-IN')}
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
