import { CheckCircle2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Order } from '../types';

const TIME_SLOTS = ['8:00 AM - 9:00 AM', '12:00 PM - 1:00 PM', '7:00 PM - 8:00 PM'];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user?.address && !deliveryAddress) {
      setDeliveryAddress(user.address);
    }
  }, [user, deliveryAddress]);

  const discountPercent = user?.plan?.discountPercent || 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const freeDelivery = Boolean(user?.plan?.freeDelivery);
  const deliveryFee = items.length === 0 ? 0 : freeDelivery ? 0 : 35;
  const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) {
      setError('Your bag is empty.');
      return;
    }
    if (deliveryAddress.trim().length < 5) {
      setError('Please provide a complete delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({
          saladId: i.saladId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          calories: i.calories,
          isCustom: i.isCustom,
          customDetails: i.customDetails,
        })),
        deliveryAddress: deliveryAddress.trim(),
        timeSlot,
      });
      setConfirmedOrder(data.order);
      clearCart();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to place your order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white border border-[#166534] rounded-xl p-8">
          <div className="flex items-center gap-3 text-[#166534]">
            <CheckCircle2 className="w-7 h-7 shrink-0" />
            <div>
              <p className="text-xs font-mono">Order Confirmed</p>
              <h1 className="font-display text-2xl font-semibold text-[#1A241E]">
                Order #{confirmedOrder.orderNumber} — {confirmedOrder.status}
              </h1>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E8EDE5] space-y-2 text-sm text-[#526056]">
            <p>
              <span className="font-medium text-[#1A241E]">Delivery Slot: </span>
              {confirmedOrder.timeSlot}
            </p>
            <p>
              <span className="font-medium text-[#1A241E]">Address: </span>
              {confirmedOrder.deliveryAddress}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E8EDE5]">
            <p className="text-xs font-semibold text-[#1A241E] mb-3">Items Ordered</p>
            <ul className="space-y-2 text-sm">
              {confirmedOrder.items.map((item, idx) => (
                <li key={idx} className="flex justify-between text-[#35473B]">
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <span className="font-mono tabular-nums">
                    ₹{item.unitPrice * item.quantity}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-[#E8EDE5] flex justify-between font-semibold text-[#1A241E]">
              <span>Total Paid</span>
              <span className="font-mono tabular-nums">₹{confirmedOrder.totalAmount}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/orders"
              className="px-5 py-2.5 bg-[#166534] text-white text-sm font-medium rounded-lg"
            >
              View My Orders
            </Link>
            <Link
              to="/menu"
              className="px-5 py-2.5 bg-[#F4F7F2] text-[#1A241E] text-sm font-medium rounded-lg"
            >
              Order More Bowls
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <p className="text-base font-medium text-[#1A241E]">Nothing to check out yet.</p>
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="mt-4 px-5 py-2.5 bg-[#166534] text-white text-sm font-medium rounded-lg cursor-pointer"
        >
          Go to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-10">
      <div className="pb-6 border-b border-[#DDE4DA]">
        <h1 className="font-display text-3xl font-semibold text-[#1A241E]">Checkout</h1>
        <p className="text-sm text-[#526056] mt-1">
          Enter your delivery address and preferred dispatch slot.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white border border-[#DDE4DA] rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#35473B] mb-1.5">
              Delivery Address
            </label>
            <textarea
              rows={3}
              required
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="House/Flat No., Street, Area, Landmark, PIN Code"
              className="w-full px-3.5 py-2.5 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#35473B] mb-1.5">
              Select Delivery Time Slot
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`py-2.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    timeSlot === slot
                      ? 'bg-[#EDF5EE] border-[#166534] text-[#166534]'
                      : 'bg-white border-[#DDE4DA] text-[#526056]'
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
        </div>

        <aside className="lg:col-span-5 bg-white border border-[#DDE4DA] rounded-xl p-6">
          <h2 className="font-display text-xl font-semibold text-[#1A241E]">Final Summary</h2>
          <ul className="mt-4 space-y-2.5 text-sm border-b border-[#E8EDE5] pb-4">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between text-[#35473B]">
                <span className="truncate pr-2">
                  {item.quantity} × {item.name}
                </span>
                <span className="font-mono tabular-nums shrink-0">
                  ₹{item.unitPrice * item.quantity}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 text-sm border-b border-[#E8EDE5] pb-4">
            <div className="flex justify-between text-[#526056]">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">₹{subtotal}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-[#166534]">
                <span>Member Plan Discount ({discountPercent}%)</span>
                <span className="font-mono tabular-nums">-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-[#526056]">
              <span>Delivery Fee</span>
              <span className="font-mono tabular-nums">
                {freeDelivery ? 'Free' : `₹${deliveryFee}`}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-baseline">
            <span className="text-sm font-semibold text-[#1A241E]">Total Amount</span>
            <span className="font-mono tabular-nums text-2xl font-semibold text-[#1A241E]">
              ₹{totalAmount}
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full py-3 px-4 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Placing Order...' : `Confirm & Pay ₹${totalAmount}`}
          </button>
        </aside>
      </form>
    </div>
  );
}
