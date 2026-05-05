import { useReducer, useEffect, useRef, useCallback } from 'react';
import { Phone, Video, Mic, MicOff, Video as VideoIcon, VideoOff, Volume2, X } from 'lucide-react';
import type { Conversation } from '../types';
import { getOtherParticipant } from '../data/mockChatData';
import {
  playOutgoingCallWaitingSound,
  stopOutgoingCallWaitingSound,
  stopAllChatSounds,
} from '../utils/chatSounds';

interface CallModalProps {
  conversation: Conversation;
  mode: 'voice' | 'video';
  isOpen: boolean;
  onClose: () => void;
}

type CallStatus = 'requesting-permission' | 'calling' | 'connected' | 'not-answered' | 'permission-denied' | 'unsupported' | 'ended';

type CallAction =
  | { type: 'SET_STATUS'; payload: CallStatus }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_STREAM'; payload: MediaStream | null }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_CAMERA_OFF'; payload: boolean }
  | { type: 'SET_SPEAKER_ON'; payload: boolean }
  | { type: 'INCREMENT_TIMER' }
  | { type: 'RESET_CALL' };

interface CallState {
  callStatus: CallStatus;
  localStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  elapsedSeconds: number;
  errorMessage: string;
}

const initialState: CallState = {
  callStatus: 'requesting-permission',
  localStream: null,
  isMuted: false,
  isCameraOff: false,
  isSpeakerOn: true,
  elapsedSeconds: 0,
  errorMessage: '',
};

function callReducer(state: CallState, action: CallAction): CallState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, callStatus: action.payload };
    case 'SET_ERROR':
      return { ...state, errorMessage: action.payload };
    case 'SET_STREAM':
      return { ...state, localStream: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_CAMERA_OFF':
      return { ...state, isCameraOff: action.payload };
    case 'SET_SPEAKER_ON':
      return { ...state, isSpeakerOn: action.payload };
    case 'INCREMENT_TIMER':
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };
    case 'RESET_CALL':
      return initialState;
    default:
      return state;
  }
}

