// Supabase call_signals service for WebRTC signaling
// Handles offer, answer, and ICE candidate exchange

import { supabase } from '../../../lib/supabase';

export interface CallSignal {
  id: string;
  call_id: string;
  sender_id: string;
  receiver_id: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  created_at: string;
}

export interface InsertCallSignalParams {
  callId: string;
  senderId: string;
  receiverId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

/**
 * Insert a signal (offer, answer, or ICE candidate) into call_signals
 */
export async function insertCallSignal(
  params: InsertCallSignalParams
): Promise<{ success: boolean; error: Error | null }> {
  console.log('[WebRTC] inserting signal', {
    callId: params.callId,
    type: params.type,
    senderId: params.senderId,
    receiverId: params.receiverId,
  });

  const { error } = await supabase.from('call_signals').insert({
    call_id: params.callId,
    sender_id: params.senderId,
    receiver_id: params.receiverId,
    type: params.type,
    payload: params.payload,
  });

  if (error) {
    console.error('[WebRTC] insert signal failed', error);
    return { success: false, error };
  }

  console.log('[WebRTC] signal inserted successfully', params.type);
  return { success: true, error: null };
}

/**
 * Get all signals for a call that were sent by the other party
 * (signals we need to process)
 */
export async function getCallSignals(
  callId: string,
  currentUserId: string
): Promise<{ signals: CallSignal[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('call_signals')
    .select('*')
    .eq('call_id', callId)
    .neq('sender_id', currentUserId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[WebRTC] get signals failed', error);
    return { signals: [], error };
  }

  return { signals: (data as CallSignal[]) || [], error: null };
}

/**
 * Subscribe to call_signals for a specific call
 * Returns the channel - caller must unsubscribe when done
 */
export function subscribeToCallSignals(
  callId: string,
  currentUserId: string,
  onSignal: (signal: CallSignal) => void
): ReturnType<typeof supabase.channel> {
  console.log('[WebRTC] subscribing to call signals', { callId, currentUserId });

  const channel = supabase
    .channel(`call-signals:${callId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'call_signals',
        filter: `call_id=eq.${callId}`,
      },
      (payload) => {
        const signal = payload.new as CallSignal;

        // Ignore signals sent by current user (we already processed them)
        if (signal.sender_id === currentUserId) {
          return;
        }

        console.log('[WebRTC] received signal', {
          type: signal.type,
          callId: signal.call_id,
          senderId: signal.sender_id,
        });

        onSignal(signal);
      }
    )
    .subscribe((status) => {
      console.log('[WebRTC] signals subscription status', status);
    });

  return channel;
}

/**
 * Unsubscribe from call_signals channel
 */
export function unsubscribeFromCallSignals(
  channel: ReturnType<typeof supabase.channel> | null
): void {
  if (channel) {
    console.log('[WebRTC] unsubscribing from call signals');
    channel.unsubscribe();
  }
}
