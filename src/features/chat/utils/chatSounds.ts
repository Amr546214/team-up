// Centralized chat sound manager
// Guards browser APIs and prevents overlapping sound loops

// Exact public folder paths (case-sensitive for production)
const CALL_SOUNDS = {
  notification: '/Notify.mp3',
  outgoing: '/RingWaiting.mp3',
  incoming: '/ringback.mp3',
};

// Module-level audio refs — one per sound channel
let outgoingAudio: HTMLAudioElement | null = null;
let incomingAudio: HTMLAudioElement | null = null;
let notificationAudio: HTMLAudioElement | null = null;

/**
 * Safely stop and destroy an audio instance
 */
function stopAndDestroy(audio: HTMLAudioElement | null, label: string): null {
  if (!audio) return null;
  try {
    console.log('[Call Audio] stop', label);
    audio.pause();
    audio.currentTime = 0;
    audio.src = '';
    audio.load();
  } catch (err) {
    console.warn('[Call Audio] stop error', { label, err });
  }
  return null;
}

/**
 * Create and play a looping audio, returning the element
 */
function playLoopingAudio(src: string, volume: number, label: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  console.log('[Call Audio] attempt play', src);

  try {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;

    audio.play()
      .then(() => {
        console.log('[Call Audio] playing', src);
      })
      .catch((error) => {
        console.warn('[Call Audio] play failed', { src, error });
      });

    return audio;
  } catch (error) {
    console.warn('[Call Audio] create failed', { src, error });
    return null;
  }
}

/**
 * Play notification sound (one-time, no loop)
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  console.log('[Call Audio] attempt play', CALL_SOUNDS.notification);

  try {
    // One-shot: create fresh each time
    const audio = new Audio(CALL_SOUNDS.notification);
    audio.volume = 0.6;
    audio.loop = false;

    audio.play()
      .then(() => {
        console.log('[Call Audio] playing', CALL_SOUNDS.notification);
      })
      .catch((error) => {
        console.warn('[Call Audio] play failed', { src: CALL_SOUNDS.notification, error });
      });
  } catch (error) {
    console.warn('[Call Audio] create failed', { src: CALL_SOUNDS.notification, error });
  }
}

/**
 * Play outgoing call waiting sound (loops)
 * Best called directly from a click handler for browser autoplay policy.
 */
export function playOutgoingCallWaitingSound(): void {
  // Prevent duplicate
  if (outgoingAudio) {
    console.log('[Call Audio] outgoing - already playing, skipping');
    return;
  }

  outgoingAudio = playLoopingAudio(CALL_SOUNDS.outgoing, 0.55, 'outgoing');
}

/**
 * Stop outgoing call waiting sound
 */
export function stopOutgoingCallWaitingSound(): void {
  outgoingAudio = stopAndDestroy(outgoingAudio, 'outgoing');
}

/**
 * Play incoming call ringtone (loops)
 */
export function playIncomingCallRingtone(): void {
  // Prevent duplicate
  if (incomingAudio) {
    console.log('[Call Audio] incoming - already playing, skipping');
    return;
  }

  incomingAudio = playLoopingAudio(CALL_SOUNDS.incoming, 0.65, 'incoming');
}

/**
 * Stop incoming call ringtone
 */
export function stopIncomingCallRingtone(): void {
  incomingAudio = stopAndDestroy(incomingAudio, 'incoming');
}

/**
 * Stop all chat sounds
 */
export function stopAllChatSounds(): void {
  console.log('[Call Audio] stop all sounds');
  stopOutgoingCallWaitingSound();
  stopIncomingCallRingtone();
  notificationAudio = stopAndDestroy(notificationAudio, 'notification');
}
