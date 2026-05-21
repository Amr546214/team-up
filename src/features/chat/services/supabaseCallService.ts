import { supabase } from '../../../lib/supabase';
import { notifyMissedCall } from './chatNotifications';

export interface CallSession {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'rejected' | 'missed' | 'ended';
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  created_at: string;
}

export interface CreateCallSessionParams {
  conversationId: string;
  receiverId: string;
  type: 'audio' | 'video';
}

export async function createCallSession({
  conversationId,
  receiverId,
  type,
}: CreateCallSessionParams): Promise<{ call: CallSession | null; error: string | null }> {
  try {
    console.log('[Calls] creating call', { conversationId, receiverId, type });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { call: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('call_sessions')
      .insert({
        conversation_id: conversationId,
        caller_id: user.id,
        receiver_id: receiverId,
        type,
        status: 'ringing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Calls] failed to create call session', error);
      return { call: null, error: error.message };
    }

    console.log('[Calls] created call', data);
    return { call: data as CallSession, error: null };
  } catch (err: any) {
    console.error('[Calls] unexpected error creating call', err);
    return { call: null, error: err?.message || 'Failed to create call' };
  }
}

export async function acceptCall(callId: string): Promise<{ error: string | null }> {
  try {
    console.log('[Calls] accepting call', callId);

    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'accepted',
        answered_at: new Date().toISOString(),
      })
      .eq('id', callId);

    if (error) {
      console.error('[Calls] failed to accept call', error);
      return { error: error.message };
    }

    console.log('[Calls] accepted', callId);
    return { error: null };
  } catch (err: any) {
    console.error('[Calls] unexpected error accepting call', err);
    return { error: err?.message || 'Failed to accept call' };
  }
}

export async function rejectCall(callId: string): Promise<{ error: string | null }> {
  try {
    console.log('[Calls] rejecting call', callId);

    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'rejected',
        ended_at: new Date().toISOString(),
      })
      .eq('id', callId);

    if (error) {
      console.error('[Calls] failed to reject call', error);
      return { error: error.message };
    }

    console.log('[Calls] rejected', callId);
    return { error: null };
  } catch (err: any) {
    console.error('[Calls] unexpected error rejecting call', err);
    return { error: err?.message || 'Failed to reject call' };
  }
}

export async function endCall(callId: string): Promise<{ error: string | null }> {
  try {
    console.log('[Calls] ending call', callId);

    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', callId);

    if (error) {
      console.error('[Calls] failed to end call', error);
      return { error: error.message };
    }

    console.log('[Calls] ended', callId);
    return { error: null };
  } catch (err: any) {
    console.error('[Calls] unexpected error ending call', err);
    return { error: err?.message || 'Failed to end call' };
  }
}

export async function markCallMissed(callId: string): Promise<{ error: string | null }> {
  try {
    console.log('[Calls] marking call missed', callId);

    // Only mark as missed if still ringing - fetch full details for notification
    const { data: currentCall, error: fetchError } = await supabase
      .from('call_sessions')
      .select('status, caller_id, receiver_id, conversation_id, type')
      .eq('id', callId)
      .single();

    if (fetchError || !currentCall) {
      console.error('[Calls] failed to fetch call for miss check', fetchError);
      return { error: fetchError?.message || 'Call not found' };
    }

    if (currentCall.status !== 'ringing') {
      console.log('[Calls] call already handled, skip marking missed', currentCall.status);
      return { error: null };
    }

    const { error } = await supabase
      .from('call_sessions')
      .update({
        status: 'missed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', callId);

    if (error) {
      console.error('[Calls] failed to mark call missed', error);
      return { error: error.message };
    }

    console.log('[Calls] marked missed', callId);

    // Fire-and-forget: send missed call notification to the receiver
    // The receiver is the one who missed the call (not the caller)
    // TODO: In the future, save call history to a call_history table here
    (async () => {
      await notifyMissedCall(
        callId,
        currentCall.caller_id,
        currentCall.receiver_id,
        currentCall.conversation_id,
        currentCall.type
      );
    })().catch((err) => {
      console.error('[Calls] failed to send missed call notification', err);
    });

    return { error: null };
  } catch (err: any) {
    console.error('[Calls] unexpected error marking missed', err);
    return { error: err?.message || 'Failed to mark call missed' };
  }
}

export async function getActiveCallForConversation(
  conversationId: string
): Promise<{ call: CallSession | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('conversation_id', conversationId)
      .in('status', ['ringing', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return { call: null, error: error.message };
    }

    return { call: data as CallSession | null, error: null };
  } catch (err: any) {
    return { call: null, error: err?.message || 'Failed to get active call' };
  }
}