export function CallModal({ conversation, mode, isOpen, onClose }: CallModalProps) {
  const isGroup = conversation.type === 'group';
  const otherUser = getOtherParticipant(conversation);

  const [state, dispatch] = useReducer(callReducer, initialState);
  const { callStatus, localStream, isMuted, isCameraOff, isSpeakerOn, elapsedSeconds, errorMessage } = state;

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const noAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeAfterNoAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Request media permissions
  useEffect(() => {
    if (!isOpen) return;

    // Check if media devices are supported
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      dispatch({ type: 'SET_STATUS', payload: 'unsupported' });
      dispatch({ type: 'SET_ERROR', payload: `${mode === 'voice' ? 'Voice' : 'Video'} calls are not supported in this browser` });
      return;
    }

    const requestMedia = async () => {
      try {
        dispatch({ type: 'SET_STATUS', payload: 'requesting-permission' });

        const constraints: MediaStreamConstraints = {
          audio: true,
          video: mode === 'video',
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        dispatch({ type: 'SET_STREAM', payload: stream });
        dispatch({ type: 'SET_STATUS', payload: 'calling' });
        playOutgoingCallWaitingSound();

        // 30-second no-answer timeout
        noAnswerTimeoutRef.current = setTimeout(() => {
          handleNoAnswer();
        }, 30000);
      } catch (err) {
        console.error('[Call] Permission denied:', err);
        stopOutgoingCallWaitingSound();
        dispatch({ type: 'SET_STATUS', payload: 'permission-denied' });
        dispatch({
          type: 'SET_ERROR',
          payload: mode === 'voice'
            ? 'Microphone permission denied'
            : 'Camera or microphone permission denied',
        });
      }
    };

    requestMedia();

    return () => {
      // Cleanup
      if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current);
      if (closeAfterNoAnswerTimeoutRef.current) clearTimeout(closeAfterNoAnswerTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, mode]);

  // Set video source when stream changes or camera is toggled back on
  useEffect(() => {
    if (!videoRef.current || !localStream || mode !== 'video') return;

    // Always ensure srcObject is set
    if (videoRef.current.srcObject !== localStream) {
      videoRef.current.srcObject = localStream;
    }

    // Try to play when camera is turned back on
    if (!isCameraOff) {
      videoRef.current.play().catch((err) => {
        console.warn('[VideoCall] video play failed', err);
      });
    }
  }, [localStream, mode, isCameraOff]);

  // Handle no answer (30s timeout)
  const handleNoAnswer = useCallback(() => {
    stopOutgoingCallWaitingSound();

    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Clear any existing timers
    if (timerRef.current) clearInterval(timerRef.current);

    // Set status to not-answered
    dispatch({ type: 'SET_STATUS', payload: 'not-answered' });

    // Auto-close modal after 2 seconds
    closeAfterNoAnswerTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'RESET_CALL' });
      onClose();
    }, 2000);
  }, [localStream, onClose]);

  // Handle simulate answer (dev-only)
  const handleSimulateAnswer = useCallback(() => {
    // Clear the no-answer timeout
    if (noAnswerTimeoutRef.current) {
      clearTimeout(noAnswerTimeoutRef.current);
      noAnswerTimeoutRef.current = null;
    }

    stopOutgoingCallWaitingSound();
    dispatch({ type: 'SET_STATUS', payload: 'connected' });

    // Start call timer
    timerRef.current = setInterval(() => {
      dispatch({ type: 'INCREMENT_TIMER' });
    }, 1000);
  }, []);

  // Handle end call
  const handleEndCall = useCallback(() => {
    // Stop outgoing call waiting sound
    stopOutgoingCallWaitingSound();

    // Clear all timers
    if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current);
    if (closeAfterNoAnswerTimeoutRef.current) clearTimeout(closeAfterNoAnswerTimeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Reset state
    dispatch({ type: 'RESET_CALL' });

    // Close modal
    onClose();
  }, [localStream, onClose]);

  // Handle mute toggle
  const handleToggleMute = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      dispatch({ type: 'SET_MUTED', payload: !isMuted });
    }
  }, [localStream, isMuted]);

  // Handle camera toggle
  const handleToggleCamera = useCallback(() => {
    if (!localStream) {
      console.warn('[VideoCall] no localStream available');
      return;
    }

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.warn('[VideoCall] no video tracks found');
      return;
    }

    const nextCameraOff = !isCameraOff;

    console.log('[VideoCall] camera toggle', {
      nextCameraOff,
      videoTracks: videoTracks.length,
      trackStates: videoTracks.map(t => ({
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted
      }))
    });

    // Check if any track is ended - if so, we need to re-request media
    const hasEndedTrack = videoTracks.some(t => t.readyState === 'ended');
    if (hasEndedTrack && !nextCameraOff) {
      console.warn('[VideoCall] video track is ended, cannot resume. Re-request media needed.');
      // For now, just show a warning - the track is dead
      alert('Camera track was stopped. Please end the call and start a new video call.');
      return;
    }

    // Toggle track enabled state
    videoTracks.forEach((track) => {
      track.enabled = !nextCameraOff;
    });

    dispatch({ type: 'SET_CAMERA_OFF', payload: nextCameraOff });

    // If turning camera back on, reattach and play
    if (!nextCameraOff && videoRef.current) {
      console.log('[VideoCall] attempting to resume video preview');
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch((err) => {
        console.warn('[VideoCall] video play failed after toggle', err);
      });
    }
  }, [localStream, isCameraOff, mode]);

  // Handle speaker toggle (UI mock)
  const handleToggleSpeaker = useCallback(() => {
    dispatch({ type: 'SET_SPEAKER_ON', payload: !isSpeakerOn });
  }, [isSpeakerOn]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleEndCall();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleEndCall]);

  // Body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      console.log('[VideoCall] modal open', isOpen);

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Cleanup on unmount - empty deps array so it only runs on unmount
  useEffect(() => {
    return () => {
      // Stop all chat sounds
      stopAllChatSounds();

      // Clear all timers
      if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current);
      if (closeAfterNoAnswerTimeoutRef.current) clearTimeout(closeAfterNoAnswerTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  // Controls visibility for active call states
  const showActiveControls =
    callStatus === 'requesting-permission' ||
    callStatus === 'calling' ||
    callStatus === 'connected';

  console.log('[VideoCall] controls rendered', callStatus, 'showActiveControls:', showActiveControls);

  const isVoice = mode === 'voice';
  const displayName = isGroup ? conversation.name : otherUser?.name;
  const avatarUrl = isGroup ? conversation.avatar : otherUser?.avatar;
  const avatarInitial = displayName?.charAt(0).toUpperCase();

  return (
    <div
      className={`fixed inset-0 z-[110] overflow-hidden ${isVoice ? 'flex items-center justify-center bg-black/80 backdrop-blur-md' : 'bg-black'}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${isVoice ? 'Voice' : 'Video'} call`}
    >
      {isVoice ? (
        // Voice Call UI
        <div className="w-full max-w-[400px] mx-4">
          <div className="bg-gray-900/90 rounded-3xl p-8 text-white shadow-2xl">
            {/* Avatar and Info */}
            <div className="text-center mb-8">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-4 ${
                isGroup
                  ? 'bg-linear-to-br from-indigo-500 to-indigo-600'
                  : 'bg-linear-to-br from-teal-500 to-teal-600'
              }`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  avatarInitial
                )}
              </div>
              <h3 className="text-xl font-semibold mb-1">{displayName}</h3>
              <p className="text-gray-400 text-sm">
                {isGroup ? `${conversation.membersCount || conversation.participants.length} members` : otherUser?.role}
              </p>
            </div>

            {/* Status */}
            <div className="text-center mb-8">
              {callStatus === 'requesting-permission' && (
                <p className="text-gray-400">Requesting microphone...</p>
              )}
              {callStatus === 'calling' && (
                <>
                  <p className="text-gray-400">Calling...</p>
                  <p className="text-gray-500 text-xs mt-1">Ringing for up to 30 seconds</p>
                  {/* Dev-only Simulate Answer button */}
                  {process.env.NODE_ENV !== 'production' && (
                    <button
                      onClick={handleSimulateAnswer}
                      className="mt-3 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 rounded text-xs text-white transition-colors"
                    >
                      Simulate Answer
                    </button>
                  )}
                </>
              )}
              {callStatus === 'connected' && (
                <p className="text-teal-400 font-mono text-lg">{formatTime(elapsedSeconds)}</p>
              )}
              {callStatus === 'not-answered' && (
                <div className="text-amber-400">
                  <p className="text-lg font-medium">No answer</p>
                  <p className="text-sm text-gray-400 mt-1">{displayName} did not answer</p>
                  <p className="text-xs text-gray-500 mt-2">Call ended</p>
                </div>
              )}
              {(callStatus === 'permission-denied' || callStatus === 'unsupported') && (
                <div className="text-red-400">
                  <p>{errorMessage}</p>
                  <button
                    onClick={handleEndCall}
                    className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            {callStatus !== 'permission-denied' && callStatus !== 'unsupported' && callStatus !== 'not-answered' && (
              <div className="flex items-center justify-center gap-6">
                {/* Mute */}
                <button
                  onClick={handleToggleMute}
                  className={`p-4 rounded-full transition-colors ${
                    isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700/50 text-white hover:bg-gray-700'
                  }`}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* Speaker (mock) */}
                <button
                  onClick={handleToggleSpeaker}
                  className={`p-4 rounded-full transition-colors ${
                    isSpeakerOn ? 'bg-gray-700/50 text-white hover:bg-gray-700' : 'bg-gray-700/30 text-gray-400'
                  }`}
                  aria-label={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
                >
                  <Volume2 className="w-6 h-6" />
                </button>

                {/* End Call */}
                <button
                  onClick={handleEndCall}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                  aria-label="End call"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Video Call UI - Viewport-based layout with fixed controls
        <div className="absolute inset-0 bg-black">
          {/* Video Layer */}
          <div className="absolute inset-0 z-0">
            {callStatus !== 'permission-denied' && callStatus !== 'unsupported' && callStatus !== 'not-answered' ? (
              <>
                {/* Video element - always mounted when stream exists */}
                {localStream && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 h-full w-full object-cover ${isCameraOff ? 'opacity-0' : 'opacity-100'}`}
                  />
                )}

                {/* Placeholder overlay when camera is off */}
                {isCameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold ${
                      isGroup
                        ? 'bg-linear-to-br from-indigo-500 to-indigo-600'
                        : 'bg-linear-to-br from-teal-500 to-teal-600'
                    } text-white`}>
                      {avatarInitial}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Error / Not Answered State
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  {callStatus === 'not-answered' ? (
                    <>
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Phone className="w-10 h-10 text-amber-400" />
                      </div>
                      <p className="text-xl font-medium text-amber-400 mb-1">No answer</p>
                      <p className="text-sm text-gray-400 mb-4">{displayName} did not answer</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <VideoOff className="w-10 h-10 text-red-400" />
                      </div>
                      <p className="text-red-400 mb-4">{errorMessage}</p>
                    </>
                  )}
                  <button
                    onClick={handleEndCall}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Overlay - Top */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
            <h3 className="text-white font-semibold text-lg drop-shadow-lg">{displayName}</h3>
            <p className="text-white/80 text-sm drop-shadow-lg">
              {callStatus === 'requesting-permission' && 'Requesting camera...'}
              {callStatus === 'calling' && (
                <span className="pointer-events-auto inline-block">
                  Calling...
                  <span className="block text-xs text-white/60 mt-0.5">Ringing for up to 30 seconds</span>
                  {/* Dev-only Simulate Answer button */}
                  {process.env.NODE_ENV !== 'production' && (
                    <button
                      onClick={handleSimulateAnswer}
                      className="mt-2 px-2 py-1 bg-teal-600/80 hover:bg-teal-500/80 rounded text-xs text-white transition-colors"
                    >
                      Simulate Answer
                    </button>
                  )}
                </span>
              )}
              {callStatus === 'connected' && (
                <span className="text-teal-400 font-mono">{formatTime(elapsedSeconds)}</span>
              )}
              {callStatus === 'not-answered' && (
                <span className="text-amber-400">No answer</span>
              )}
            </p>
          </div>

          {/* Controls - Fixed to viewport bottom */}
          {showActiveControls && (
            <div
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130] flex items-center justify-center gap-6 pointer-events-auto"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Mute */}
              <button
                onClick={handleToggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700/50 text-white hover:bg-gray-700'
                }`}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* Camera */}
              <button
                onClick={handleToggleCamera}
                className={`p-4 rounded-full transition-colors ${
                  isCameraOff ? 'bg-red-500/20 text-red-400' : 'bg-gray-700/50 text-white hover:bg-gray-700'
                }`}
                aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isCameraOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
              </button>

              {/* Speaker (mock) */}
              <button
                onClick={handleToggleSpeaker}
                className={`p-4 rounded-full transition-colors ${
                  isSpeakerOn ? 'bg-gray-700/50 text-white hover:bg-gray-700' : 'bg-gray-700/30 text-gray-400'
                }`}
                aria-label={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
              >
                <Volume2 className="w-6 h-6" />
              </button>

              {/* End Call */}
              <button
                onClick={handleEndCall}
                className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                aria-label="End call"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
