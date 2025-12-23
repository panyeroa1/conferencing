import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 
  | { type: 'participant_join'; payload: { id: string; name: string; role: string } }
  | { type: 'participant_leave'; payload: { id: string } }
  | { type: 'signal'; payload: { from: string; to: string; data: any } }
  | { type: 'chat'; payload: { id: string; senderId: string; senderName: string; content: string } }
  | { type: 'status_update'; payload: { id: string; audioEnabled?: boolean; videoEnabled?: boolean; handRaised?: boolean } };

interface UseRealtimeRoomProps {
  roomCode: string | null;
  participantId: string;
  participantName: string;
  onEvent: (event: RealtimeEvent) => void;
  enabled?: boolean;
}

export function useRealtimeRoom({
  roomCode,
  participantId,
  participantName,
  onEvent,
  enabled = true
}: UseRealtimeRoomProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Broadcast an event to the room
  const broadcast = useCallback((event: RealtimeEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: event.type,
        payload: event.payload
      });
    }
  }, []);

  // Send a signal to a specific participant
  const sendSignal = useCallback((to: string, data: any) => {
    broadcast({
      type: 'signal',
      payload: { from: participantId, to, data }
    });
  }, [broadcast, participantId]);

  // Send a chat message
  const sendChat = useCallback((content: string) => {
    const messageId = crypto.randomUUID();
    broadcast({
      type: 'chat',
      payload: {
        id: messageId,
        senderId: participantId,
        senderName: participantName,
        content
      }
    });
    return messageId;
  }, [broadcast, participantId, participantName]);

  // Update status (audio/video/hand)
  const updateStatus = useCallback((update: { audioEnabled?: boolean; videoEnabled?: boolean; handRaised?: boolean }) => {
    broadcast({
      type: 'status_update',
      payload: { id: participantId, ...update }
    });
  }, [broadcast, participantId]);

  // Announce join
  const announceJoin = useCallback((role: string) => {
    broadcast({
      type: 'participant_join',
      payload: { id: participantId, name: participantName, role }
    });
  }, [broadcast, participantId, participantName]);

  // Announce leave
  const announceLeave = useCallback(() => {
    broadcast({
      type: 'participant_leave',
      payload: { id: participantId }
    });
  }, [broadcast, participantId]);

  useEffect(() => {
    if (!roomCode || !enabled) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const channel = supabase.channel(`room:${roomCode}`, {
      config: {
        broadcast: { self: false }
      }
    });

    // Listen for all event types
    channel
      .on('broadcast', { event: 'participant_join' }, ({ payload }) => {
        onEvent({ type: 'participant_join', payload });
      })
      .on('broadcast', { event: 'participant_leave' }, ({ payload }) => {
        onEvent({ type: 'participant_leave', payload });
      })
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        // Only process signals meant for us
        if (payload.to === participantId) {
          onEvent({ type: 'signal', payload });
        }
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        onEvent({ type: 'chat', payload });
      })
      .on('broadcast', { event: 'status_update' }, ({ payload }) => {
        onEvent({ type: 'status_update', payload });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [roomCode, participantId, enabled, onEvent]);

  return {
    isConnected,
    broadcast,
    sendSignal,
    sendChat,
    updateStatus,
    announceJoin,
    announceLeave
  };
}
