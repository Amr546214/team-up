import { useReducer, useEffect, useRef, useCallback } from 'react';
import { Phone, Video, Mic, MicOff, Video as VideoIcon, VideoOff, Volume2, X } from 'lucide-react';
import type { Conversation } from '../types';
import { getOtherParticipant } from '../data/mockChatData';
import type { CallSession } from '../services/supabaseCallService';
import { endCall, markCallMissed } from '../services/supabaseCallService';
import {
  stopOutgoingCallWaitingSound,
  stopAllChatSounds,
} from '../utils/chatSounds';

interface CallModalProps {
  conversation: Conversation;
  mode: 'voice' | 'video';
  isOpen: boolean;
  onClose: () => void;
  callSession?: CallSession | null;
  callStatus?: 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended' | null;
  isIncoming?: boolean;
}

type UICallStatus = 'calling' | 'connected' | 'not-answered' | 'rejected' | 'ended';

type CallAction =
  | { type: 'SET_STATUS'; payload: UICallStatus }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_CAMERA_OFF'; payload: boolean }
  | { type: 'SET_SPEAKER_ON'; payload: boolean }
  | { type: 'INCREMENT_TIMER' }
  | { type: 'RESET_CALL' };

interface CallState {
  callStatus: UICallStatus;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  elapsedSeconds: number;
}

const initialState: CallState = {
  callStatus: 'calling',
  isMuted: false,
  isCameraOff: false,
  isSpeakerOn: true,
  elapsedSeconds: 0,
};

function callReducer(state: CallState, action: CallAction): CallState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, callStatus: action.payload };
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


