import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SaladImage from '../components/SaladImage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { items, subtotal, totalCalories, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const discountPercent = user?.plan?.discountPercent || 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const freeDelivery = Boolean(user?.plan?.freeDelivery);
  const deliveryFee = items.length === 0 ? 0 : freeDelivery ? 0 : 35;
  const estimatedTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-10">
      <div className="pb-6 border-b border-[#DDE4DA] flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#1A241E]">Your Bag</h1>
          <p className="text-sm text-[#526056] mt-1">
            Review your bowls before scheduling delivery.
          </p>
        </div>
        <Link to="/menu" className="text-sm font-medium text-[#166534] hover:underline">
          Continue browsing →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 bg-white border border-[#DDE4DA] rounded-xl p-12 text-center">
          <p className="text-lg font-medium text-[#1A241E]">Your bag is empty</p>
          <p className="text-sm text-[#526056] mt-1.5">
            Explore our signature menu or assemble a custom bowl with live macro tracking.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/menu"
              className="px-5 py-2.5 bg-[#166534] text-white text-sm font-medium rounded-lg"
            >
              Browse Salads
            </Link>
            <Link
              to="/builder"
              className="px-5 py-2.5 bg-[#F4F7F2] text-[#1A241E] text-sm font-medium rounded-lg"
            >
              Open Salad Builder
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white border border-[#DDE4DA] rounded-xl divide-y divide-[#E8EDE5]">
            {items.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-[#F2F5EF] shrink-0">
                  <SaladImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-[#1A241E]">{item.name}</h2>
                  <p className="text-xs font-mono tabular-nums text-[#647469] mt-0.5">
                    {item.calories} kcal per bowl · ₹{item.unitPrice} each
                  </p>
                  {item.isCustom && item.customDetails && (
                    <p className="text-xs text-[#526056] mt-1.5">
                      {item.customDetails.base}
                      {item.customDetails.proteins.length > 0
                        ? ` · ${item.customDetails.proteins.join(', ')}`
                        : ''}
                      {item.customDetails.toppings.length > 0
                        ? ` · ${item.customDetails.toppings.join(', ')}`
                        : ''}
                      {` · ${item.customDetails.dressing}`}
                      {item.customDetails.specialInstructions
                        ? ` (${item.customDetails.specialInstructions})`
                        : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="flex items-center border border-[#DDE4DA] rounded-lg">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="p-2 text-[#35473B] hover:bg-[#F4F7F2] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-mono tabular-nums text-[#1A241E]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="p-2 text-[#35473B] hover:bg-[#F4F7F2] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-mono tabular-nums text-sm font-semibold text-[#1A241E] w-16 text-right">
                    ₹{item.unitPrice * item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                    className="p-2 text-[#647469] hover:text-[#DC2626] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4 bg-white border border-[#DDE4DA] rounded-xl p-6">
            <h2 className="font-display text-xl font-semibold text-[#1A241E]">Order Summary</h2>

            <div className="mt-4 space-y-3 text-sm border-b border-[#E8EDE5] pb-4">
              <div className="flex justify-between text-[#526056]">
                <span>Total Nutrition</span>
                <span className="font-mono tabular-nums text-[#1A241E]">
                  {totalCalories} kcal
                </span>
              </div>
              <div className="flex justify-between text-[#526056]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#1A241E]">₹{subtotal}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-[#166534]">
                  <span>{user?.plan?.name} Discount ({discountPercent}%)</span>
                  <span className="font-mono tabular-nums">-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-[#526056]">
                <span>Delivery Fee</span>
                <span className="font-mono tabular-nums text-[#1A241E]">
                  {freeDelivery ? 'Free (Premium)' : `₹${deliveryFee}`}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-[#1A241E]">Total Payable</span>
              <span className="font-mono tabular-nums text-2xl font-semibold text-[#1A241E]">
                ₹{estimatedTotal}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate(user ? '/checkout' : '/login?redirect=/checkout')}
              className="mt-6 w-full py-3 px-4 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {user ? 'Proceed to Checkout' : 'Sign In to Checkout'}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
