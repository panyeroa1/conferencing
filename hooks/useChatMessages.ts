import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Message, MessageType } from '../types';

interface UseChatMessagesProps {
  meetingId: string | null;
  enabled?: boolean;
}

export function useChatMessages({ meetingId, enabled = true }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing messages from database
  const loadMessages = useCallback(async () => {
    if (!meetingId) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          id,
          meeting_id,
          sender_id,
          content,
          created_at,
          type,
          profiles:sender_id (display_name)
        `)
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        meeting_id: msg.meeting_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        type: msg.type as MessageType,
        senderName: msg.profiles?.display_name || 'Unknown'
      }));

      setMessages(formattedMessages);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  // Send a new message
  const sendMessage = useCallback(async (
    content: string, 
    senderId: string | null,
    senderName: string,
    type: MessageType = 'text'
  ) => {
    if (!meetingId || !content.trim()) return null;

    try {
      const newMessage: Partial<Message> = {
        meeting_id: meetingId,
        sender_id: senderId,
        content: content.trim(),
        type
      };

      const { data, error: insertError } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single();

      if (insertError) throw insertError;

      // Optimistically add to local state
      const messageWithSender: Message = {
        ...data,
        senderName
      };

      setMessages(prev => [...prev, messageWithSender]);
      return messageWithSender;
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message);
      return null;
    }
  }, [meetingId]);

  // Add a message from realtime broadcast (not from DB)
  const addRealtimeMessage = useCallback((message: {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
  }) => {
    const newMessage: Message = {
      id: message.id,
      meeting_id: meetingId || '',
      sender_id: message.senderId,
      content: message.content,
      created_at: new Date().toISOString(),
      type: 'text',
      senderName: message.senderName
    };

    setMessages(prev => {
      // Avoid duplicates
      if (prev.some(m => m.id === message.id)) return prev;
      return [...prev, newMessage];
    });
  }, [meetingId]);

  // Subscribe to realtime inserts
  useEffect(() => {
    if (!meetingId || !enabled) return;

    loadMessages();

    const channel = supabase
      .channel(`messages:${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `meeting_id=eq.${meetingId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Fetch sender name
          let senderName = 'Unknown';
          if (newMsg.sender_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', newMsg.sender_id)
              .single();
            senderName = profile?.display_name || 'Unknown';
          }

          const formattedMessage: Message = {
            id: newMsg.id,
            meeting_id: newMsg.meeting_id,
            sender_id: newMsg.sender_id,
            content: newMsg.content,
            created_at: newMsg.created_at,
            type: newMsg.type as MessageType,
            senderName
          };

          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === formattedMessage.id)) return prev;
            return [...prev, formattedMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, enabled, loadMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    addRealtimeMessage,
    refresh: loadMessages
  };
}
