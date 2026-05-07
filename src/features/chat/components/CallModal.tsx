import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { Phone, Video, Mic, MicOff, Video as VideoIcon, VideoOff, Volume2, X } from 'lucide-react';
import type { Conversation } from '../types';
import { getOtherParticipant } from '../data/mockChatData';
import type { CallSession } from '../services/supabaseCallService';
import { endCall, markCallMissed } from '../services/supabaseCallService';
import {
  stopOutgoingCallWaitingSound,
  stopAllChatSounds,
} from '../utils/chatSounds';
import { useWebRTCCall } from '../hooks/useWebRTCAudioCall';

interface CallModalProps {
  conversation: Conversation;
  mode: 'voice' | 'video';
  isOpen: boolean;
  onClose: () => void;
  callSession?: CallSession | null;
  callStatus?: 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended' | null;
  isIncoming?: boolean;
  currentUserId: string | null;
}

function normalizeCall(row: any) {
  if (!row) return null;

  return {
    ...row,
    id: row.id,
    conversationId: row.conversationId ?? row.conversation_id,
    callerId: row.callerId ?? row.caller_id,
    receiverId: row.receiverId ?? row.receiver_id,
    type: row.type,
    status: row.status,
    startedAt: row.startedAt ?? row.started_at,
    answeredAt: row.answeredAt ?? row.answered_at,
    endedAt: row.endedAt ?? row.ended_at,
    createdAt: row.createdAt ?? row.created_at,
  };
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
  currentUserId,
}: CallModalProps) {
  const isGroup = conversation?.type === 'group';
  const otherUser = conversation ? getOtherParticipant(conversation) : null;

  const [state, dispatch] = useReducer(callReducer, {
    ...initialState,
    callStatus: isIncoming && externalCallStatus === 'accepted' ? 'connected' : 'calling',
  });
  const { callStatus, elapsedSeconds } = state;
  // WebRTC manages mute/speaker state separately
  const [webRTCMute, setWebRTCMute] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const noAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeAfterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const normalizedCall = normalizeCall(callSession);
  const computedCurrentUserId = currentUserId;
  const isCaller = normalizedCall?.callerId === computedCurrentUserId;
  const isReceiver = normalizedCall?.receiverId === computedCurrentUserId;
  const callRole: 'caller' | 'receiver' | null = isCaller ? 'caller' : isReceiver ? 'receiver' : null;
  const peerUserId = isCaller
    ? normalizedCall?.receiverId ?? null
    : isReceiver
      ? normalizedCall?.callerId ?? null
      : null;

  // WebRTC hook for audio/video calls
  const isAccepted = externalCallStatus === 'accepted';

  const {
    webRTCStatus,
    remoteStream,
    isMuted,
    isSpeakerOn,
    isCameraOff,
    connectionState,
    iceConnectionState,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    endCall: endWebRTCCall,
    retryMicrophone,
    continueAudioOnly,
    error: webRTCError,
    remoteAudioRef,
    localVideoRef,
    remoteVideoRef,
    isAudioOnlyFallback,
  } = useWebRTCCall({
    callId: normalizedCall?.id || null,
    callType: normalizedCall?.type === 'video' ? 'video' : 'audio',
    currentUserId: computedCurrentUserId,
    peerUserId,
    role: callRole,
    currentCall: normalizedCall,
    isAccepted,
    onError: (err) => {
      console.error('[CallModal] WebRTC error', err);
    },
  });

  // Debug WebRTC state
  useEffect(() => {
    console.log('[CallModal] WebRTC state:', {
      webRTCStatus,
      connectionState,
      iceConnectionState,
      hasRemoteStream: !!remoteStream,
      error: webRTCError?.message,
    });
  }, [webRTCStatus, connectionState, iceConnectionState, remoteStream, webRTCError]);

  // Debug logs
  console.log('[Calls UI] currentCall', callSession);
  console.log('[Calls UI] outgoing call state', {
    callId: normalizedCall?.id,
    status: normalizedCall?.status,
    type: normalizedCall?.type,
    callerId: normalizedCall?.callerId,
    receiverId: normalizedCall?.receiverId,
    currentUserId: computedCurrentUserId,
    isCaller,
    isReceiver,
    callRole,
    peerUserId,
    externalCallStatus,
    internalCallStatus: callStatus,
    isIncoming,
    mode,
  });
  console.log('[Call UI State]', {
    callStatus: normalizedCall?.status || externalCallStatus,
    webrtcStatus: webRTCStatus,
    isCaller,
    isReceiver,
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

    // End WebRTC connection
    endWebRTCCall();

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
  }, [callSession?.id, onClose, endWebRTCCall]);

  const effectiveCallStatus = externalCallStatus || normalizedCall?.status || null;

  // Start outgoing call timeout only while ringing
  useEffect(() => {
    if (!isOpen) return;

    if (!isIncoming && effectiveCallStatus === 'ringing') {
      noAnswerTimeoutRef.current = setTimeout(() => {
        handleNoAnswer();
      }, 30000);
    }

    return () => {
      if (noAnswerTimeoutRef.current) clearTimeout(noAnswerTimeoutRef.current);
      if (closeAfterTimeoutRef.current) clearTimeout(closeAfterTimeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isIncoming, effectiveCallStatus, handleNoAnswer]);

  // Handle external call status changes
  useEffect(() => {
    if (!effectiveCallStatus || !isOpen) return;

    console.log('[Calls] external status changed', effectiveCallStatus);

    switch (effectiveCallStatus) {
      case 'accepted':
        if (noAnswerTimeoutRef.current) {
          clearTimeout(noAnswerTimeoutRef.current);
          noAnswerTimeoutRef.current = null;
        }
        stopOutgoingCallWaitingSound();
        break;

      case 'rejected':
        stopOutgoingCallWaitingSound();
        endWebRTCCall();
        dispatch({ type: 'SET_STATUS', payload: 'rejected' });
        closeAfterTimeoutRef.current = setTimeout(() => {
          handleEndCall();
        }, 2000);
        break;

      case 'missed':
        stopOutgoingCallWaitingSound();
        endWebRTCCall();
        dispatch({ type: 'SET_STATUS', payload: 'not-answered' });
        closeAfterTimeoutRef.current = setTimeout(() => {
          handleEndCall();
        }, 2000);
        break;

      case 'ended':
        endWebRTCCall();
        handleEndCall();
        break;
    }
  }, [effectiveCallStatus, isOpen, handleEndCall, endWebRTCCall]);

  useEffect(() => {
    if (webRTCStatus !== 'connected') return;

    stopOutgoingCallWaitingSound();
    if (noAnswerTimeoutRef.current) {
      clearTimeout(noAnswerTimeoutRef.current);
      noAnswerTimeoutRef.current = null;
    }
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'INCREMENT_TIMER' });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [webRTCStatus]);

  // Handle simulate answer (dev-only) - kept for testing without real receiver
  const handleSimulateAnswer = useCallback(() => {
    if (noAnswerTimeoutRef.current) {
      clearTimeout(noAnswerTimeoutRef.current);
      noAnswerTimeoutRef.current = null;
    }

    stopOutgoingCallWaitingSound();
    // Don't set connected - WebRTC will do that when connected

    timerRef.current = setInterval(() => {
      dispatch({ type: 'INCREMENT_TIMER' });
    }, 1000);
  }, []);

  // Handle mute toggle - use WebRTC
  const handleToggleMute = useCallback(() => {
    toggleMute();
    setWebRTCMute(!webRTCMute);
  }, [toggleMute, webRTCMute]);

  // Handle camera toggle
  const handleToggleCamera = useCallback(() => {
    toggleCamera();
  }, [toggleCamera]);

  // Handle speaker toggle
  const handleToggleSpeaker = useCallback(() => {
    toggleSpeaker();
  }, [toggleSpeaker]);

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
    !['rejected', 'missed', 'ended'].includes(effectiveCallStatus || '') &&
    callStatus !== 'not-answered';

  const isVoice = mode === 'voice' || isAudioOnlyFallback;
  const displayName = isGroup ? conversation.name : otherUser?.name || 'Unknown';
  const avatarUrl = isGroup ? conversation.avatar : otherUser?.avatar;
  const avatarInitial = displayName?.charAt(0)?.toUpperCase() || '?';

  // Determine if this is a real Supabase call (hide Simulate Answer for real calls)
  const isRealCall = !!callSession?.id;

  // Display status based on WebRTC and call state
  const getDisplayStatus = () => {
    if (effectiveCallStatus === 'ringing') {
      return { text: 'Calling...', subtext: 'Ringing for up to 30 seconds' };
    }
    if (effectiveCallStatus === 'accepted' && webRTCStatus !== 'connected') {
      return { text: 'Connecting...', subtext: 'Waiting for peer...' };
    }
    if (webRTCStatus === 'requesting-microphone') {
      if (!isVoice) {
        return { text: 'Requesting camera...', subtext: 'Please allow camera and microphone access' };
      }
      return { text: 'Requesting microphone...', subtext: 'Please allow access' };
    }
    if (webRTCStatus === 'connecting') {
      if (!isVoice) {
        return { text: 'Connecting video...', subtext: 'Waiting for peer...' };
      }
      return { text: 'Connecting...', subtext: 'Establishing audio connection' };
    }
    if (webRTCStatus === 'connected') {
      return { text: 'Connected', subtext: isVoice ? 'Audio connected' : 'Video connected', isTimer: true };
    }
    if (webRTCStatus === 'failed') {
      return { text: isVoice ? 'Connection failed' : 'Video connection failed', subtext: 'Please try again' };
    }
    if (callStatus === 'not-answered') {
      return { text: 'No answer', subtext: `${displayName} did not answer` };
    }
    if (callStatus === 'rejected') {
      return { text: 'Call rejected', subtext: `${displayName} declined the call` };
    }
    return { text: 'Calling...', subtext: null };
  };

  const statusDisplay = getDisplayStatus();

  return (
    <div
      className={`fixed inset-0 z-[110] overflow-hidden ${isVoice ? 'flex items-center justify-center bg-black/80 backdrop-blur-md' : 'bg-black'}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${isVoice ? 'Voice' : 'Video'} call`}
    >
      {/* Hidden audio element for remote stream */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        className="hidden"
      />

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
              {effectiveCallStatus === 'ringing' && (
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
              {webRTCStatus === 'requesting-microphone' && (
                <>
                  <p className="text-amber-400">Requesting microphone...</p>
                  <p className="text-gray-500 text-xs mt-1">Please allow microphone access</p>
                  {webRTCError && (
                    <p className="text-red-400 text-xs mt-2">{webRTCError.message}</p>
                  )}
                </>
              )}
              {webRTCStatus === 'connecting' && (
                <>
                  <p className="text-teal-400">Connecting...</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {iceConnectionState === 'checking' ? 'Establishing connection...' :
                     iceConnectionState === 'connected' ? 'ICE connected' :
                     'Waiting for peer...'}
                  </p>
                </>
              )}
              {webRTCStatus === 'connected' && (
                <>
                  <p className="text-teal-400 font-mono text-lg">{formatTime(elapsedSeconds)}</p>
                  <p className="text-gray-500 text-xs mt-1">Audio connected</p>
                </>
              )}
              {webRTCStatus === 'failed' && (
                <div className="text-red-400">
                  <p className="text-lg font-medium">{isVoice ? 'Connection failed' : 'Video connection failed'}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {webRTCError?.message || 'Could not establish audio connection'}
                  </p>
                  <div className="flex gap-2 justify-center mt-3">
                    <button
                      onClick={retryMicrophone}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm text-white transition-colors"
                    >
                      Retry
                    </button>
                    {!isVoice && (
                      <button
                        onClick={continueAudioOnly}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm text-white transition-colors"
                      >
                        Continue audio only
                      </button>
                    )}
                    <button
                      onClick={handleEndCall}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
                    >
                      End Call
                    </button>
                  </div>
                </div>
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
        <div className="absolute inset-0 bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute right-4 top-4 z-20 h-36 w-28 rounded-xl border border-white/20 bg-black object-cover"
          />

          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
            <h3 className="text-white font-semibold text-lg drop-shadow-lg">{displayName}</h3>
            <p className="text-white/80 text-sm drop-shadow-lg">
              {statusDisplay.text}
              {isAudioOnlyFallback && <span className="block text-amber-300 text-xs mt-0.5">Audio only</span>}
              {statusDisplay.subtext && <span className="block text-xs text-white/60 mt-0.5">{statusDisplay.subtext}</span>}
            </p>
            {webRTCStatus === 'failed' && (
              <div className="pointer-events-auto mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={retryMicrophone}
                  className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs"
                >
                  Retry
                </button>
                <button
                  onClick={continueAudioOnly}
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                >
                  Continue audio only
                </button>
                <button
                  onClick={handleEndCall}
                  className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs"
                >
                  End Call
                </button>
              </div>
            )}
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
