/**
 * Real-time signaling service using Supabase Realtime.
 * This replaces the previous MockWebSocket implementation.
 * 
 * For actual usage, import and use the `useRealtimeRoom` hook instead.
 * This file is kept for backward compatibility with existing code that
 * imports `wsService`.
 */

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type EventCallback = (data: any) => void;

class RealtimeSignaling {
  private channel: RealtimeChannel | null = null;
  private callbacks: Map<string, EventCallback[]> = new Map();
  private roomCode: string | null = null;
  private participantId: string = '';

  // Initialize connection to a room
  connect(roomCode: string, participantId: string) {
    this.roomCode = roomCode;
    this.participantId = participantId;

    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    this.channel = supabase.channel(`room:${roomCode}`, {
      config: { broadcast: { self: false } }
    });

    // Set up listeners for all event types
    this.channel
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        if (payload.to === participantId || payload.to === 'all') {
          this.emit('signal', payload);
        }
      })
      .on('broadcast', { event: 'participant_join' }, ({ payload }) => {
        this.emit('participant_join', payload);
      })
      .on('broadcast', { event: 'participant_leave' }, ({ payload }) => {
        this.emit('participant_leave', payload);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        this.emit('chat', payload);
      })
      .on('broadcast', { event: 'status_update' }, ({ payload }) => {
        this.emit('status_update', payload);
      })
      .on('broadcast', { event: 'room_command' }, ({ payload }) => {
        if (payload.to === participantId || payload.to === 'all') {
          this.emit('room_command', payload);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.emit('connected', { roomCode });
        }
      });
  }

  // Disconnect from room
  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.roomCode = null;
  }

  // Register event listener
  on(event: string, cb: EventCallback) {
    const list = this.callbacks.get(event) || [];
    list.push(cb);
    this.callbacks.set(event, list);
  }

  // Remove event listener
  off(event: string, cb: EventCallback) {
    const list = this.callbacks.get(event) || [];
    this.callbacks.set(event, list.filter(c => c !== cb));
  }

  // Emit event locally
  private emit(event: string, data: any) {
    const list = this.callbacks.get(event) || [];
    list.forEach(cb => cb(data));
  }

  // Broadcast event to room
  broadcast(event: string, data: any) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event,
        payload: { ...data, from: this.participantId }
      });
    }
  }

  // Send signal to specific participant
  signal(to: string, signalData: any) {
    this.broadcast('signal', {
      to,
      data: signalData
    });
  }

  // Get connection status
  isConnected() {
    return this.channel !== null;
  }

  // Get current room code
  getRoomCode() {
    return this.roomCode;
  }
}

export const wsService = new RealtimeSignaling();
