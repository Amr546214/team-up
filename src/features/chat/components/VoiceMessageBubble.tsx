import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Music, Loader2 } from 'lucide-react';
import { formatDuration } from '../utils/fileFormat';

interface VoiceMessageBubbleProps {
  mediaUrl: string;
  duration?: number;
  isOwnMessage: boolean;
  fileName?: string;
  variant?: 'voice' | 'audio';
  messageId: string;
  activeAudioId: string | null;
  setActiveAudioId: (id: string | null) => void;
  message?: any; // Full message for debug
}

// Stable fake waveform bar heights (prevents jitter on re-renders)
const WAVEFORM_BARS = [8, 14, 10, 18, 12, 22, 16, 10, 20, 14, 8, 18, 12, 16, 10, 22, 14, 8, 16, 12];

export function VoiceMessageBubble({
  mediaUrl,
  duration: propDuration,
  isOwnMessage,
  fileName,
  variant = 'voice',
  messageId,
  activeAudioId,
  setActiveAudioId,
  message,
}: VoiceMessageBubbleProps) {
  const isAudioFile = variant === 'audio';
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(propDuration || 0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioLoadError, setAudioLoadError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Derive playing state from global active audio id
  const isPlaying = activeAudioId === messageId;

  // Resolve audio URL from various possible fields
  const getAudioUrl = (msg: any): string | null => {
    if (!msg) return null;

    const directUrl =
      msg.audioUrl ||
      msg.audio_url ||
      msg.voiceUrl ||
      msg.voice_url ||
      msg.fileUrl ||
      msg.file_url ||
      msg.attachmentUrl ||
      msg.attachment_url ||
      msg.mediaUrl ||
      msg.media_url ||
      msg.url ||
      msg.content;

    if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
      return directUrl;
    }

    const attachments =
      msg.attachments ||
      msg.files ||
      msg.media ||
      msg.message_attachments ||
      [];

    const audioAttachment = attachments.find((attachment: any) => {
      const type =
        attachment?.type ||
        attachment?.mime_type ||
        attachment?.mimeType ||
        attachment?.file_type ||
        '';

      const url =
        attachment?.url ||
        attachment?.file_url ||
        attachment?.fileUrl ||
        attachment?.publicUrl ||
        attachment?.public_url ||
        attachment?.path ||
        '';

      return (
        type?.startsWith('audio/') ||
        url?.match(/\.(webm|mp3|wav|ogg|m4a)(\?.*)?$/i)
      );
    });

    const attachmentUrl =
      audioAttachment?.url ||
      audioAttachment?.file_url ||
      audioAttachment?.fileUrl ||
      audioAttachment?.publicUrl ||
      audioAttachment?.public_url ||
      audioAttachment?.path;

    if (attachmentUrl && typeof attachmentUrl === 'string' && attachmentUrl.startsWith('http')) {
      return attachmentUrl;
    }

    return null;
  };

  const resolvedAudioUrl = getAudioUrl(message) || mediaUrl;

  // Get duration from audio metadata when loaded
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleLoadedMetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setAudioDuration(audio.duration);
        }
      };
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, []);

  // Update current time while playing
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      console.log('[Audio Debug] ended event', messageId);
      if (activeAudioId === messageId) {
        setActiveAudioId(null);
      }
      setCurrentTime(0);
    };

    // Note: We do NOT add a pause event listener here because
    // pause events fire during audio.load() which causes flash/reset issues.
    // Only manually calling pause() should clear activeAudioId.

    const handlePlay = () => {
      console.log('[Audio Debug] play event', messageId);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
    };
  }, [activeAudioId, messageId, setActiveAudioId]);

  // Stop this audio when another one becomes active
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only pause if another audio became active AND this one is currently playing
    if (activeAudioId && activeAudioId !== messageId && !audio.paused) {
      console.log('[Audio Debug] pause because another audio became active', {
        audioId: messageId,
        activeAudioId,
      });
      audio.pause();
      audio.currentTime = 0;
    }
  }, [activeAudioId, messageId]);

  // Track mount/unmount for debugging
  useEffect(() => {
    console.log('[Audio Debug] mounted', messageId);
    return () => {
      console.log('[Audio Debug] unmounted', messageId);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      // Only clear global state if this was the active audio
      if (activeAudioId === messageId) {
        setActiveAudioId(null);
      }
    };
  }, [activeAudioId, messageId, setActiveAudioId]);

  // Safety timeout: ensure loading state never gets stuck for more than 5 seconds
  useEffect(() => {
    if (!isAudioLoading) return;

    const timeout = setTimeout(() => {
      console.log('[Audio Debug] loading safety timeout triggered', messageId);
      setIsAudioLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isAudioLoading, messageId]);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;

    console.log('[Audio Debug] click play/pause', {
      audioId: messageId,
      activeAudioId,
      resolvedAudioUrl,
      audioExists: !!audio,
      paused: audio?.paused,
      ended: audio?.ended,
      currentTime: audio?.currentTime,
      readyState: audio?.readyState,
      networkState: audio?.networkState,
    });

    if (!audio || !resolvedAudioUrl) {
      console.warn('[Audio Debug] missing audio element or playable url');
      setIsAudioLoading(false);
      setAudioLoadError(true);
      setActiveAudioId(null);
      return;
    }

    // Check if this audio is currently the active one AND actually playing
    if (activeAudioId === messageId && !audio.paused) {
      console.log('[Audio Debug] pause current audio', messageId);
      audio.pause();
      setActiveAudioId(null);
      setIsAudioLoading(false);
      return;
    }

    // This audio should start playing
    setIsAudioLoading(true);
    setAudioLoadError(false);

    try {
      // IMPORTANT: Set activeAudioId FIRST to stop other audios
      // This must happen before audio.play() so the pause-other-audios effect runs
      setActiveAudioId(messageId);

      // Only load if src is missing or different - avoid unnecessary load() calls
      if (!audio.src || audio.src !== resolvedAudioUrl) {
        console.log('[Audio Debug] setting src and loading', messageId);
        audio.src = resolvedAudioUrl;
        audio.load();
      }

      await audio.play();
      console.log('[Audio Debug] play() returned, waiting for onPlaying event', messageId);
    } catch (error) {
      console.error('[Audio Debug] play failed', {
        audioId: messageId,
        resolvedAudioUrl,
        error,
        audioError: audio.error,
        readyState: audio.readyState,
        networkState: audio.networkState,
      });
      // Reset states on error
      setActiveAudioId(null);
      setAudioLoadError(true);
      setIsAudioLoading(false);
    }
  }, [messageId, activeAudioId, setActiveAudioId, resolvedAudioUrl]);

  // Calculate progress percentage
  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // Determine how many bars should be filled based on progress
  const filledBarsCount = Math.floor((progress / 100) * WAVEFORM_BARS.length);

  // Colors based on message type
  const barColorClass = isOwnMessage
    ? 'bg-teal-200'
    : 'bg-teal-300';

  const unfilledBarColorClass = isOwnMessage
    ? 'bg-teal-500/30'
    : 'bg-gray-300';

  const buttonBgClass = isOwnMessage
    ? 'bg-white text-teal-600'
    : 'bg-teal-500 text-white';

  // Debug logging
  console.log('[Audio Debug] full message', message);
  console.log('[Audio Debug] mediaUrl prop', mediaUrl);
  console.log('[Audio Debug] resolvedAudioUrl', resolvedAudioUrl);
  console.log('[Audio Debug] messageId', messageId);
  console.log('[Audio Debug] activeAudioId', activeAudioId);
  console.log('[Audio Debug] isPlaying (derived)', isPlaying);
  console.log('[Audio Debug] isAudioLoading (state)', isAudioLoading);
  console.log('[Audio Debug] audioLoadError (state)', audioLoadError);

  if (!resolvedAudioUrl || resolvedAudioUrl === '') {
    console.log('[Audio Debug] no audio url available');
    return (
      <div className="flex items-center gap-2 text-sm opacity-75">
        <Music className="w-4 h-4" />
        <span>{isAudioFile ? 'Audio file unavailable' : 'Voice message unavailable'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-60 max-w-[300px] select-none">
      {/* Hidden audio element with full event handlers */}
      <audio
        ref={audioRef}
        src={resolvedAudioUrl}
        preload="metadata"
        onLoadStart={() => {
          console.log('[Audio Debug] load start', messageId, resolvedAudioUrl);
        }}
        onLoadedMetadata={() => {
          console.log('[Audio Debug] metadata loaded', messageId);
          setAudioDuration(audioRef.current?.duration || propDuration || 0);
        }}
        onCanPlay={() => {
          console.log('[Audio Debug] can play', messageId);
        }}
        onPlaying={() => {
          console.log('[Audio Debug] playing event - audio actually started', messageId);
          // Playback confirmed - clear loading state
          // activeAudioId was already set before play() to stop other audios
          setIsAudioLoading(false);
          setAudioLoadError(false);
        }}
        onWaiting={() => {
          console.log('[Audio Debug] waiting/buffering', messageId);
          setIsAudioLoading(true);
        }}
        onStalled={() => {
          console.log('[Audio Debug] stalled', messageId);
          setIsAudioLoading(false);
          setAudioLoadError(true);
          if (activeAudioId === messageId) {
            setActiveAudioId(null);
          }
        }}
        onError={(event) => {
          const audio = event.currentTarget;
          console.error('[Audio Debug] audio error event', {
            audioId: messageId,
            src: audio.src,
            error: audio.error,
            networkState: audio.networkState,
            readyState: audio.readyState,
          });
          setIsAudioLoading(false);
          setAudioLoadError(true);
          // Clear active audio id on error
          if (activeAudioId === messageId) {
            setActiveAudioId(null);
          }
        }}
      />

      {/* Error indicator */}
      {audioLoadError && (
        <span className="text-xs text-red-400 ml-1">Audio unavailable</span>
      )}

      {/* Play/Pause Button - NOT disabled during loading to prevent stuck state */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent double toggle from waveform click
          togglePlayPause();
        }}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer hover:scale-105 ${buttonBgClass}`}
        aria-label={isPlaying ? `Pause ${isAudioFile ? 'audio' : 'voice'} message` : `Play ${isAudioFile ? 'audio' : 'voice'} message`}
      >
        {isAudioLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* Waveform and Progress - clickable to toggle play/pause */}
      <div
        className="flex-1 flex flex-col gap-1.5 min-w-0 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          togglePlayPause();
        }}
      >
        {/* Waveform Bars */}
        <div className="flex items-center gap-[3px] h-8">
          {WAVEFORM_BARS.map((height, index) => {
            const isFilled = index < filledBarsCount;
            return (
              <div
                key={index}
                className={`w-[3px] rounded-full transition-colors duration-150 ${
                  isFilled ? barColorClass : unfilledBarColorClass
                }`}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between text-xs opacity-80">
          <span className="font-mono">
            {isPlaying ? formatDuration(Math.floor(currentTime)) : formatDuration(Math.floor(audioDuration))}
          </span>
        </div>
      </div>

      {/* Icon indicator */}
      <Music className={`w-4 h-4 shrink-0 opacity-60 ${isOwnMessage ? 'text-teal-100' : 'text-teal-500'}`} />

      {/* File name for audio files */}
      {isAudioFile && fileName && (
        <div className={`text-xs opacity-75 max-w-[100px] truncate ${isOwnMessage ? 'text-teal-100' : 'text-gray-600'}`}>
          {fileName}
        </div>
      )}
    </div>
  );
}
