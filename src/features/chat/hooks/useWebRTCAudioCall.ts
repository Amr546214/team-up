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
  const previousCallIdRef = useRef<string | null>(null);
  const connectingDebugTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callerCreatedOfferRef = useRef(false);
  const receiverReceivedOfferRef = useRef(false);
  const receiverCreatedAnswerRef = useRef(false);
  const callerReceivedAnswerRef = useRef(false);
  const remoteTrackArrivedRef = useRef(false);
  const forceAudioOnlyRef = useRef(false);

  // HARD GUARDS - These prevent duplicate initialization
  const initStartedCallIdsRef = useRef<Set<string>>(new Set());
  const isInitializingRef = useRef(false);
  const activeCallIdRef = useRef<string | null>(null);

  // Offer/answer guards
  const hasCreatedOfferRef = useRef<boolean>(false);
  const hasCreatedAnswerRef = useRef<boolean>(false);
  const isCreatingOfferRef = useRef<boolean>(false);

  // Signal processing guards
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
    console.log('[Calls] cleanup reason', reason);
    console.log('[WebRTC] cleanup', reason, { activeCallId: activeCallIdRef.current });

    // Clear microphone timeout
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
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

    // Clear audio element
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset ALL guards - this is the only place they get cleared
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

    // Clear state
    setLocalStream(null);
    setRemoteStream(null);
    setWebRTCStatus('ended');
    setIsCameraOff(false);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsAudioOnlyFallback(false);
    forceAudioOnlyRef.current = false;
  }, []);

  // ============================================================================
  // SIGNAL HANDLER - Processes incoming WebRTC signals (offer/answer/ICE)
  // Reads from optionsRef so it never needs to be recreated.
  // ============================================================================

  const handleSignal = useCallback(async (signal: CallSignal) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.log('[WebRTC] no peer connection, ignoring signal');
      return;
    }

    // Dedup
    if (processedSignalsRef.current.has(signal.id)) {
      return;
    }
    processedSignalsRef.current.add(signal.id);

    const opts = optionsRef.current;

    try {
      if (signal.type === 'offer') {
        console.log('[WebRTC] receiver received offer', opts.callId);
        receiverReceivedOfferRef.current = true;
        if (hasCreatedAnswerRef.current) {
          console.warn('[WebRTC] duplicate answer blocked');
          return;
        }
        if (pc.remoteDescription) {
          console.log('[WebRTC] already have remote description, ignoring offer');
          return;
        }

        console.log('[WebRTC] received offer, setting remote description...');
        await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);

        console.log('[WebRTC] creating answer...');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (opts.callId && opts.currentUserId && opts.peerUserId) {
          const { success } = await insertCallSignal({
            callId: opts.callId,
            senderId: opts.currentUserId,
            receiverId: opts.peerUserId,
            type: 'answer',
            payload: answer,
          });
          if (success) {
            hasCreatedAnswerRef.current = true;
            receiverCreatedAnswerRef.current = true;
            console.log('[WebRTC] receiver inserted answer', opts.callId);
            if (opts.callType === 'video' && forceAudioOnlyRef.current) {
              console.log('[Video Fallback] audio-only answer inserted');
            }
            console.log('[WebRTC] answer sent successfully');
          }
        }
        setWebRTCStatus('connecting');

      } else if (signal.type === 'answer') {
        console.log('[WebRTC] caller received answer', opts.callId);
        callerReceivedAnswerRef.current = true;
        if (pc.remoteDescription) {
          console.log('[WebRTC] already have remote description, ignoring answer');
          return;
        }

        console.log('[WebRTC] received answer, setting remote description...');
        await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        setWebRTCStatus('connecting');

      } else if (signal.type === 'ice-candidate') {
        console.log('[WebRTC] received ICE candidate, adding...');
        await pc.addIceCandidate(new RTCIceCandidate(signal.payload as RTCIceCandidateInit));
      }
    } catch (err) {
      console.error('[WebRTC] HANDLE SIGNAL FAILED', err);
    }
  }, []); // No deps - reads from refs/optionsRef

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

      if (peerConnectionRef.current) {
        console.warn('[WebRTC] reusing existing peer connection', nextCallId);
        return peerConnectionRef.current;
      }

      console.log('[WebRTC] creating peer connection', nextCallId);
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      const pc = peerConnectionRef.current;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      console.log('[WebRTC] local tracks added');

      pc.ontrack = (event) => {
        remoteTrackArrivedRef.current = true;
        console.log('[WebRTC] remote track received', event.streams);
        const [stream] = event.streams;
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
        if (optionsRef.current.callType === 'video') {
          console.log('[WebRTC Video] remote stream received');
        }
        setWebRTCStatus('connected');
        stopOutgoingCallWaitingSound();
        if (remoteAudioRef.current) {
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1;
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch((playError) => {
            console.warn('[WebRTC] remote audio autoplay failed', playError);
          });
          console.log('[WebRTC] remote audio element', {
            hasElement: !!remoteAudioRef.current,
            muted: remoteAudioRef.current.muted,
            volume: remoteAudioRef.current.volume,
            srcObject: !!remoteAudioRef.current.srcObject,
          });
        }
        if (optionsRef.current.callType === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.muted = false;
          remoteVideoRef.current.volume = 1;
          remoteVideoRef.current.play().catch(() => {});
          console.log('[WebRTC Video] remote video attached');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const o = optionsRef.current;
          if (o.callId && o.currentUserId && o.peerUserId) {
            insertCallSignal({
              callId: o.callId,
              senderId: o.currentUserId,
              receiverId: o.peerUserId,
              type: 'ice-candidate',
              payload: event.candidate.toJSON(),
            });
          }
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] connection state', pc.connectionState);
        setConnectionState(pc.connectionState);
        if (pc.connectionState === 'connected') {
          setWebRTCStatus('connected');
          stopOutgoingCallWaitingSound();
        } else if (pc.connectionState === 'failed') {
          setWebRTCStatus('failed');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ice connection state', pc.iceConnectionState);
        setIceConnectionState(pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setWebRTCStatus('connected');
          stopOutgoingCallWaitingSound();
        }
      };

      if (!signalsChannelRef.current) {
        console.log('[WebRTC] subscribing to signals...');
        const channel = subscribeToCallSignals(nextCallId, currentUserId, handleSignal);
        signalsChannelRef.current = channel;
      }

      if (role === 'caller') {
        console.log('[WebRTC] caller: creating offer after delay...');
        setTimeout(async () => {
          if (!peerConnectionRef.current || hasCreatedOfferRef.current || isCreatingOfferRef.current) {
            console.warn('[WebRTC] duplicate offer blocked', nextCallId);
            return;
          }
          isCreatingOfferRef.current = true;
          try {
            console.log('[WebRTC] caller creating offer', nextCallId);
            const currentPc = peerConnectionRef.current;
            const offer = await currentPc.createOffer();
            await currentPc.setLocalDescription(offer);

            const o = optionsRef.current;
            if (o.callId && o.currentUserId && o.peerUserId) {
              const { success } = await insertCallSignal({
                callId: o.callId,
                senderId: o.currentUserId,
                receiverId: o.peerUserId,
                type: 'offer',
                payload: offer,
              });
              if (success) {
                hasCreatedOfferRef.current = true;
                callerCreatedOfferRef.current = true;
                console.log('[WebRTC] offer inserted', nextCallId);
                if (optionsRef.current.callType === 'video' && forceAudioOnlyRef.current) {
                  console.log('[Video Fallback] audio-only offer inserted');
                }
                console.log('[WebRTC] offer sent successfully');
              }
            }
          } catch (err) {
            console.error('[WebRTC] create offer failed', err);
            setWebRTCStatus('failed');
          } finally {
            isCreatingOfferRef.current = false;
          }
        }, 500);
      } else {
        console.log('[WebRTC] receiver waiting for offer', nextCallId);
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

    console.log('[WebRTC Context]', {
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

    console.log('[Video Fallback] cleanup failed video attempt');
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => track.stop());
      localStreamRef.current.getAudioTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (signalsChannelRef.current) {
      unsubscribeFromCallSignals(signalsChannelRef.current);
      signalsChannelRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    initStartedCallIdsRef.current.delete(opts.callId);
    hasCreatedOfferRef.current = false;
    hasCreatedAnswerRef.current = false;
    isCreatingOfferRef.current = false;
    processedSignalsRef.current.clear();
    isInitializingRef.current = false;
    activeCallIdRef.current = null;

    console.log('[Video Fallback] retrying with audio only');
    await initWebRTC(opts.callId, opts.role);
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
