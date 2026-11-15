import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { Order } from '../types';

const STATUS_OPTIONS: Order['status'][] = [
  'Pending',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders', {
        params: { status: statusFilter, orderType: typeFilter },
      });
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout title="Manage Orders" breadcrumb="Admin Console / Orders">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#EFF3EC] rounded-lg overflow-x-auto">
          {['all', 'Pending', 'Preparing', 'Out for Delivery', 'Delivered'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                statusFilter === st ? 'bg-white text-[#1A241E] shadow-sm' : 'text-[#526056]'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter order type"
          className="px-3 py-2 text-xs bg-white border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
        >
          <option value="all">All Order Types</option>
          <option value="one-time">One-Time Orders</option>
          <option value="subscription">Subscription Daily</option>
        </select>
      </div>

      <div className="bg-white border border-[#DDE4DA] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-[#526056]">Loading kitchen orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#526056]">No orders match filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8EDE5] text-xs text-[#647469] bg-[#FAFBF8]">
                  <th className="py-3 px-4 font-medium">Order</th>
                  <th className="py-3 px-4 font-medium">Member</th>
                  <th className="py-3 px-4 font-medium">Bowls &amp; Slot</th>
                  <th className="py-3 px-4 font-medium text-right">Amount</th>
                  <th className="py-3 px-4 font-medium text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDE5]">
                {orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-[#FAFBF8]">
                    <td className="py-3.5 px-4">
                      <p className="font-mono tabular-nums text-xs font-medium text-[#1A241E]">
                        {ord.orderNumber}
                      </p>
                      <p className="text-[11px] text-[#647469] capitalize">{ord.orderType}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#1A241E]">{ord.customerName}</p>
                      <p className="text-xs text-[#647469] truncate max-w-[200px]">
                        {ord.deliveryAddress}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#35473B]">
                      <p>{ord.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                      <p className="font-mono tabular-nums text-[#647469] mt-0.5">
                        {new Date(ord.scheduledDate).toLocaleDateString()} · {ord.timeSlot}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-right text-[#1A241E]">
                      {ord.orderType === 'subscription' ? 'Plan' : `₹${ord.totalAmount}`}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={ord.status}
                        disabled={updatingId === ord._id}
                        onChange={(e) =>
                          handleStatusChange(ord._id, e.target.value as Order['status'])
                        }
                        aria-label={`Status for order ${ord.orderNumber}`}
                        className="px-2.5 py-1.5 text-xs font-medium bg-white border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534] cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
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
