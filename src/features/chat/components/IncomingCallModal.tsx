import { useEffect } from 'react';
import { Phone, Video, X } from 'lucide-react';
import type { CallSession } from '../services/supabaseCallService';
import { acceptCall, rejectCall } from '../services/supabaseCallService';
import {
  playIncomingCallRingtone,
  stopIncomingCallRingtone,
} from '../utils/chatSounds';

interface IncomingCallModalProps {
  call: CallSession;
  callerName: string;
  callerAvatar?: string;
  onAccepted: () => void;
  onRejected: () => void;
}

export function IncomingCallModal({
  call,
  callerName,
  callerAvatar,
  onAccepted,
  onRejected,
}: IncomingCallModalProps) {
  const isVideo = call.type === 'video';

  useEffect(() => {
    console.log('[Calls] incoming call modal shown', call.id);
    
    // Play ringtone
    try {
      playIncomingCallRingtone();
    } catch (err) {
      console.warn('[Calls] failed to play ringtone', err);
    }

    return () => {
      stopIncomingCallRingtone();
    };
  }, [call.id]);

  const handleAccept = async () => {
    console.log('[Calls] accept clicked', call.id);
    stopIncomingCallRingtone();
    
    const { error } = await acceptCall(call.id);
    if (error) {
      console.error('[Calls] accept failed', error);
    }
    
    onAccepted();
  };

  const handleReject = async () => {
    console.log('[Calls] rejecting from modal', call.id);
    stopIncomingCallRingtone();
    
    const { error } = await rejectCall(call.id);
    if (error) {
      console.error('[Calls] reject failed', error);
    }
    
    onRejected();
  };

  const avatarInitial = callerName?.charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Incoming ${isVideo ? 'video' : 'audio'} call`}
    >
      <div className="w-full max-w-[360px] mx-4">
        <div className="bg-gray-900/95 rounded-3xl p-8 text-white shadow-2xl text-center">
          {/* Avatar */}
          <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center text-4xl font-bold mb-6 bg-linear-to-br from-teal-500 to-teal-600">
            {callerAvatar ? (
              <img src={callerAvatar} alt={callerName} className="w-full h-full rounded-full object-cover" />
            ) : (
              avatarInitial
            )}
          </div>

          {/* Caller Info */}
          <h3 className="text-2xl font-semibold mb-2">{callerName}</h3>
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-8">
            {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            <span>Incoming {isVideo ? 'video' : 'audio'} call...</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-8">
            {/* Reject */}
            <button
              onClick={handleReject}
              className="flex flex-col items-center gap-2 group"
              aria-label="Reject call"
            >
              <div className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                <X className="w-7 h-7" />
              </div>
              <span className="text-sm text-gray-400">Decline</span>
            </button>

            {/* Accept */}
            <button
              onClick={handleAccept}
              className="flex flex-col items-center gap-2 group"
              aria-label="Accept call"
            >
              <div className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors">
                {isVideo ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
              </div>
              <span className="text-sm text-gray-400">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
