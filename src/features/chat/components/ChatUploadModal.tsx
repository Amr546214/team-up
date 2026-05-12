import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

export interface UploadModalState {
  open: boolean;
  fileName?: string;
  fileType?: string;
  progress?: number | null;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface ChatUploadModalProps {
  state: UploadModalState;
  onClose: () => void;
}

export function ChatUploadModal({ state, onClose }: ChatUploadModalProps) {
  const { open, fileName, fileType, status, errorMessage } = state;
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Handle Escape key to close on error
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status === 'error') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, status, onClose]);

  // Simulate progress animation
  useEffect(() => {
    if (!open) {
      setProgress(0);
      progressRef.current = 0;
      return;
    }

    if (status === 'uploading') {
      // Reset progress when upload starts
      setProgress(0);
      progressRef.current = 0;

      // Animate from 0 to 90% over ~3 seconds
      const animate = () => {
        if (progressRef.current < 90) {
          // Slow down as we get closer to 90%
          const increment = Math.max(0.5, (90 - progressRef.current) / 50);
          progressRef.current = Math.min(90, progressRef.current + increment);
          setProgress(Math.floor(progressRef.current));
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } else if (status === 'success') {
      // Jump to 100% on success
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      progressRef.current = 100;
      setProgress(100);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [open, status]);

  if (!open) return null;

  // Determine file type category and title
  const getFileTitle = (): string => {
    const type = fileType?.toLowerCase() || '';
    const name = fileName?.toLowerCase() || '';
    const ext = name.split('.').pop() || '';

    // Image files
    if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
      return 'Uploading image...';
    }

    // Video files
    if (type.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv', 'avi', 'flv'].includes(ext)) {
      return 'Uploading video...';
    }

    // Audio files (including voice)
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'webm'].includes(ext) || type === 'voice') {
      return 'Uploading audio...';
    }

    // Default file
    return 'Uploading file...';
  };

  const title = getFileTitle();

  // Truncate filename if too long
  const displayFileName = fileName
    ? fileName.length > 40
      ? fileName.substring(0, 20) + '...' + fileName.substring(fileName.lastIndexOf('.') - 5)
      : fileName
    : 'Unknown file';

  // Determine progress bar color
  const progressBarColor = status === 'error'
    ? 'bg-red-500'
    : status === 'success'
    ? 'bg-green-500'
    : 'bg-teal-500';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Upload status"
    >
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[360px] mx-4">
        {/* Error State */}
        {status === 'error' ? (
          <div className="flex flex-col">
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload failed</h3>

            {/* Filename */}
            <p className="text-sm text-gray-500 mb-6 truncate" title={fileName}>
              {displayFileName}
            </p>

            {/* Progress bar - stopped/red */}
            <div className="w-full mb-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Percentage */}
            <p className="text-sm text-red-500 mb-4">
              {errorMessage || 'Please try again'}
            </p>

            {/* Close button */}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        ) : (
          /* Uploading or Success State */
          <div className="flex flex-col">
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {status === 'success' ? 'Upload complete!' : title}
            </h3>

            {/* Filename */}
            <p className="text-sm text-gray-500 mb-6 truncate" title={fileName}>
              {displayFileName}
            </p>

            {/* Progress bar */}
            <div className="w-full mb-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressBarColor} rounded-full transition-all duration-100`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Percentage */}
            <p className="text-sm font-medium text-gray-700 mb-2">
              {progress}%
            </p>

            {/* Subtle help text */}
            {status === 'uploading' && (
              <p className="text-xs text-gray-400">Please wait...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
