import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { Order } from '../types';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'one-time' | 'subscription'>('all');

  useEffect(() => {
    api
      .get('/orders/my')
      .then((res) => setOrders(res.data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => typeFilter === 'all' || o.orderType === typeFilter);

  return (
    <DashboardLayout
      title="My Orders"
      breadcrumb="Member Portal / Order History"
      action={
        <Link
          to="/menu"
          className="px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg whitespace-nowrap"
        >
          New Order
        </Link>
      }
    >
      <div className="mb-5 flex items-center gap-1 p-1 bg-[#EFF3EC] rounded-lg w-fit">
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'one-time', label: 'A La Carte' },
          { key: 'subscription', label: 'Subscription Daily' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTypeFilter(tab.key as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              typeFilter === tab.key ? 'bg-white text-[#1A241E] shadow-sm' : 'text-[#526056]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#DDE4DA] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-[#526056]">Loading your orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-base font-medium text-[#1A241E]">No orders found</p>
            <p className="text-sm text-[#526056] mt-1">
              Place your first salad order or activate a monthly membership plan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E8EDE5] text-xs text-[#647469] bg-[#FAFBF8]">
                  <th className="py-3 px-4 font-medium">Order ID</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Bowls</th>
                  <th className="py-3 px-4 font-medium">Delivery Schedule</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDE5]">
                {filtered.map((ord) => (
                  <tr key={ord._id} className="hover:bg-[#FAFBF8]">
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs font-medium text-[#1A241E]">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#526056] capitalize">
                      {ord.orderType === 'subscription' ? 'Subscription' : 'One-Time'}
                    </td>
                    <td className="py-3.5 px-4 text-[#1A241E]">
                      {ord.items.map((i, idx) => (
                        <div key={idx}>
                          <span>
                            {i.quantity}× {i.name}
                          </span>
                          <span className="text-xs font-mono text-[#647469] ml-2">
                            ({i.calories} kcal)
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#526056]">
                      <div className="font-mono tabular-nums">
                        {new Date(ord.scheduledDate).toLocaleDateString()} · {ord.timeSlot}
                      </div>
                      <div className="text-[#647469] truncate max-w-[220px]">{ord.deliveryAddress}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">
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
                    <td className="py-3.5 px-4 font-mono tabular-nums text-right text-[#1A241E]">
                      {ord.orderType === 'subscription' ? 'Included' : `₹${ord.totalAmount}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
