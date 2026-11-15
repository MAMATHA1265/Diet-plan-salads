import { CheckCircle2, CreditCard, Lock, Smartphone, X } from 'lucide-react';
import { useState } from 'react';

interface RazorpayModalProps {
  open: boolean;
  amount: number;
  title: string;
  subtitle: string;
  orderId: string;
  keyId: string;
  customerName: string;
  customerEmail: string;
  onSuccess: (paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    simulateTestMode: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export default function RazorpayModal({
  open,
  amount,
  title,
  subtitle,
  orderId,
  keyId,
  customerName,
  customerEmail,
  onSuccess,
  onClose,
}: RazorpayModalProps) {
  const [method, setMethod] = useState<'upi' | 'card'>('upi');
  const [upiId, setUpiId] = useState('success@razorpay');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handlePay = async () => {
    setError('');
    setProcessing(true);
    try {
      const paymentId = `pay_test_${Date.now().toString(36)}`;
      await onSuccess({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: 'test_mode_verified',
        simulateTestMode: true,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Payment verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="razorpay-modal-title"
    >
      <div className="bg-white border border-[#DDE4DA] rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Razorpay Header */}
        <div className="bg-[#166534] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100">Razorpay Test Checkout</p>
            <h3 id="razorpay-modal-title" className="text-base font-semibold mt-0.5">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Close payment window"
            className="p-1 text-emerald-100 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8EDE5]">
            <div>
              <p className="text-sm font-medium text-[#1A241E]">{subtitle}</p>
              <p className="text-xs text-[#647469] font-mono mt-0.5">
                Order: {orderId} · Key: {keyId.slice(0, 14)}...
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold font-mono tabular-nums text-[#1A241E]">
                ₹{amount.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-[#647469]">INR</p>
            </div>
          </div>

          <div className="text-xs text-[#526056]">
            Paying as <span className="font-medium text-[#1A241E]">{customerName}</span> ({customerEmail})
          </div>

          {/* Payment Method Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F7F2] rounded-lg">
            <button
              type="button"
              onClick={() => setMethod('upi')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                method === 'upi' ? 'bg-white text-[#1A241E] shadow-sm' : 'text-[#526056]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI / QR</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                method === 'card' ? 'bg-white text-[#1A241E] shadow-sm' : 'text-[#526056]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Test Card</span>
            </button>
          </div>

          {method === 'upi' ? (
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1.5">
                Razorpay Test UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534] font-mono"
              />
            </div>
          ) : (
            <div className="p-3 bg-[#F8FAF7] border border-[#DDE4DA] rounded-lg text-xs text-[#526056] space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Card Number</span>
                <span className="text-[#1A241E]">4111 •••• •••• 1111</span>
              </div>
              <div className="flex justify-between">
                <span>Expiry / CVV</span>
                <span className="text-[#1A241E]">12/28 · 123</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs rounded-lg">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={processing}
            className="w-full py-2.5 px-4 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            {processing ? (
              <span>Verifying Payment...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Pay ₹{amount.toLocaleString('en-IN')} (Test Mode)</span>
              </>
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#647469]">
            <Lock className="w-3 h-3" />
            <span>Secured by Razorpay Test Gateway</span>
          </p>
        </div>
      </div>
    </div>
  );
}
