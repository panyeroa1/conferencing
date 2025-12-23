import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Participant, Role } from '../types';

interface UseMeetingParticipantsProps {
  meetingId: string | null;
  localParticipant: {
    id: string;
    name: string;
    role: Role;
    userId?: string;
  };
  enabled?: boolean;
}

interface DbParticipant {
  id: string;
  meeting_id: string;
  user_id: string | null;
  name: string;
  role: string;
  joined_at: string;
  left_at: string | null;
  status: string;
}

export function useMeetingParticipants({
  meetingId,
  localParticipant,
  enabled = true
}: UseMeetingParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [dbParticipantId, setDbParticipantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Join meeting (insert participant)
  const joinMeeting = useCallback(async () => {
    if (!meetingId) return null;

    setLoading(true);
    try {
      const newParticipant = {
        meeting_id: meetingId,
        user_id: localParticipant.userId || null,
        name: localParticipant.name,
        role: localParticipant.role,
        status: 'online'
      };

      const { data, error: insertError } = await supabase
        .from('participants')
        .insert(newParticipant)
        .select()
        .single();

      if (insertError) throw insertError;

      setDbParticipantId(data.id);
      setError(null);
      return data;
    } catch (err: any) {
      console.error('Failed to join meeting:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [meetingId, localParticipant]);

  // Leave meeting (update left_at)
  const leaveMeeting = useCallback(async () => {
    if (!dbParticipantId) return;

    try {
      await supabase
        .from('participants')
        .update({ 
          left_at: new Date().toISOString(),
          status: 'offline'
        })
        .eq('id', dbParticipantId);
    } catch (err: any) {
      console.error('Failed to leave meeting:', err);
    }
  }, [dbParticipantId]);

  // Update participant status
  const updateStatus = useCallback(async (status: 'online' | 'offline' | 'idle') => {
    if (!dbParticipantId) return;

    try {
      await supabase
        .from('participants')
        .update({ status })
        .eq('id', dbParticipantId);
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  }, [dbParticipantId]);

  // Load active participants
  const loadParticipants = useCallback(async () => {
    if (!meetingId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('meeting_id', meetingId)
        .is('left_at', null);

      if (fetchError) throw fetchError;

      const formatted: Participant[] = (data || []).map((p: DbParticipant) => ({
        id: p.id,
        meeting_id: p.meeting_id,
        user_id: p.user_id || undefined,
        name: p.name,
        role: p.role as Role,
        isLocal: p.user_id === localParticipant.userId,
        audioEnabled: true,
        videoEnabled: true,
        handRaised: false,
        joined_at: p.joined_at,
        left_at: p.left_at,
        status: p.status as 'online' | 'offline' | 'idle'
      }));

      setParticipants(formatted);
    } catch (err: any) {
      console.error('Failed to load participants:', err);
      setError(err.message);
    }
  }, [meetingId, localParticipant.userId]);

  // Add participant from realtime broadcast
  const addParticipant = useCallback((participant: { id: string; name: string; role: string }) => {
    setParticipants(prev => {
      if (prev.some(p => p.id === participant.id)) return prev;
      return [...prev, {
        id: participant.id,
        name: participant.name,
        role: participant.role as Role,
        isLocal: false,
        audioEnabled: true,
        videoEnabled: true,
        handRaised: false
      }];
    });
  }, []);

  // Remove participant from realtime broadcast
  const removeParticipant = useCallback((participantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  }, []);

  // Update participant from realtime broadcast
  const updateParticipant = useCallback((participantId: string, update: Partial<Participant>) => {
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, ...update } : p
    ));
  }, []);

  // Subscribe to participant changes
  useEffect(() => {
    if (!meetingId || !enabled) return;

    loadParticipants();

    const channel = supabase
      .channel(`participants:${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `meeting_id=eq.${meetingId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = payload.new as DbParticipant;
            if (!p.left_at) {
              addParticipant({ id: p.id, name: p.name, role: p.role });
            }
          } else if (payload.eventType === 'UPDATE') {
            const p = payload.new as DbParticipant;
            if (p.left_at) {
              removeParticipant(p.id);
            } else {
              updateParticipant(p.id, { status: p.status as 'online' | 'offline' | 'idle' });
            }
          } else if (payload.eventType === 'DELETE') {
            const p = payload.old as DbParticipant;
            removeParticipant(p.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, enabled, loadParticipants, addParticipant, removeParticipant, updateParticipant]);

  return {
    participants,
    dbParticipantId,
    loading,
    error,
    joinMeeting,
    leaveMeeting,
    updateStatus,
    addParticipant,
    removeParticipant,
    updateParticipant,
    refresh: loadParticipants
  };
}
