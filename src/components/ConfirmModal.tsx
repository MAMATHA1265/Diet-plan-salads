import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white border border-[#DDE4DA] rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                destructive ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#EDF5EE] text-[#166534]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="confirm-modal-title" className="text-base font-semibold text-[#1A241E]">
                {title}
              </h3>
              <p className="text-sm text-[#526056] mt-1.5 leading-relaxed">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close modal"
            className="p-1 text-[#647469] hover:text-[#1A241E] rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-[#35473B] bg-[#F4F7F2] hover:bg-[#E7ECE4] rounded-lg transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 ${
              destructive
                ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                : 'bg-[#166534] hover:bg-[#14532D]'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
