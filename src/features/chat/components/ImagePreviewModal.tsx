import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { formatChatDate } from '../utils/dateFormat';

interface ImagePreviewModalProps {
  imageUrl: string;
  fileName?: string;
  timestamp?: Date;
  onClose: () => void;
}

export function ImagePreviewModal({ imageUrl, fileName, timestamp, onClose }: ImagePreviewModalProps) {
  // Handle Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Close image preview"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center">
        {/* Image */}
        <img
          src={imageUrl}
          alt={fileName || 'Preview'}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Metadata footer */}
        {(fileName || timestamp) && (
          <div className="mt-4 px-4 py-2 bg-black/50 rounded-lg text-white/90 text-sm">
            {fileName && <span className="font-medium">{fileName}</span>}
            {fileName && timestamp && <span className="mx-2">•</span>}
            {timestamp && (
              <span className="opacity-75">{formatChatDate(timestamp)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
