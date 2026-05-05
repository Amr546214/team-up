import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, details?: string) => Promise<void>;
  userName?: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'scam', label: 'Scam' },
  { value: 'inappropriate', label: 'Inappropriate behavior' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'other', label: 'Other' },
];

export function ReportUserModal({ isOpen, onClose, onConfirm, userName }: ReportUserModalProps) {
  const [selectedReason, setSelectedReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const reason = selectedReason;
    const detailsText = selectedReason === 'other' ? details : undefined;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onConfirm(reason, detailsText);
      setSuccessMsg('User reported');
      setTimeout(() => {
        setSuccessMsg(null);
        setSelectedReason('spam');
        setDetails('');
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('[Report User] failed', err);
      setErrorMsg('Failed to report user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrorMsg(null);
      setSuccessMsg(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Report user?</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {successMsg ? (
            <p className="text-sm text-green-600 font-medium">{successMsg}</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                {userName
                  ? `Report ${userName}? This user will be flagged for review. Your report will be stored for moderation.`
                  : 'This user will be flagged for review. Your report will be stored for moderation.'}
              </p>

              {/* Reason Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        selectedReason === reason.value ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportUserReason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-gray-700">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Details textarea for Other */}
              {selectedReason === 'other' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Additional details</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Please describe the issue..."
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  />
                </div>
              )}

              {/* Error message */}
              {errorMsg && (
                <p className="text-sm text-red-500">{errorMsg}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!successMsg && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Reporting...
                </>
              ) : (
                'Report user'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
