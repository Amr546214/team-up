// Centralized chat sound manager
// Guards browser APIs and prevents overlapping sound loops

// Module-level audio instances
let notificationAudio: HTMLAudioElement | null = null;
let outgoingCallAudio: HTMLAudioElement | null = null;
let incomingCallAudio: HTMLAudioElement | null = null;

// Sound configuration
const SOUNDS = {
  notification: {
    path: '/Notify.mp3',
    loop: false,
    volume: 0.6,
  },
  outgoingCall: {
    path: '/RingWaiting.mp3',
    loop: true,
    volume: 0.55,
  },
  incomingCall: {
    path: '/ringback.mp3',
    loop: true,
    volume: 0.65,
  },
};

/**
 * Get or create notification audio instance
 */
function getNotificationAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  
  if (!notificationAudio) {
    notificationAudio = new Audio(SOUNDS.notification.path);
    notificationAudio.volume = SOUNDS.notification.volume;
    notificationAudio.loop = SOUNDS.notification.loop;
  }
  
  return notificationAudio;
}

/**
 * Get or create outgoing call audio instance
 */
function getOutgoingCallAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  
  if (!outgoingCallAudio) {
    outgoingCallAudio = new Audio(SOUNDS.outgoingCall.path);
    outgoingCallAudio.volume = SOUNDS.outgoingCall.volume;
    outgoingCallAudio.loop = SOUNDS.outgoingCall.loop;
  }
  
  return outgoingCallAudio;
}

/**
 * Get or create incoming call audio instance
 */
function getIncomingCallAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  
  if (!incomingCallAudio) {
    incomingCallAudio = new Audio(SOUNDS.incomingCall.path);
    incomingCallAudio.volume = SOUNDS.incomingCall.volume;
    incomingCallAudio.loop = SOUNDS.incomingCall.loop;
  }
  
  return incomingCallAudio;
}

/**
 * Play notification sound (one-time, no loop)
 */
export function playNotificationSound(): void {
  const audio = getNotificationAudio();
  if (!audio) {
    console.log('[ChatSound] notification - audio not available');
    return;
  }
  
  // Reset and play
  audio.currentTime = 0;
  
  console.log('[ChatSound] play notification');
  
  audio.play().catch((err) => {
    console.warn('[ChatSound] play failed - notification', err);
  });
}

/**
 * Play outgoing call waiting sound (loops)
 */
export function playOutgoingCallWaitingSound(): void {
  const audio = getOutgoingCallAudio();
  if (!audio) {
    console.log('[ChatSound] outgoing waiting - audio not available');
    return;
  }
  
  // Check if already playing
  if (!audio.paused) {
    console.log('[ChatSound] outgoing waiting - already playing');
    return;
  }
  
  // Reset and play
  audio.currentTime = 0;
  
  console.log('[ChatSound] play outgoing waiting');
  
  audio.play().catch((err) => {
    console.warn('[ChatSound] play failed - outgoing waiting', err);
  });
}

/**
 * Stop outgoing call waiting sound
 */
export function stopOutgoingCallWaitingSound(): void {
  if (!outgoingCallAudio) return;
  
  if (!outgoingCallAudio.paused) {
    console.log('[ChatSound] stop outgoing waiting');
    outgoingCallAudio.pause();
    outgoingCallAudio.currentTime = 0;
  }
}

/**
 * Play incoming call ringtone (loops)
 */
export function playIncomingCallRingtone(): void {
  const audio = getIncomingCallAudio();
  if (!audio) {
    console.log('[ChatSound] incoming ringtone - audio not available');
    return;
  }
  
  // Check if already playing
  if (!audio.paused) {
    console.log('[ChatSound] incoming ringtone - already playing');
    return;
  }
  
  // Reset and play
  audio.currentTime = 0;
  
  console.log('[ChatSound] play incoming ringtone');
  
  audio.play().catch((err) => {
    console.warn('[ChatSound] play failed - incoming ringtone', err);
  });
}

/**
 * Stop incoming call ringtone
 */
export function stopIncomingCallRingtone(): void {
  if (!incomingCallAudio) return;
  
  if (!incomingCallAudio.paused) {
    console.log('[ChatSound] stop incoming ringtone');
    incomingCallAudio.pause();
    incomingCallAudio.currentTime = 0;
  }
}

/**
 * Stop all chat sounds
 */
export function stopAllChatSounds(): void {
  console.log('[ChatSound] stop all sounds');
  stopOutgoingCallWaitingSound();
  stopIncomingCallRingtone();
  // Notification is one-time, no need to stop
}
