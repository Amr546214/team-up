import { useState, useRef, FormEvent, KeyboardEvent, useCallback, useEffect } from 'react';
import { Send, Image, Paperclip, Mic, Square, X, File } from 'lucide-react';
import { formatFileSize, formatDuration, isMediaRecorderSupported } from '../utils/fileFormat';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendAttachment: (data: {
    type: 'image' | 'file' | 'voice' | 'audio';
    fileOrBlob: File | Blob;
    fileName: string;
    fileSize: number;
    fileType: string;
    duration?: number;
  }) => void;
  disabled?: boolean;
  conversationId?: string | null;
  // Typing indicator handlers
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function MessageInput({
  onSendMessage,
  onSendAttachment,
  disabled = false,
  conversationId,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Typing indicator refs
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typing indicator helpers
  const triggerTypingStart = useCallback(() => {
    if (!isTypingRef.current && onTypingStart) {
      isTypingRef.current = true;
      onTypingStart();
    }
  }, [onTypingStart]);

  const triggerTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current && onTypingStop) {
      isTypingRef.current = false;
      onTypingStop();
    }
  }, [onTypingStop]);

  // Cleanup on conversation change or unmount
  useEffect(() => {
    // Reset typing state when conversation changes
    if (isTypingRef.current) {
      triggerTypingStop();
    }

    return () => {
      if (isTypingRef.current) {
        triggerTypingStop();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, triggerTypingStop]);

  const handleMessageChange = useCallback((value: string) => {
    setMessage(value);

    if (value.trim()) {
      // User is typing - send start
      triggerTypingStart();

      // Debounce stop - clear any existing timeout and set new one
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        triggerTypingStop();
      }, 1500);
    } else {
      // Input is empty - stop typing immediately
      triggerTypingStop();
    }
  }, [triggerTypingStart, triggerTypingStop]);

  // Text message handlers
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isRecording) {
      // Stop typing when sending
      triggerTypingStop();
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !disabled && !isRecording) {
        // Stop typing when sending
        triggerTypingStop();
        onSendMessage(message.trim());
        setMessage('');
      }
    }
  };

  // Image upload handler
  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendAttachment({
        type: 'image',
        fileOrBlob: file,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    }
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // File upload handler
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Helper to check if file is an audio file
  const isAudioFile = (file: File): boolean => {
    // Check MIME type
    if (file.type.startsWith('audio/')) {
      return true;
    }
    // Check extension fallback
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm', 'flac', 'wma'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return !!extension && audioExtensions.includes(extension);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Determine if this is an audio file
      const isAudio = isAudioFile(file);

      onSendAttachment({
        type: isAudio ? 'audio' : 'file',
        fileOrBlob: file,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Voice recording handlers
  const startRecording = useCallback(async () => {
    if (!isMediaRecorderSupported()) {
      setRecordingError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = 'audio/webm;codecs=opus';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const duration = recordingTime;

        onSendAttachment({
          type: 'voice',
          fileOrBlob: audioBlob,
          fileName: `voice-${Date.now()}.webm`,
          fileSize: audioBlob.size,
          fileType: mimeType,
          duration,
        });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear recording state
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setRecordingError('Microphone permission denied or not available.');
    }
  }, [onSendAttachment, recordingTime]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Don't send - just clear
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  return (
    <div className="px-5 py-4">
      {/* Recording Error */}
      {recordingError && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 rounded-lg text-sm text-red-700">
          <span className="flex-1">{recordingError}</span>
          <button
            type="button"
            onClick={() => setRecordingError(null)}
            className="text-red-500 hover:text-red-700 px-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Recording UI */}
      {isRecording ? (
        <div className="flex items-center gap-3 bg-red-50 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-700 font-medium">Recording...</span>
            <span className="text-red-600 font-mono">{formatDuration(recordingTime)}</span>
          </div>
          <button
            type="button"
            onClick={cancelRecording}
            className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
            title="Cancel recording"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-full transition-colors"
            title="Stop recording"
          >
            <Square className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* Normal Composer */
        <form onSubmit={handleSubmit}>
          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Message Composer Bar */}
          <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
            {/* Attachment Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleImageClick}
                disabled={disabled}
                className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors disabled:opacity-40"
                title="Add image"
                aria-label="Add image"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleFileClick}
                disabled={disabled}
                className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors disabled:opacity-40"
                title="Add file"
                aria-label="Add file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

            {/* Text Input */}
            <textarea
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={disabled}
              rows={1}
              className="flex-1 resize-none bg-transparent border-0 px-2 py-2 text-[15px] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-10 max-h-[100px] placeholder:text-gray-400"
              style={{ overflow: 'hidden' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
              }}
            />

            {/* Voice & Send Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-40"
                title="Record voice"
                aria-label="Record voice message"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={!message.trim() || disabled}
                className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-teal-600/20"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
