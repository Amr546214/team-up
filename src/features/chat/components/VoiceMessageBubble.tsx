import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { formatDuration } from '../utils/fileFormat';

interface VoiceMessageBubbleProps {
  mediaUrl: string;
  duration?: number;
  isOwnMessage: boolean;
  fileName?: string;
  variant?: 'voice' | 'audio';
}

// Stable fake waveform bar heights (prevents jitter on re-renders)
const WAVEFORM_BARS = [8, 14, 10, 18, 12, 22, 16, 10, 20, 14, 8, 18, 12, 16, 10, 22, 14, 8, 16, 12];

export function VoiceMessageBubble({
  mediaUrl,
  duration: propDuration,
  isOwnMessage,
  fileName,
  variant = 'voice',
}: VoiceMessageBubbleProps) {
  const isAudioFile = variant === 'audio';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(propDuration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {
        // Handle play error silently
      });
      setIsPlaying(true);
    }
  }, [isPlaying]);

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

  if (!mediaUrl) {
    return (
      <div className="flex items-center gap-2 text-sm opacity-75">
        <Music className="w-4 h-4" />
        <span>{isAudioFile ? 'Audio file unavailable' : 'Voice message unavailable'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-[240px] max-w-[300px]">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={mediaUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${buttonBgClass}`}
        aria-label={isPlaying ? `Pause ${isAudioFile ? 'audio' : 'voice'} message` : `Play ${isAudioFile ? 'audio' : 'voice'} message`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* Waveform and Progress */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
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