export function CallModal({
  conversation,
  mode,
  isOpen,
  onClose,
  callSession = null,
  callStatus: externalCallStatus = null,
  isIncoming = false,
}: CallModalProps) {
  const isGroup = conversation?.type === 'group';
  const otherUser = conversation ? getOtherParticipant(conversation) : null;

  const [state, dispatch] = useReducer(callReducer, {
    ...initialState,
    callStatus: isIncoming && externalCallStatus === 'accepted' ? 'connected' : 'calling',
  });
  const { callStatus, isMuted, isCameraOff, isSpeakerOn, elapsedSeconds } = state;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const noAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeAfterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logs
  console.log('[Calls UI] currentCall', callSession);
  console.log('[Calls UI] outgoing call state', {
    callId: callSession?.id,
    status: callSession?.status,
    type: callSession?.type,
    callerId: callSession?.caller_id,
    receiverId: callSession?.receiver_id,
    externalCallStatus,
    internalCallStatus: callStatus,
    isIncoming,
    mode,
  });

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Handle no answer (30s timeout)
  const handleNoAnswer = useCallback(async () => {
    console.log('[Calls] no answer timeout');
    stopOutgoingCallWaitingSound();

    // Clear any existing timers
    if (timerRef.current) clearInterval(timerRef.current);

    // Mark call as missed in Supabase
    if (callSession?.id) {
      await markCallMissed(callSession.id).catch((err) => {
        console.error('[Calls] markCallMissed failed', err);
      });
    }

    // Set status to not-answered
    dispatch({ type: 'SET_STATUS', payload: 'not-answered' });

    // Auto-close modal after 2 seconds
    closeAfterTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'RESET_CALL' });
      onClose();
    }, 2000);
  }, [callSession?.id, onClose]);

  // Handle end call
  const handleEndCall = useCallback(async () => {
    console.log('[Calls] ending call');
    
    // Stop sounds safely
    stopOutgoingCallWaitingSound();

    // Clear all timers
    if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current);
    if (closeAfterTimeoutRef.current) clearTimeout(closeAfterTimeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // End call in Supabase
    if (callSession?.id) {
      await endCall(callSession.id).catch((err) => {
        console.error('[Calls] endCall failed', err);
      });
    }

    // Reset state
    dispatch({ type: 'RESET_CALL' });

    // Close modal
    onClose();
  }, [callSession?.id, onClose]);

  // Start outgoing call - Phase 1: no WebRTC, just signaling
  useEffect(() => {
    if (!isOpen) return;

    // For incoming calls that are already accepted, just start timer
    if (isIncoming && externalCallStatus === 'accepted') {
      dispatch({ type: 'SET_STATUS', payload: 'connected' });
      timerRef.current = setInterval(() => {
        dispatch({ type: 'INCREMENT_TIMER' });
      }, 1000);
      return;
    }

    // For outgoing calls — sound is played from click handler (user gesture)
    // Here we only set up the 30-second no-answer timeout
    if (!isIncoming) {
      noAnswerTimeoutRef.current = setTimeout(() => {
        handleNoAnswer();
      }, 30000);
    }

    return () => {
      if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current);
      if (closeAfterTimeoutRef.current) clearTimeout(closeAfterTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isIncoming, externalCallStatus, handleNoAnswer]);

  // Handle external call status changes
  useEffect(() => {
    if (!externalCallStatus || !isOpen) return;

    console.log('[Calls] external status changed', externalCallStatus);

    switch (externalCallStatus) {
      case 'accepted':
        if (noAnswerTimeoutRef.current) {
          clearTimeout(noAnswerTimeoutRef.current);
          noAnswerTimeoutRef.current = null;
        }
        stopOutgoingCallWaitingSound();
        dispatch({ type: 'SET_STATUS', payload: 'connected' });
        timerRef.current = setInterval(() => {
          dispatch({ type: 'INCREMENT_TIMER' });
        }, 1000);
        break;

      case 'rejected':
        stopOutgoingCallWaitingSound();
        dispatch({ type: 'SET_STATUS', payload: 'rejected' });
        closeAfterTimeoutRef.current = setTimeout(() => {
          handleEndCall();
        }, 2000);
        break;

      case 'missed':
        stopOutgoingCallWaitingSound();
        dispatch({ type: 'SET_STATUS', payload: 'not-answered' });
        closeAfterTimeoutRef.current = setTimeout(() => {
          handleEndCall();
        }, 2000);
        break;

      case 'ended':
        handleEndCall();
        break;
    }
  }, [externalCallStatus, isOpen, handleEndCall]);

  // Handle simulate answer (dev-only) - kept for testing without real receiver
  const handleSimulateAnswer = useCallback(() => {
    if (noAnswerTimeoutRef.current) {
      clearTimeout(noAnswerTimeoutRef.current);
      noAnswerTimeoutRef.current = null;
    }

    stopOutgoingCallWaitingSound();
    dispatch({ type: 'SET_STATUS', payload: 'connected' });

    timerRef.current = setInterval(() => {
      dispatch({ type: 'INCREMENT_TIMER' });
    }, 1000);
  }, []);

  // Handle mute toggle - Phase 1: UI only, no actual media
  const handleToggleMute = useCallback(() => {
    dispatch({ type: 'SET_MUTED', payload: !isMuted });
  }, [isMuted]);

  // Handle camera toggle - Phase 1: UI only, no actual media
  const handleToggleCamera = useCallback(() => {
    dispatch({ type: 'SET_CAMERA_OFF', payload: !isCameraOff });
  }, [isCameraOff]);

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

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllChatSounds();

      if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current);
      if (closeAfterTimeoutRef.current) clearTimeout(closeAfterTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen || !conversation) return null;

  // Controls visibility for active call states
  const showActiveControls =
    callStatus === 'calling' ||
    callStatus === 'connected';

  const isVoice = mode === 'voice';
  const displayName = isGroup ? conversation.name : otherUser?.name || 'Unknown';
  const avatarUrl = isGroup ? conversation.avatar : otherUser?.avatar;
  const avatarInitial = displayName?.charAt(0)?.toUpperCase() || '?';

  // Determine if this is a real Supabase call (hide Simulate Answer for real calls)
  const isRealCall = !!callSession?.id;

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
                {isGroup ? `${conversation.membersCount || conversation.participants?.length || 0} members` : otherUser?.role}
              </p>
            </div>

            {/* Status */}
            <div className="text-center mb-8">
              {callStatus === 'calling' && (
                <>
                  <p className="text-gray-400">Calling...</p>
                  <p className="text-gray-500 text-xs mt-1">Ringing for up to 30 seconds</p>
                  {/* Dev-only Simulate Answer button - hidden for real Supabase calls */}
                  {!isRealCall && process.env.NODE_ENV !== 'production' && (
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
              {callStatus === 'rejected' && (
                <div className="text-red-400">
                  <p className="text-lg font-medium">Call rejected</p>
                  <p className="text-sm text-gray-400 mt-1">{displayName} declined the call</p>
                </div>
              )}
            </div>

            {/* Controls */}
            {callStatus !== 'rejected' && callStatus !== 'not-answered' && (
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
        // Video Call UI - Phase 1: no real video, avatar placeholder with controls
        <div className="absolute inset-0 bg-black">
          {/* Placeholder Video Layer */}
          <div className="absolute inset-0 z-0">
            {callStatus !== 'not-answered' && callStatus !== 'rejected' ? (
              // Phase 1: show avatar placeholder instead of video
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold ${
                  isGroup
                    ? 'bg-linear-to-br from-indigo-500 to-indigo-600'
                    : 'bg-linear-to-br from-teal-500 to-teal-600'
                } text-white`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    avatarInitial
                  )}
                </div>
              </div>
            ) : (
              // Not Answered / Rejected State
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
                      <p className="text-red-400 mb-1 text-lg font-medium">Call rejected</p>
                      <p className="text-sm text-gray-400 mb-4">{displayName} declined the call</p>
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
              {callStatus === 'calling' && (
                <span className="pointer-events-auto inline-block">
                  Calling...
                  <span className="block text-xs text-white/60 mt-0.5">Ringing for up to 30 seconds</span>
                  {/* Dev-only Simulate Answer button - hidden for real calls */}
                  {!isRealCall && process.env.NODE_ENV !== 'production' && (
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
              {callStatus === 'rejected' && (
                <span className="text-red-400">Call rejected</span>
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
