import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface VideoPreviewModalProps {
  videoUrl: string;
  fileName?: string;
  onClose: () => void;
}

export function VideoPreviewModal({ videoUrl, fileName, onClose }: VideoPreviewModalProps) {
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
      aria-label="Video preview"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Close video preview"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Video container */}
      <div className="relative w-full max-w-[900px] mx-4 flex flex-col items-center">
        {/* Title */}
        {fileName && (
          <div className="mb-4 px-4 py-2 bg-black/50 rounded-lg text-white/90 text-sm max-w-full truncate">
            <span className="font-medium">{fileName}</span>
          </div>
        )}

        {/* Video player */}
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full max-h-[80vh] rounded-lg shadow-2xl bg-black"
          onEnded={() => {
            // Do not auto-close on video end
          }}
        />
      </div>
    </div>
  );
}
