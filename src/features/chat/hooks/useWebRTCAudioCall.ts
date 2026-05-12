import { useRef, useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { CallSignal } from '../services/supabaseCallSignals';
import { insertCallSignal, subscribeToCallSignals, unsubscribeFromCallSignals, getCallSignals } from '../services/supabaseCallSignals';
import { stopOutgoingCallWaitingSound } from '../utils/chatSounds';

export type WebRTCStatus =
  | 'idle'
  | 'requesting-microphone'
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'connection_failed'
  | 'ended';

interface UseWebRTCAudioCallOptions {
  callId: string | null;
  callType: 'audio' | 'video';
  currentUserId: string | null;
  peerUserId: string | null;
  role: 'caller' | 'receiver' | null;
  currentCall: unknown;
  isAccepted: boolean;
  onError?: (error: Error) => void;
}

// Connection timeout in milliseconds (30 seconds)
const CONNECTION_TIMEOUT = 30000;

interface UseWebRTCAudioCallReturn {
  webRTCStatus: WebRTCStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteHasVideo: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  connectionState: RTCPeerConnectionState | null;
  iceConnectionState: RTCIceConnectionState | null;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  endCall: () => void;
  retryMicrophone: () => void;
  continueAudioOnly: () => void;
  retryCamera: () => Promise<void>;
  error: Error | null;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOff: boolean;
  isCameraUnavailable: boolean;
  isAudioOnlyFallback: boolean;
}

const MICROPHONE_TIMEOUT = 8000; // 8 seconds

export function useWebRTCAudioCall(
  options: UseWebRTCAudioCallOptions
): UseWebRTCAudioCallReturn {
  const { callId, isAccepted } = options;

  // ============================================================================
  // OPTIONS REF - Read current options inside callbacks without re-triggering effects
  // ============================================================================
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // ============================================================================
  // REFS - Mutable state that must NOT trigger re-renders or effect re-runs
  // ============================================================================

  // WebRTC objects
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const signalsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const micTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousCallIdRef = useRef<string | null>(null);
  const connectingDebugTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callerCreatedOfferRef = useRef(false);
  const receiverReceivedOfferRef = useRef(false);
  const receiverCreatedAnswerRef = useRef(false);
  const callerReceivedAnswerRef = useRef(false);
  const remoteTrackArrivedRef = useRef(false);
  const forceAudioOnlyRef = useRef(false);

  // Current call ID tracking - CRITICAL for filtering signals
  const currentCallIdRef = useRef<string | null>(null);

  // ICE candidate queue - for candidates received before remoteDescription is set
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // HARD GUARDS - These prevent duplicate initialization
  const initStartedCallIdsRef = useRef<Set<string>>(new Set());
  const isInitializingRef = useRef(false);
  const activeCallIdRef = useRef<string | null>(null);

  // Offer/answer guards
  const hasCreatedOfferRef = useRef<boolean>(false);
  const hasCreatedAnswerRef = useRef<boolean>(false);
  const isCreatingOfferRef = useRef<boolean>(false);

  // Signal processing guards - track processed signal IDs to prevent duplicates
  const processedSignalsRef = useRef<Set<string>>(new Set());

  // ============================================================================
  // STATE - Only UI-relevant state
  // ============================================================================

  const [webRTCStatus, setWebRTCStatus] = useState<WebRTCStatus>('idle');
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isCameraUnavailable, setIsCameraUnavailable] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [isAudioOnlyFallback, setIsAudioOnlyFallback] = useState(false);

  // ============================================================================
  // CLEANUP - Clears all WebRTC resources. Only called on end/reject/miss/unmount.
  // ============================================================================

  const cleanupWebRTC = useCallback((reason: string) => {
    console.log('[CALL] cleanup started', { reason, callId: currentCallIdRef.current });

    // Clear all timeouts
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (connectingDebugTimeoutRef.current) {
      clearTimeout(connectingDebugTimeoutRef.current);
      connectingDebugTimeoutRef.current = null;
    }

    // Stop local tracks
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log('[MEDIA] stopping local tracks', { trackCount: tracks.length });
      tracks.forEach((track) => {
        track.stop();
        console.log('[MEDIA] stopping local track', { kind: track.kind, id: track.id });
      });
      localStreamRef.current = null;
      console.log('[MEDIA] local tracks stopped');
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      const pc = peerConnectionRef.current;
      console.log('[CALL] closing peer connection', { 
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState 
      });
      pc.close();
      peerConnectionRef.current = null;
      console.log('[CALL] peer connection closed');
    }

    // Clear remote stream
    remoteStreamRef.current = null;

    // Unsubscribe from signals
    if (signalsChannelRef.current) {
      console.log('[CALL] unsubscribing from signals');
      unsubscribeFromCallSignals(signalsChannelRef.current);
      signalsChannelRef.current = null;
    }

    // Clear video/audio elements
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      console.log('[MEDIA] video srcObject cleared (remoteAudio)');
      remoteAudioRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.pause();
      console.log('[MEDIA] video srcObject cleared (localVideo)');
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.pause();
      console.log('[MEDIA] video srcObject cleared (remoteVideo)');
    }

    // Clear ICE candidate queue
    const queuedCount = pendingIceCandidatesRef.current.length;
    pendingIceCandidatesRef.current = [];
    console.log('[CALL] cleared ICE candidate queue', { queuedCount });

    // Reset ALL guards and refs
    const clearedCallId = currentCallIdRef.current;
    currentCallIdRef.current = null;
    initStartedCallIdsRef.current.clear();
    isInitializingRef.current = false;
    activeCallIdRef.current = null;
    hasCreatedOfferRef.current = false;
    hasCreatedAnswerRef.current = false;
    isCreatingOfferRef.current = false;
    processedSignalsRef.current.clear();
    callerCreatedOfferRef.current = false;
    receiverReceivedOfferRef.current = false;
    receiverCreatedAnswerRef.current = false;
    callerReceivedAnswerRef.current = false;
    remoteTrackArrivedRef.current = false;

    console.log('[CALL] cleanup completed', { 
      clearedCallId,
      reason 
    });

    // Clear state
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteHasVideo(false);
    setConnectionState(null);
    setIceConnectionState(null);
    if (reason !== 'call-accepted-for-new-call') {
      setWebRTCStatus('ended');
    }
    setIsCameraOff(false);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsAudioOnlyFallback(false);
    forceAudioOnlyRef.current = false;
  }, []);

  // ============================================================================
  // FLUSH PENDING ICE CANDIDATES - Called after remoteDescription is set
  // ============================================================================
  const flushPendingIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queue = pendingIceCandidatesRef.current;
    if (queue.length === 0) return;

    console.log('[CALL] flushing pending ICE candidates', { count: queue.length });
    
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[CALL] ICE candidate added from queue');
      } catch (err) {
        console.error('[CALL] failed to add ICE candidate from queue', err);
      }
    }
    
    pendingIceCandidatesRef.current = [];
    console.log('[CALL] ICE candidate queue cleared');
  }, []);

  // ============================================================================
  // SIGNAL HANDLER - Processes incoming WebRTC signals (offer/answer/ICE)
  // CRITICAL: Filters signals by callId to prevent cross-call contamination
  // ============================================================================
  const handleSignal = useCallback(async (signal: CallSignal) => {
    const currentCallId = currentCallIdRef.current;
    const opts = optionsRef.current;
    const rolePrefix = opts.role?.toUpperCase() || 'UNKNOWN';
    
    // CRITICAL: Filter signals by call_id - ignore signals for other calls
    if (signal.call_id !== currentCallId) {
      console.log(`[${rolePrefix}] signal filtered - wrong callId`, { 
        signalCallId: signal.call_id, 
        currentCallId,
        type: signal.type 
      });
      return;
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      console.log(`[${rolePrefix}] signal ignored - no peer connection`, { type: signal.type });
      return;
    }

    // Dedup by signal ID
    if (processedSignalsRef.current.has(signal.id)) {
      console.log(`[${rolePrefix}] duplicate signal ignored`, { signalId: signal.id, type: signal.type });
      return;
    }
    processedSignalsRef.current.add(signal.id);

    try {
      // Determine role for logging
      const isSignalFromCaller = signal.sender_id === opts.peerUserId && opts.role === 'receiver';
      const isSignalFromReceiver = signal.sender_id === opts.peerUserId && opts.role === 'caller';
      
      if (signal.type === 'offer') {
        console.log(`[RECEIVER] incoming offer received`, { callId: currentCallId, signalId: signal.id, from: signal.sender_id });
        receiverReceivedOfferRef.current = true;
        
        if (hasCreatedAnswerRef.current) {
          console.warn(`[RECEIVER] duplicate offer ignored - already created answer`);
          return;
        }
        if (pc.remoteDescription) {
          console.log(`[RECEIVER] offer ignored - already have remote description`);
          return;
        }

        console.log(`[RECEIVER] setRemoteDescription(offer)...`);
        await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        console.log(`[RECEIVER] setRemoteDescription(offer) done`);

        // Flush any pending ICE candidates now that remoteDescription is set
        await flushPendingIceCandidates(pc);

        console.log(`[RECEIVER] creating answer...`);
        const answer = await pc.createAnswer();
        console.log(`[RECEIVER] answer created`);
        await pc.setLocalDescription(answer);
        console.log(`[RECEIVER] setLocalDescription(answer) done`);

        if (currentCallId && opts.currentUserId && opts.peerUserId) {
          console.log(`[RECEIVER] saving answer with callId: ${currentCallId}`);
          const { success } = await insertCallSignal({
            callId: currentCallId,
            senderId: opts.currentUserId,
            receiverId: opts.peerUserId,
            type: 'answer',
            payload: answer,
          });
          if (success) {
            hasCreatedAnswerRef.current = true;
            receiverCreatedAnswerRef.current = true;
            console.log(`[RECEIVER] answer saved/sent`);
          }
        }
        setWebRTCStatus('connecting');

      } else if (signal.type === 'answer') {
        console.log(`[CALLER] answer received`, { callId: currentCallId, signalId: signal.id, from: signal.sender_id });
        callerReceivedAnswerRef.current = true;
        
        if (pc.remoteDescription) {
          console.log(`[CALLER] answer ignored - already have remote description`);
          return;
        }

        console.log(`[CALLER] setRemoteDescription(answer)...`);
        await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        console.log(`[CALLER] setRemoteDescription(answer) done`);
        
        // Flush any pending ICE candidates now that remoteDescription is set
        await flushPendingIceCandidates(pc);
        
        setWebRTCStatus('connecting');

      } else if (signal.type === 'ice-candidate') {
        const candidate = signal.payload as RTCIceCandidateInit;
        
        // Check if remoteDescription is set before adding ICE candidate
        if (!pc.remoteDescription) {
          console.log(`[${rolePrefix}] ICE candidate queued (remoteDescription not ready)`, { 
            callId: currentCallId,
            queueLength: pendingIceCandidatesRef.current.length + 1
          });
          pendingIceCandidatesRef.current.push(candidate);
          return;
        }
        
        console.log(`[${rolePrefix}] ICE candidate received from peer, adding...`);
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log(`[${rolePrefix}] ICE candidate added successfully`);
        } catch (err) {
          console.error(`[${rolePrefix}] failed to add ICE candidate`, err);
        }
      }
    } catch (err) {
      console.error('[WebRTC] HANDLE SIGNAL FAILED', err);
    }
  }, [flushPendingIceCandidates]);

  const initWebRTC = useCallback(async (nextCallId: string, role: 'caller' | 'receiver') => {
    if (!nextCallId) return;

    console.log(`[${role.toUpperCase()}] init started`, {
      callId: nextCallId,
      currentUser: optionsRef.current.currentUserId,
      peerUser: optionsRef.current.peerUserId,
    });

    if (initStartedCallIdsRef.current.has(nextCallId)) {
      console.warn(`[${role.toUpperCase()}] duplicate init blocked`, nextCallId);
      return;
    }

    if (isInitializingRef.current) {
      console.warn(`[${role.toUpperCase()}] init blocked - another init running`, {
        callId: nextCallId,
      });
      return;
    }

    if (activeCallIdRef.current === nextCallId && peerConnectionRef.current) {
      console.warn(`[${role.toUpperCase()}] init blocked - peer already exists`, nextCallId);
      return;
    }

    // CRITICAL: Set currentCallIdRef first so signal handler can filter by callId
    currentCallIdRef.current = nextCallId;
    initStartedCallIdsRef.current.add(nextCallId);
    isInitializingRef.current = true;
    activeCallIdRef.current = nextCallId;

    try {
      const { currentUserId, peerUserId, currentCall } = optionsRef.current;

      if (!currentUserId || !peerUserId || !role) {
        console.error(`[${role.toUpperCase()}] missing context`, {
          currentUserId,
          peerUserId,
          role,
        });
        throw new Error('Missing user context for call initialization');
      }

      stopOutgoingCallWaitingSound();
      if (optionsRef.current.callType === 'video' && !forceAudioOnlyRef.current) {
        console.log(`[${role.toUpperCase()}] video call - will request camera + mic`);
      } else {
        console.log(`[${role.toUpperCase()}] audio call - will request microphone only`);
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone is not supported in this browser');
      }

      // Check if camera is already marked as unavailable (from previous attempt)
      if (optionsRef.current.callType === 'video' && isCameraUnavailable) {
        console.log('[MEDIA] camera was previously marked unavailable, using audio-only');
        forceAudioOnlyRef.current = true;
      }

      setWebRTCStatus('requesting-microphone');
      setError(null);

      micTimeoutRef.current = setTimeout(() => {
        console.error('[MEDIA] microphone permission timed out');
        setError(new Error('Microphone permission timed out. Please allow microphone access and try again.'));
        setWebRTCStatus('failed');
      }, MICROPHONE_TIMEOUT);

      let stream: MediaStream | undefined;
      try {
        // Check if we already have a valid local stream - reuse it instead of requesting again
        if (localStreamRef.current) {
          const existingTracks = localStreamRef.current.getTracks();
          const allLive = existingTracks.every(t => t.readyState === 'live');
          if (allLive && existingTracks.length > 0) {
            console.log('[MEDIA] local stream already exists, reusing it', { 
              tracks: existingTracks.map(t => ({ kind: t.kind, id: t.id }))
            });
            stream = localStreamRef.current;
          } else {
            console.log('[MEDIA] existing stream has dead tracks, stopping and requesting new');
            existingTracks.forEach(t => t.stop());
            localStreamRef.current = null;
          }
        }

        // Request new stream if we don't have one
        if (!stream) {
          if (optionsRef.current.callType === 'video' && !forceAudioOnlyRef.current) {
            // Mobile-specific video constraints with facingMode
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const videoConstraints = { 
              audio: true, 
              video: isMobile ? { facingMode: 'user' } : true 
            };
            
            console.log('[MOBILE CALL] isSecureContext', window.isSecureContext);
            console.log('[MOBILE CALL] isMobile device', isMobile);
            console.log('[MOBILE CALL] requesting video call media', { constraints: videoConstraints });
            
            try {
              stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
              console.log('[MOBILE CALL] getUserMedia success', { 
                tracks: stream.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled, readyState: t.readyState, label: t.label }))
              });
            } catch (videoError) {
              const errName = videoError instanceof DOMException ? videoError.name : '';
              const errMessage = videoError instanceof Error ? videoError.message : String(videoError);
              console.error('[MOBILE CALL] getUserMedia failed', errName, errMessage);
              
              // Mobile permission errors
              if (!window.isSecureContext) {
                console.warn('[MOBILE CALL] Not in secure context - HTTPS required for camera/microphone');
              }
              
              const isNotReadable = errName === 'NotReadableError' || 
                /Could not start video source/i.test(errMessage) ||
                /Camera or microphone is already in use/i.test(errMessage);
              
              const isNotAllowed = errName === 'NotAllowedError' ||
                /Permission denied/i.test(errMessage);
              
              // Handle camera unavailable - mark state but don't auto-fallback
              if (isNotReadable && optionsRef.current.callType === 'video') {
                console.warn('[MOBILE CALL] Camera unavailable - NotReadableError. Camera may be in use by another app/tab.');
                setIsCameraUnavailable(true);
                // Still allow the call to proceed with audio-only fallback
                console.log('[MEDIA] Falling back to audio-only due to camera unavailability');
                forceAudioOnlyRef.current = true;
                setIsAudioOnlyFallback(true);
                
                // Request audio-only fallback
                console.log('[MEDIA] requesting audio-only fallback');
                stream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                  video: false,
                });
                console.log('[MEDIA] getUserMedia success (audio-only fallback)');
              } else if (isNotAllowed) {
                console.error('[MOBILE CALL] Camera/microphone permission denied by user');
                throw new Error('Camera and microphone access denied. Please allow access in your browser settings and try again.');
              } else {
                throw videoError;
              }
            }
          } else {
            const audioConstraints = { audio: true, video: false };
            console.log('[MOBILE CALL] requesting user media (audio only)', { constraints: audioConstraints });
            try {
              stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
              console.log('[MOBILE CALL] getUserMedia success (audio only)');
            } catch (audioError) {
              const errName = audioError instanceof DOMException ? audioError.name : '';
              const errMessage = audioError instanceof Error ? audioError.message : String(audioError);
              console.error('[MOBILE CALL] getUserMedia failed for audio', errName, errMessage);
              throw audioError;
            }
          }
        }
        
        if (micTimeoutRef.current) {
          clearTimeout(micTimeoutRef.current);
          micTimeoutRef.current = null;
        }
      } catch (err) {
        if (micTimeoutRef.current) {
          clearTimeout(micTimeoutRef.current);
          micTimeoutRef.current = null;
        }
        console.error('[MEDIA] getUserMedia failed', err);
        const errText = err instanceof Error ? err.message : String(err);
        let msg = optionsRef.current.callType === 'video' ? 'Camera access failed' : 'Microphone access failed';
        const isVideoBusyError =
          optionsRef.current.callType === 'video' &&
          (err instanceof DOMException && (
            err.name === 'NotReadableError' ||
            err.name === 'NotAllowedError' ||
            err.name === 'OverconstrainedError'
          ) ||
          /Could not start video source/i.test(errText) ||
          /Microphone in use by another app/i.test(errText));

        if (isVideoBusyError) {
          msg = 'Camera or microphone is already in use. Close other apps/tabs or continue audio only.';
        }
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' && !isVideoBusyError) {
            msg = optionsRef.current.callType === 'video'
              ? 'Please allow camera access'
              : 'Microphone access denied. Please allow access and try again.';
          }
          else if (err.name === 'NotFoundError') msg = optionsRef.current.callType === 'video' ? 'No camera or microphone found.' : 'No microphone found.';
          else if (err.name === 'NotReadableError' && !isVideoBusyError) msg = 'Microphone in use by another app.';
          else if (!isVideoBusyError) msg = `Microphone error: ${err.name}`;
        }
        throw new Error(msg);
      }

      // Ensure stream is defined
      if (!stream) {
        throw new Error('Failed to get media stream');
      }

      // Log local tracks as requested
      const localVideoTracks = stream.getVideoTracks();
      const localAudioTracks = stream.getAudioTracks();
      
      // Detailed logging for media acquisition
      console.log('[MEDIA] local video tracks', localVideoTracks.map(t => ({ 
        kind: t.kind, 
        enabled: t.enabled, 
        readyState: t.readyState, 
        id: t.id,
        label: t.label 
      })));
      console.log('[MEDIA] local audio tracks', localAudioTracks.map(t => ({ 
        kind: t.kind, 
        enabled: t.enabled, 
        readyState: t.readyState, 
        id: t.id,
        label: t.label 
      })));
      
      // Log final media mode
      const hasLocalVideo = localVideoTracks.length > 0 && localVideoTracks.some(t => t.readyState === 'live');
      console.log('[CALL] final media mode', hasLocalVideo ? 'video' : 'audio-only');
      
      if (optionsRef.current.callType === 'video') {
        console.log('[MEDIA] local stream acquired', { 
          videoTracks: localVideoTracks.length,
          audioTracks: localAudioTracks.length,
          hasLocalVideo,
          isCameraUnavailable 
        });
      } else {
        console.log('[MEDIA] microphone GRANTED', { audioTracks: localAudioTracks.length });
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (!(optionsRef.current.callType === 'video' && forceAudioOnlyRef.current)) {
        setIsAudioOnlyFallback(false);
      }
      if (optionsRef.current.callType === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
        console.log('[MEDIA] local video attached to element');
      }
      setWebRTCStatus('connecting');

      // Check if we need to clean up an old peer connection first
      if (peerConnectionRef.current) {
        console.warn(`[${role.toUpperCase()}] closing old peer connection before creating new one`, nextCallId);
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Unsubscribe from any existing signal channel before creating new one
      if (signalsChannelRef.current) {
        console.log(`[${role.toUpperCase()}] unsubscribing from old signal channel`);
        unsubscribeFromCallSignals(signalsChannelRef.current);
        signalsChannelRef.current = null;
      }

      // CRITICAL: Create peer connection BEFORE subscribing to signals
      console.log(`[${role.toUpperCase()}] creating peer connection`, nextCallId);
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      console.log(`[${role.toUpperCase()}] peer connection created`);

      const pc = peerConnectionRef.current;

      // Add local tracks to peer connection
      console.log('[CALL] adding local tracks to peer connection');
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log('[CALL] local track added', { kind: track.kind, id: track.id });
      });
      console.log('[CALL] local tracks added successfully');

      // Set up remote track handler
      pc.ontrack = (event) => {
        remoteTrackArrivedRef.current = true;
        const [remoteStream] = event.streams;
        const tracks = remoteStream.getTracks();
        const videoTracks = remoteStream.getVideoTracks();
        const audioTracks = remoteStream.getAudioTracks();
        const rolePrefix = role.toUpperCase();
        
        // Log as requested
        console.log(`[CALL] ontrack fired`, {
          kind: event.track?.kind,
          enabled: event.track?.enabled,
          readyState: event.track?.readyState,
          streams: event.streams?.length
        });
        
        console.log(`[${rolePrefix}] [REMOTE STREAM]`, remoteStream);
        console.log(`[${rolePrefix}] [REMOTE AUDIO TRACKS]`, audioTracks.map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState, id: t.id })));
        console.log(`[${rolePrefix}] [REMOTE VIDEO TRACKS]`, videoTracks.map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState, id: t.id })));
        
        remoteStreamRef.current = remoteStream;
        setRemoteStream(remoteStream);
        
        // Check for active video tracks (live and enabled)
        const hasActiveVideo = videoTracks.length > 0 && 
          videoTracks.some(t => t.readyState === 'live' && t.enabled);
        setRemoteHasVideo(hasActiveVideo);
        
        // Log remote video tracks status
        console.log('[MEDIA] remote video tracks', videoTracks.map(t => ({ 
          kind: t.kind, 
          enabled: t.enabled, 
          readyState: t.readyState, 
          id: t.id,
          label: t.label 
        })));
        
        if (optionsRef.current.callType === 'video') {
          console.log(`[${rolePrefix}] remote stream received`, {
            hasVideo: videoTracks.length > 0,
            hasActiveVideo,
            hasAudio: audioTracks.length > 0
          });
          console.log('[CALL] final media mode', hasActiveVideo ? 'video' : 'audio-only');
        }
        setWebRTCStatus('connected');
        stopOutgoingCallWaitingSound();
        
        // Clear connection timeout since we're connected
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        // Handle audio element
        if (remoteAudioRef.current) {
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1;
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch((playError) => {
            console.warn(`[${rolePrefix}] remote audio autoplay failed`, playError);
          });
        }
        
        // Handle video element
        if (optionsRef.current.callType === 'video') {
          if (remoteVideoRef.current) {
            if (hasActiveVideo) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.muted = false;
              remoteVideoRef.current.volume = 1;
              remoteVideoRef.current.play().catch((e) => {
                console.warn(`[${rolePrefix}] remote video play failed`, e);
              });
              console.log(`[${rolePrefix}] remote video attached and playing`);
            } else {
              console.log(`[${rolePrefix}] remote has no active video tracks - audio only`);
            }
          } else {
            console.warn(`[${rolePrefix}] remoteVideoRef not available yet`);
          }
        }
        
        // Listen for track events to update UI when remote user toggles camera
        tracks.forEach(track => {
          track.onmute = () => {
            console.log(`[${rolePrefix}] remote track muted`, { kind: track.kind, id: track.id });
            if (track.kind === 'video') {
              const stillHasVideo = remoteStream.getVideoTracks().some(t => t.readyState === 'live' && t.enabled && !t.muted);
              setRemoteHasVideo(stillHasVideo);
            }
          };
          track.onunmute = () => {
            console.log(`[${rolePrefix}] remote track unmuted`, { kind: track.kind, id: track.id });
            if (track.kind === 'video') {
              setRemoteHasVideo(true);
            }
          };
          track.onended = () => {
            console.log(`[${rolePrefix}] remote track ended`, { kind: track.kind, id: track.id });
            if (track.kind === 'video') {
              const stillHasVideo = remoteStream.getVideoTracks().some(t => t.readyState === 'live' && t.enabled);
              setRemoteHasVideo(stillHasVideo);
            }
          };
        });
      };

      // Set up ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const o = optionsRef.current;
          const rolePrefix = role.toUpperCase();
          if (currentCallIdRef.current && o.currentUserId && o.peerUserId) {
            console.log(`[${rolePrefix}] ICE generated`, { 
              callId: currentCallIdRef.current,
              candidate: event.candidate.candidate?.substring(0, 50) + '...'
            });
            insertCallSignal({
              callId: currentCallIdRef.current,
              senderId: o.currentUserId,
              receiverId: o.peerUserId,
              type: 'ice-candidate',
              payload: event.candidate.toJSON(),
            }).then(() => {
              console.log(`[${rolePrefix}] ICE sent with callId: ${currentCallIdRef.current}`);
            }).catch((err) => {
              console.error(`[${rolePrefix}] failed to send ICE`, err);
            });
          }
        }
      };

      // Set up connection state change handler
      pc.onconnectionstatechange = () => {
        const rolePrefix = role.toUpperCase();
        console.log(`[${rolePrefix}] connectionState: ${pc.connectionState}`, { callId: currentCallIdRef.current });
        setConnectionState(pc.connectionState);
        if (pc.connectionState === 'connected') {
          setWebRTCStatus('connected');
          stopOutgoingCallWaitingSound();
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        } else if (pc.connectionState === 'failed') {
          setWebRTCStatus('failed');
        }
      };

      // Set up ICE connection state change handler
      pc.oniceconnectionstatechange = () => {
        const rolePrefix = role.toUpperCase();
        console.log(`[${rolePrefix}] iceConnectionState: ${pc.iceConnectionState}`, { callId: currentCallIdRef.current });
        setIceConnectionState(pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setWebRTCStatus('connected');
          stopOutgoingCallWaitingSound();
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        }
      };

      // Subscribe to call signals AFTER peer connection is ready
      console.log(`[${role.toUpperCase()}] subscribing to call signals`, { callId: nextCallId, currentUserId });
      const channel = subscribeToCallSignals(nextCallId, currentUserId, handleSignal);
      signalsChannelRef.current = channel;
      console.log(`[${role.toUpperCase()}] signal subscription created`);

      // Fetch any existing signals that were sent before subscription started
      console.log(`[${role.toUpperCase()}] fetching existing signals`, { callId: nextCallId, currentUserId });
      const { signals: existingSignals, error: signalsError } = await getCallSignals(nextCallId, currentUserId);
      if (signalsError) {
        console.error(`[${role.toUpperCase()}] failed to fetch existing signals`, signalsError);
      } else if (existingSignals.length > 0) {
        console.log(`[${role.toUpperCase()}] found ${existingSignals.length} existing signals`);
        for (const signal of existingSignals) {
          console.log(`[${role.toUpperCase()}] processing existing ${signal.type}`, { signalId: signal.id, sender: signal.sender_id });
          await handleSignal(signal);
        }
      } else {
        console.log(`[${role.toUpperCase()}] no existing signals found`);
      }

      // Set connection timeout - if not connected within 30 seconds, mark as failed
      console.log(`[${role.toUpperCase()}] setting connection timeout`, CONNECTION_TIMEOUT);
      connectionTimeoutRef.current = setTimeout(() => {
        console.error(`[${role.toUpperCase()}] connection timeout - call failed to connect`, { 
          callId: currentCallIdRef.current,
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState
        });
        setWebRTCStatus('connection_failed');
        setError(new Error('Call failed to connect. Please try again.'));
        // Clean up the failed connection
        cleanupWebRTC('connection-timeout');
      }, CONNECTION_TIMEOUT);

      if (role === 'caller') {
        // Caller: Create and send offer after fetching existing signals
        console.log(`[CALLER] starting offer creation`, { callId: nextCallId });
        
        if (hasCreatedOfferRef.current || isCreatingOfferRef.current) {
          console.warn(`[CALLER] duplicate offer blocked`);
          return;
        }
        
        isCreatingOfferRef.current = true;
        try {
          console.log(`[CALLER] creating offer...`);
          const offer = await pc.createOffer();
          console.log(`[CALLER] offer created`);
          await pc.setLocalDescription(offer);
          console.log(`[CALLER] setLocalDescription done`);

          console.log(`[CALLER] saving offer to database`, { callId: nextCallId });
          const { success } = await insertCallSignal({
            callId: nextCallId,
            senderId: currentUserId,
            receiverId: peerUserId,
            type: 'offer',
            payload: offer,
          });
          
          if (success) {
            hasCreatedOfferRef.current = true;
            callerCreatedOfferRef.current = true;
            console.log(`[CALLER] offer saved with callId: ${nextCallId}`);
          } else {
            console.error(`[CALLER] failed to save offer`);
          }
        } catch (err) {
          console.error(`[CALLER] create offer failed`, err);
          setWebRTCStatus('failed');
        } finally {
          isCreatingOfferRef.current = false;
        }
      } else {
        // Receiver: Already fetched existing signals above
        console.log(`[RECEIVER] waiting for new signals`, { callId: nextCallId });
      }
    } catch (errorValue) {
      console.error(`[${role.toUpperCase()}] init failed`, errorValue);
      const errMessage = errorValue instanceof Error ? errorValue.message : 'Failed to start audio call';
      setWebRTCStatus('failed');
      setError(new Error(errMessage));
      optionsRef.current.onError?.(new Error(errMessage));
    } finally {
      isInitializingRef.current = false;
    }
  }, [handleSignal]);

  // ============================================================================
  // MAIN EFFECT - Single init trigger after call acceptance
  // ============================================================================
  useEffect(() => {
    if (!callId) return;
    if (!isAccepted) return;
    // Prevent re-initialization if already initializing or has active connection
    if (isInitializingRef.current) {
      console.log(`[CALL] init blocked - already initializing`);
      return;
    }
    if (peerConnectionRef.current && peerConnectionRef.current.connectionState !== 'closed') {
      console.log(`[CALL] init blocked - peer connection already exists`);
      return;
    }

    const {
      currentUserId: currentUserIdValue,
      peerUserId,
      role,
      currentCall,
    } = optionsRef.current;

    const call = currentCall as Record<string, unknown> | null;
    const callerId = (call?.callerId as string | undefined) ?? (call?.caller_id as string | undefined);
    const receiverId = (call?.receiverId as string | undefined) ?? (call?.receiver_id as string | undefined);
    const isCaller = callerId === currentUserIdValue;
    const isReceiver = receiverId === currentUserIdValue;

    console.log(`[${role?.toUpperCase() || 'UNKNOWN'}] main effect triggered`, {
      callId,
      currentUser: currentUserIdValue,
      role,
      isAccepted,
    });

    if (!callId || !currentUserIdValue || !peerUserId || !role) {
      console.error('[CALL] missing context - cannot initialize', {
        callId,
        currentUser: currentUserIdValue,
        peerUser: peerUserId,
        role,
      });
      setWebRTCStatus('failed');
      setError(new Error('Missing user context for call initialization'));
      return;
    }

    console.log(`[${role.toUpperCase()}] calling initWebRTC`, { callId, currentUser: currentUserIdValue });
    initWebRTC(callId, role);
  }, [callId, isAccepted, initWebRTC]);

  useEffect(() => {
    if (connectingDebugTimeoutRef.current) {
      clearTimeout(connectingDebugTimeoutRef.current);
      connectingDebugTimeoutRef.current = null;
    }

    if (webRTCStatus !== 'connecting' || !callId) return;

    connectingDebugTimeoutRef.current = setTimeout(() => {
      console.log('[CALL] connecting debug', {
        callId,
        role: optionsRef.current.role,
        connectionState: peerConnectionRef.current?.connectionState,
        iceConnectionState: peerConnectionRef.current?.iceConnectionState,
        offerCreated: callerCreatedOfferRef.current,
        offerReceived: receiverReceivedOfferRef.current,
        answerCreated: receiverCreatedAnswerRef.current,
        answerReceived: callerReceivedAnswerRef.current,
        remoteTrackArrived: remoteTrackArrivedRef.current,
        pendingIceCandidates: pendingIceCandidatesRef.current.length,
      });
    }, 5000);

    return () => {
      if (connectingDebugTimeoutRef.current) {
        clearTimeout(connectingDebugTimeoutRef.current);
        connectingDebugTimeoutRef.current = null;
      }
    };
  }, [webRTCStatus, callId]);

  // Cleanup when callId changes to a different call.
  useEffect(() => {
    const previousCallId = previousCallIdRef.current;
    if (previousCallId && callId && previousCallId !== callId) {
      cleanupWebRTC('call-id-changed');
    }
    previousCallIdRef.current = callId;
  }, [callId, cleanupWebRTC]);

  // Cleanup on component unmount.
  useEffect(() => {
    return () => {
      cleanupWebRTC('component-unmount');
    };
  }, [cleanupWebRTC]);

  // ============================================================================
  // RETRY MICROPHONE
  // ============================================================================

  const retryMicrophone = useCallback(async () => {
    console.log('[CALL] retry started - cleaning up first');
    
    // Full cleanup first to release camera/microphone
    cleanupWebRTC('retry-microphone');
    
    console.log('[CALL] retry - cleanup done, reinitializing');
    setError(null);
    setWebRTCStatus('idle');

    const opts = optionsRef.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(new Error('Microphone not supported'));
      setWebRTCStatus('failed');
      return;
    }
    if (!opts.callId) return;
    const role = opts.role;
    if (!role) return;
    await initWebRTC(opts.callId, role);
  }, [cleanupWebRTC, initWebRTC]);

  const continueAudioOnly = useCallback(async () => {
    const opts = optionsRef.current;
    if (!opts.callId || !opts.role) return;

    console.log('[CALL] continue audio-only selected', {
      callId: opts.callId,
      role: opts.role,
    });

    setIsAudioOnlyFallback(true);
    setError(null);
    setWebRTCStatus('connecting');
    forceAudioOnlyRef.current = true;

    // Full cleanup first to release camera, then reinitialize with audio only
    cleanupWebRTC('continue-audio-only');
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Clear pending ICE candidates
    pendingIceCandidatesRef.current = [];

    // Reset guards for this call to allow re-initialization
    const callId = opts.callId;
    initStartedCallIdsRef.current.delete(callId);
    hasCreatedOfferRef.current = false;
    hasCreatedAnswerRef.current = false;
    isCreatingOfferRef.current = false;
    processedSignalsRef.current.clear();
    isInitializingRef.current = false;
    activeCallIdRef.current = null;
    currentCallIdRef.current = callId; // Reset to the same call ID for the retry

    console.log('[CALL] reinitializing with audio-only', callId);
    await initWebRTC(callId, opts.role);
  }, [cleanupWebRTC, initWebRTC]);

  // ============================================================================
  // CONTROLS
  // ============================================================================

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
      return newMuted;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setIsCameraOff(prev => {
      const nextCameraOff = !prev;
      localStreamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = !nextCameraOff;
      });
      console.log('[MEDIA] camera toggled', { cameraOff: nextCameraOff });
      return nextCameraOff;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => {
      const nextSpeakerOn = !prev;
      const isVideoCall = optionsRef.current.callType === 'video';
      if (isVideoCall && remoteVideoRef.current) {
        remoteVideoRef.current.muted = !nextSpeakerOn;
        remoteVideoRef.current.volume = nextSpeakerOn ? 1 : 0;
      } else if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = !nextSpeakerOn;
        remoteAudioRef.current.volume = nextSpeakerOn ? 1 : 0;
      }
      return nextSpeakerOn;
    });
  }, []);

  const endCall = useCallback(() => {
    cleanupWebRTC('call-ended');
  }, [cleanupWebRTC]);

  // Retry camera access - useful when camera was previously unavailable
  const retryCamera = useCallback(async () => {
    console.log('[MEDIA] retrying camera access');
    setIsCameraUnavailable(false);
    forceAudioOnlyRef.current = false;
    setIsAudioOnlyFallback(false);
    
    // Release current media before retrying
    if (localStreamRef.current) {
      console.log('[MEDIA] stopping existing tracks before retry');
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[MEDIA] stopped track', { kind: track.kind, id: track.id });
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    // Clear video element
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    // Re-initialize WebRTC with camera
    const opts = optionsRef.current;
    if (!opts.callId || !opts.role) {
      console.warn('[MEDIA] cannot retry camera - missing callId or role');
      return;
    }
    
    console.log('[MEDIA] reinitializing WebRTC with camera enabled');
    await initWebRTC(opts.callId, opts.role);
  }, [initWebRTC]);

  // ============================================================================
  // EFFECT: Re-attach streams when video refs become available
  // This handles cases where track arrives before video element is rendered
  // ============================================================================
  useEffect(() => {
    if (!localStreamRef.current) return;
    
    const isVideoCall = optionsRef.current.callType === 'video';
    if (isVideoCall && localVideoRef.current && !localVideoRef.current.srcObject) {
      console.log('[MEDIA] re-attaching local stream to video element');
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch((e) => {
        console.warn('[MEDIA] local video play failed', e);
      });
    }
  });

  useEffect(() => {
    if (!remoteStreamRef.current) return;
    
    const isVideoCall = optionsRef.current.callType === 'video';
    const remoteVideoTracks = remoteStreamRef.current.getVideoTracks();
    const hasActiveVideo = remoteVideoTracks.some(t => t.readyState === 'live' && t.enabled);
    
    if (remoteAudioRef.current && !remoteAudioRef.current.srcObject) {
      console.log('[MEDIA] re-attaching remote stream to audio element');
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
      remoteAudioRef.current.play().catch(() => {});
    }
    
    if (isVideoCall && remoteVideoRef.current && !remoteVideoRef.current.srcObject && hasActiveVideo) {
      console.log('[MEDIA] re-attaching remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch((e) => {
        console.warn('[MEDIA] remote video play failed', e);
      });
    }
  });

  return {
    webRTCStatus,
    localStream,
    remoteStream,
    remoteHasVideo,
    isMuted,
    isSpeakerOn,
    connectionState,
    iceConnectionState,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    endCall,
    retryMicrophone,
    continueAudioOnly,
    retryCamera,
    error,
    remoteAudioRef,
    localVideoRef,
    remoteVideoRef,
    isCameraOff,
    isCameraUnavailable,
    isAudioOnlyFallback,
  };
}

export const useWebRTCCall = useWebRTCAudioCall;
