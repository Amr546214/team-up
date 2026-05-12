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
  registerAudioRef?: (audioId: string, audioElement: HTMLAudioElement | null) => void;
  stopOtherAudios?: (audioId: string) => void;
  message?: any;
}

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
  registerAudioRef,
  stopOtherAudios,
  message,
}: VoiceMessageBubbleProps) {
  const isAudioFile = variant === 'audio';
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(propDuration || 0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioLoadError, setAudioLoadError] = useState(false);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioId = String(messageId || message?.id || mediaUrl);

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

    const attachments = msg.attachments || msg.files || msg.media || msg.message_attachments || [];

    const audioAttachment = attachments.find((attachment: any) => {
      const type = attachment?.type || attachment?.mime_type || attachment?.mimeType || attachment?.file_type || '';
      const url = attachment?.url || attachment?.file_url || attachment?.fileUrl || attachment?.publicUrl || attachment?.public_url || attachment?.path || '';
      return type?.startsWith('audio/') || url?.match(/\.(webm|mp3|wav|ogg|m4a)(\?.*)?$/i);
    });

    const attachmentUrl = audioAttachment?.url || audioAttachment?.file_url || audioAttachment?.fileUrl || audioAttachment?.publicUrl || audioAttachment?.public_url || audioAttachment?.path;

    if (attachmentUrl && typeof attachmentUrl === 'string' && attachmentUrl.startsWith('http')) {
      return attachmentUrl;
    }

    return null;
  };

  const resolvedAudioUrl = getAudioUrl(message) || mediaUrl;

  // Register with audio manager
  useEffect(() => {
    registerAudioRef?.(audioId, audioRef.current);
    return () => {
      registerAudioRef?.(audioId, null);
    };
  }, [audioId, registerAudioRef]);

  // Pause when another audio becomes active
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && activeAudioId && activeAudioId !== audioId && !audio.paused) {
      console.log('[Audio Final] pause because another active', { audioId, activeAudioId });
      audio.pause();
      audio.currentTime = 0;
      setIsActuallyPlaying(false);
      setIsAudioLoading(false);
    }
  }, [activeAudioId, audioId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      if (activeAudioId === audioId) {
        setActiveAudioId(null);
      }
    };
  }, [audioId, activeAudioId, setActiveAudioId]);

  // Loading safety timeout
  useEffect(() => {
    if (!isAudioLoading) return;
    const timeout = setTimeout(() => {
      setIsAudioLoading(false);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [isAudioLoading]);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;

    console.log('[Audio Final] handlePlayPause', { audioId, hasAudio: !!audio, hasUrl: !!resolvedAudioUrl });

    if (!audio || !resolvedAudioUrl) {
      console.error('[Audio Final] missing audio or URL');
      setAudioLoadError(true);
      return;
    }

    // PAUSE current audio
    if (!audio.paused) {
      console.log('[Audio Final] pausing', audioId);
      audio.pause();
      setIsActuallyPlaying(false);
      if (activeAudioId === audioId) {
        setActiveAudioId(null);
      }
      return;
    }

    // PLAY audio
    try {
      console.log('[Audio Final] starting play', audioId);
      setAudioLoadError(false);
      setIsAudioLoading(true);

      stopOtherAudios?.(audioId);
      setActiveAudioId(audioId);

      if (!audio.src || audio.src !== resolvedAudioUrl) {
        audio.src = resolvedAudioUrl;
        audio.load();
      }

      await audio.play();
      console.log('[Audio Final] play success', audioId);
    } catch (error) {
      console.error('[Audio Final] play failed', { audioId, error });
      setIsAudioLoading(false);
      setIsActuallyPlaying(false);
      setAudioLoadError(true);
      if (activeAudioId === audioId) {
        setActiveAudioId(null);
      }
    }
  }, [audioId, activeAudioId, setActiveAudioId, stopOtherAudios, resolvedAudioUrl]);

  // Progress calculation
  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  const filledBarsCount = Math.floor((progress / 100) * WAVEFORM_BARS.length);

  const barColorClass = isOwnMessage ? 'bg-teal-200' : 'bg-teal-300';
  const unfilledBarColorClass = isOwnMessage ? 'bg-teal-500/30' : 'bg-gray-300';
  const buttonBgClass = isOwnMessage ? 'bg-white text-teal-600' : 'bg-teal-500 text-white';

  if (!resolvedAudioUrl) {
    return (
      <div className="flex items-center gap-2 text-sm opacity-75">
        <Music className="w-4 h-4" />
        <span>{isAudioFile ? 'Audio unavailable' : 'Voice unavailable'}</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-3 min-w-60 max-w-[300px] select-none">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={resolvedAudioUrl}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration) {
            setAudioDuration(audioRef.current.duration);
          }
        }}
        onPlay={() => {
          console.log('[Audio Final] onPlay', audioId);
          stopOtherAudios?.(audioId);
          setActiveAudioId?.(audioId);
        }}
        onPlaying={() => {
          console.log('[Audio Final] onPlaying', audioId);
          setIsAudioLoading(false);
          setIsActuallyPlaying(true);
          setAudioLoadError(false);
        }}
        onPause={() => {
          console.log('[Audio Final] onPause', audioId);
          setIsActuallyPlaying(false);
        }}
        onEnded={() => {
          console.log('[Audio Final] onEnded', audioId);
          const audio = audioRef.current;
          if (audio) audio.currentTime = 0;
          setIsActuallyPlaying(false);
          if (activeAudioId === audioId) {
            setActiveAudioId(null);
          }
        }}
        onError={() => {
          console.error('[Audio Final] onError', audioId);
          setIsAudioLoading(false);
          setIsActuallyPlaying(false);
          setAudioLoadError(true);
          if (activeAudioId === audioId) {
            setActiveAudioId(null);
          }
        }}
      />

      {/* Error indicator */}
      {audioLoadError && (
        <span className="text-xs text-red-400 ml-1">Error</span>
      )}

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={handlePlayPause}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer hover:scale-105 ${buttonBgClass}`}
        aria-label={isActuallyPlaying ? 'Pause' : 'Play'}
      >
        {isAudioLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isActuallyPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* Waveform */}
      <div
        className="flex-1 flex flex-col gap-1.5 min-w-0 cursor-pointer"
        onClick={handlePlayPause}
      >
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

        <div className="flex items-center justify-between text-xs opacity-80">
          <span className="font-mono">
            {isActuallyPlaying ? formatDuration(Math.floor(currentTime)) : formatDuration(Math.floor(audioDuration))}
          </span>
        </div>
      </div>

      {/* Icon */}
      <Music className={`w-4 h-4 shrink-0 opacity-60 ${isOwnMessage ? 'text-teal-100' : 'text-teal-500'}`} />

      {/* File name */}
      {isAudioFile && fileName && (
        <div className={`text-xs opacity-75 max-w-[100px] truncate ${isOwnMessage ? 'text-teal-100' : 'text-gray-600'}`}>
          {fileName}
        </div>
      )}
    </div>
  );
}
