import { useRef, useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { CallSignal } from '../services/supabaseCallSignals';
import { insertCallSignal, subscribeToCallSignals, unsubscribeFromCallSignals } from '../services/supabaseCallSignals';
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
  error: Error | null;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOff: boolean;
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
  const [error, setError] = useState<Error | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioOnlyFallback, setIsAudioOnlyFallback] = useState(false);

  // ============================================================================
  // CLEANUP - Clears all WebRTC resources. Only called on end/reject/miss/unmount.
  // ============================================================================

  const cleanupWebRTC = useCallback((reason: string) => {
    console.log('[WebRTC] cleanup STARTED', { reason, callId: currentCallIdRef.current });

    // Clear all timeouts
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
      console.log('[WebRTC] cleanup: microphone timeout cleared');
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
      console.log('[WebRTC] cleanup: connection timeout cleared');
    }

    if (connectingDebugTimeoutRef.current) {
      clearTimeout(connectingDebugTimeoutRef.current);
      connectingDebugTimeoutRef.current = null;
    }

    // Stop local tracks
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log('[WebRTC] cleanup: stopping local tracks', { trackCount: tracks.length });
      tracks.forEach((track) => {
        track.stop();
        console.log('[WebRTC] cleanup: stopped track', { kind: track.kind, id: track.id });
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      const pc = peerConnectionRef.current;
      console.log('[WebRTC] cleanup: closing peer connection', { 
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState 
      });
      pc.close();
      peerConnectionRef.current = null;
      console.log('[WebRTC] cleanup: peer connection closed');
    }

    // Clear remote stream
    remoteStreamRef.current = null;

    // Unsubscribe from signals
    if (signalsChannelRef.current) {
      console.log('[WebRTC] cleanup: unsubscribing from call signals');
      unsubscribeFromCallSignals(signalsChannelRef.current);
      signalsChannelRef.current = null;
      console.log('[WebRTC] cleanup: signals unsubscribed');
    }

    // Clear video/audio elements
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Clear ICE candidate queue
    const queuedCount = pendingIceCandidatesRef.current.length;
    pendingIceCandidatesRef.current = [];
    console.log('[WebRTC] cleanup: cleared pending ICE candidates', { queuedCount });

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

    console.log('[WebRTC] cleanup COMPLETED', { 
      clearedCallId,
      reason 
    });

    // Clear state
    setLocalStream(null);
    setRemoteStream(null);
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

    console.log('[WebRTC] flushing pending ICE candidates', { count: queue.length });
    
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[WebRTC] flushed ICE candidate successfully');
      } catch (err) {
        console.error('[WebRTC] failed to add flushed ICE candidate', err);
      }
    }
    
    pendingIceCandidatesRef.current = [];
    console.log('[WebRTC] ICE candidate queue cleared');
  }, []);

  // ============================================================================
  // SIGNAL HANDLER - Processes incoming WebRTC signals (offer/answer/ICE)
  // CRITICAL: Filters signals by callId to prevent cross-call contamination
  // ============================================================================
  const handleSignal = useCallback(async (signal: CallSignal) => {
    const currentCallId = currentCallIdRef.current;
    
    // CRITICAL: Filter signals by call_id - ignore signals for other calls
    if (signal.call_id !== currentCallId) {
      console.log('[WebRTC] ignoring signal for different call', { 
        signalCallId: signal.call_id, 
        currentCallId,
        type: signal.type 
      });
      return;
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      console.log('[WebRTC] no peer connection, ignoring signal', { type: signal.type });
      return;
    }

    // Dedup by signal ID
    if (processedSignalsRef.current.has(signal.id)) {
      console.log('[WebRTC] duplicate signal ignored', { signalId: signal.id, type: signal.type });
      return;
    }
    processedSignalsRef.current.add(signal.id);

    const opts = optionsRef.current;

    try {
      if (signal.type === 'offer') {
        console.log('[WebRTC] incoming offer received', { callId: currentCallId });
        receiverReceivedOfferRef.current = true;
        
        if (hasCreatedAnswerRef.current) {
          console.warn('[WebRTC] duplicate answer blocked - already created answer');
          return;
        }
        if (pc.remoteDescription) {
          console.log('[WebRTC] already have remote description, ignoring offer');
          return;
        }

        console.log('[WebRTC] remote offer setting...');
        await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        console.log('[WebRTC] remote offer set successfully');

        // Flush any pending ICE candidates now that remoteDescription is set
        await flushPendingIceCandidates(pc);

        console.log('[WebRTC] creating answer...');
        const answer = await pc.createAnswer();
        console.log('[WebRTC] local answer setting...');
        await pc.setLocalDescription(answer);
        console.log('[WebRTC] local answer set successfully');

        if (currentCallId && opts.currentUserId && opts.peerUserId) {
          console.log('[WebRTC] sending answer...', { callId: currentCallId });
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
            console.log('[WebRTC] answer sent successfully', { callId: currentCallId });
          }
        }
        setWebRTCStatus('connecting');

      } else if (signal.type === 'answer') {
        console.log('[WebRTC] remote answer received', { callId: currentCallId });
        callerReceivedAnswerRef.current = true;
        
        if (pc.remoteDescription) {
          console.log('[WebRTC] already have remote description, ignoring answer');
          return;
        }

        console.log('[WebRTC] remote answer setting...');
        await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        console.log('[WebRTC] remote answer set successfully');
        
        // Flush any pending ICE candidates now that remoteDescription is set
        await flushPendingIceCandidates(pc);
        
        setWebRTCStatus('connecting');

      } else if (signal.type === 'ice-candidate') {
        const candidate = signal.payload as RTCIceCandidateInit;
        
        // Check if remoteDescription is set before adding ICE candidate
        if (!pc.remoteDescription) {
          console.log('[WebRTC] ICE candidate queued because remoteDescription is missing', { 
            callId: currentCallId,
            queueLength: pendingIceCandidatesRef.current.length + 1
          });
          pendingIceCandidatesRef.current.push(candidate);
          return;
        }
        
        console.log('[WebRTC] ICE candidate received, adding...', { callId: currentCallId });
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('[WebRTC] ICE candidate added successfully');
        } catch (err) {
          console.error('[WebRTC] failed to add ICE candidate', err);
        }
      }
    } catch (err) {
      console.error('[WebRTC] HANDLE SIGNAL FAILED', err);
    }
  }, [flushPendingIceCandidates]);

  const initWebRTC = useCallback(async (nextCallId: string, role: 'caller' | 'receiver') => {
    if (!nextCallId) return;

    console.log('[WebRTC] init requested', {
      callId: nextCallId,
      role,
      alreadyStarted: initStartedCallIdsRef.current.has(nextCallId),
      isInitializing: isInitializingRef.current,
      activeCallId: activeCallIdRef.current,
      hasPeer: !!peerConnectionRef.current,
    });

    if (initStartedCallIdsRef.current.has(nextCallId)) {
      console.warn('[WebRTC] duplicate init blocked before microphone', nextCallId);
      return;
    }

    if (isInitializingRef.current) {
      console.warn('[WebRTC] init blocked because another init is running', {
        callId: nextCallId,
        activeCallId: activeCallIdRef.current,
      });
      return;
    }

    if (activeCallIdRef.current === nextCallId && peerConnectionRef.current) {
      console.warn('[WebRTC] init blocked because peer already exists', nextCallId);
      return;
    }

    // CRITICAL: Set currentCallIdRef first so signal handler can filter by callId
    console.log('[WebRTC] setting current callId', nextCallId);
    currentCallIdRef.current = nextCallId;
    initStartedCallIdsRef.current.add(nextCallId);
    isInitializingRef.current = true;
    activeCallIdRef.current = nextCallId;

    try {
      const { currentUserId, peerUserId, currentCall } = optionsRef.current;
      console.log('[WebRTC] start for accepted call', {
        callId: nextCallId,
        role,
      });

      if (!currentUserId || !peerUserId || !role) {
        console.error('[WebRTC] missing context', {
          call: currentCall,
          currentUserId,
          peerUserId,
          callRole: role,
        });
        throw new Error('Missing user context for call initialization');
      }

      stopOutgoingCallWaitingSound();
      if (optionsRef.current.callType === 'video' && !forceAudioOnlyRef.current) {
        console.log('[WebRTC Video] requesting camera/mic');
      } else {
        console.log('[WebRTC] step 1: requesting microphone...');
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone is not supported in this browser');
      }

      setWebRTCStatus('requesting-microphone');
      setError(null);

      micTimeoutRef.current = setTimeout(() => {
        console.error('[WebRTC] microphone permission timed out');
        setError(new Error('Microphone permission timed out. Please allow microphone access and try again.'));
        setWebRTCStatus('failed');
      }, MICROPHONE_TIMEOUT);

      let stream: MediaStream;
      try {
        if (optionsRef.current.callType === 'video' && !forceAudioOnlyRef.current) {
          console.log('[WebRTC Video] requesting camera/mic');
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true,
            });
          } catch (videoError) {
            console.error('[WebRTC Video] camera/microphone error', videoError);
            throw videoError;
          }
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          if (optionsRef.current.callType === 'video' && forceAudioOnlyRef.current) {
            console.log('[WebRTC Audio Fallback] audio stream granted');
            setIsAudioOnlyFallback(true);
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
        console.error('[WebRTC Video] getUserMedia failed', err);
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

      if (optionsRef.current.callType === 'video') {
        console.log('[WebRTC Video] local stream tracks', stream.getTracks());
      } else {
        console.log('[WebRTC] microphone GRANTED', { tracks: stream.getTracks().length });
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
        console.log('[WebRTC Video] local video attached');
      }
      setWebRTCStatus('connecting');

      // Check if we need to clean up an old peer connection first
      if (peerConnectionRef.current) {
        console.warn('[WebRTC] closing old peer connection before creating new one', nextCallId);
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Unsubscribe from any existing signal channel before creating new one
      if (signalsChannelRef.current) {
        console.log('[WebRTC] unsubscribing from old signal channel before creating new one');
        unsubscribeFromCallSignals(signalsChannelRef.current);
        signalsChannelRef.current = null;
      }

      console.log('[WebRTC] peer connection creating', nextCallId);
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      console.log('[WebRTC] peer connection created');

      const pc = peerConnectionRef.current;

      // Add local tracks to peer connection
      console.log('[WebRTC] adding local tracks to peer connection');
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log('[WebRTC] local track added', { kind: track.kind, id: track.id });
      });
      console.log('[WebRTC] local tracks added successfully');

      // Set up remote track handler
      pc.ontrack = (event) => {
        remoteTrackArrivedRef.current = true;
        console.log('[WebRTC] remote track received', { 
          streams: event.streams.length,
          trackKinds: event.streams[0]?.getTracks().map(t => t.kind)
        });
        const [remoteStream] = event.streams;
        remoteStreamRef.current = remoteStream;
        setRemoteStream(remoteStream);
        if (optionsRef.current.callType === 'video') {
          console.log('[WebRTC Video] remote stream received');
        }
        setWebRTCStatus('connected');
        stopOutgoingCallWaitingSound();
        
        // Clear connection timeout since we're connected
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
          console.log('[WebRTC] connection timeout cleared - connected');
        }
        
        if (remoteAudioRef.current) {
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1;
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch((playError) => {
            console.warn('[WebRTC] remote audio autoplay failed', playError);
          });
        }
        if (optionsRef.current.callType === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.muted = false;
          remoteVideoRef.current.volume = 1;
          remoteVideoRef.current.play().catch(() => {});
          console.log('[WebRTC Video] remote video attached');
        }
      };

      // Set up ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const o = optionsRef.current;
          if (currentCallIdRef.current && o.currentUserId && o.peerUserId) {
            console.log('[WebRTC] ICE candidate generated, sending...', { 
              callId: currentCallIdRef.current,
              candidate: event.candidate.candidate?.substring(0, 50) + '...'
            });
            insertCallSignal({
              callId: currentCallIdRef.current,
              senderId: o.currentUserId,
              receiverId: o.peerUserId,
              type: 'ice-candidate',
              payload: event.candidate.toJSON(),
            });
          }
        }
      };

      // Set up connection state change handler
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] peer connection state changed', { 
          state: pc.connectionState,
          callId: currentCallIdRef.current 
        });
        setConnectionState(pc.connectionState);
        if (pc.connectionState === 'connected') {
          setWebRTCStatus('connected');
          stopOutgoingCallWaitingSound();
          // Clear connection timeout
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
        console.log('[WebRTC] ICE connection state changed', { 
          state: pc.iceConnectionState,
          callId: currentCallIdRef.current 
        });
        setIceConnectionState(pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setWebRTCStatus('connected');
          stopOutgoingCallWaitingSound();
          // Clear connection timeout
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        }
      };

      // Subscribe to call signals BEFORE creating/sending offer (prevents race condition)
      console.log('[WebRTC] subscribing to call signals', { callId: nextCallId, currentUserId });
      const channel = subscribeToCallSignals(nextCallId, currentUserId, handleSignal);
      signalsChannelRef.current = channel;
      console.log('[WebRTC] signal subscription created');

      // Set connection timeout - if not connected within 30 seconds, mark as failed
      console.log('[WebRTC] setting connection timeout', CONNECTION_TIMEOUT);
      connectionTimeoutRef.current = setTimeout(() => {
        console.error('[WebRTC] connection timeout - call failed to connect', { 
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
        // Caller: Create and send offer immediately (subscription is ready)
        console.log('[WebRTC] caller: preparing to create offer', nextCallId);
        
        if (hasCreatedOfferRef.current || isCreatingOfferRef.current) {
          console.warn('[WebRTC] duplicate offer blocked', nextCallId);
          return;
        }
        
        isCreatingOfferRef.current = true;
        try {
          console.log('[WebRTC] caller creating offer...');
          const offer = await pc.createOffer();
          console.log('[WebRTC] caller local offer setting...');
          await pc.setLocalDescription(offer);
          console.log('[WebRTC] caller local offer set');

          console.log('[WebRTC] caller sending offer...', nextCallId);
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
            console.log('[WebRTC] caller offer sent successfully', nextCallId);
          } else {
            console.error('[WebRTC] failed to send offer');
          }
        } catch (err) {
          console.error('[WebRTC] create offer failed', err);
          setWebRTCStatus('failed');
        } finally {
          isCreatingOfferRef.current = false;
        }
      } else {
        // Receiver: Wait for offer
        console.log('[WebRTC] receiver: waiting for incoming offer', nextCallId);
      }
    } catch (errorValue) {
      console.error('[WebRTC] init failed', errorValue);
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

    console.log('[WebRTC] Main effect - call accepted, initializing', {
      callId,
      currentUserId: currentUserIdValue,
      callerId,
      receiverId,
      isCaller,
      isReceiver,
      callRole: role,
      peerUserId,
    });

    if (!callId || !currentUserIdValue || !peerUserId || !role) {
      console.error('[WebRTC] missing context', {
        call: currentCall,
        currentUserId: currentUserIdValue,
        peerUserId,
        callRole: role,
      });
      setWebRTCStatus('failed');
      setError(new Error('Missing user context for call initialization'));
      return;
    }

    initWebRTC(callId, role);
  }, [callId, isAccepted, initWebRTC]);

  useEffect(() => {
    if (connectingDebugTimeoutRef.current) {
      clearTimeout(connectingDebugTimeoutRef.current);
      connectingDebugTimeoutRef.current = null;
    }

    if (webRTCStatus !== 'connecting' || !callId) return;

    connectingDebugTimeoutRef.current = setTimeout(() => {
      console.log('[WebRTC] connecting debug', {
        callId,
        role: optionsRef.current.role,
        didCallerCreateOffer: callerCreatedOfferRef.current,
        didReceiverReceiveOffer: receiverReceivedOfferRef.current,
        didReceiverCreateAnswer: receiverCreatedAnswerRef.current,
        didCallerReceiveAnswer: callerReceivedAnswerRef.current,
        didRemoteTrackArrive: remoteTrackArrivedRef.current,
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
    console.log('[WebRTC] retrying microphone...');
    setError(null);
    setWebRTCStatus('idle');

    // Stop old tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    // Retry is a fresh lifecycle.
    cleanupWebRTC('retry-microphone');
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

    console.log('[Video Fallback] continue audio only clicked', {
      callId: opts.callId,
      role: opts.role,
    });

    setIsAudioOnlyFallback(true);
    setError(null);
    setWebRTCStatus('connecting');
    forceAudioOnlyRef.current = true;

    console.log('[Video Fallback] cleanup for audio-only retry');
    
    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Unsubscribe from signals
    if (signalsChannelRef.current) {
      unsubscribeFromCallSignals(signalsChannelRef.current);
      signalsChannelRef.current = null;
    }
    
    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Clear connection timeout
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

    console.log('[Video Fallback] retrying with audio only', callId);
    await initWebRTC(callId, opts.role);
  }, [initWebRTC]);

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
      console.log('[WebRTC Video] camera toggled', nextCameraOff);
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

  return {
    webRTCStatus,
    localStream,
    remoteStream,
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
    error,
    remoteAudioRef,
    localVideoRef,
    remoteVideoRef,
    isCameraOff,
    isAudioOnlyFallback,
  };
}

export const useWebRTCCall = useWebRTCAudioCall;
