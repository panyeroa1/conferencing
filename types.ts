
export type Role = 'host' | 'attendee' | 'observer';
export type UserStatus = 'online' | 'offline' | 'idle';
export type MessageType = 'text' | 'system' | 'alert';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  code: string;
  title: string;
  host_id: string;
  created_at: string;
  ended_at: string | null;
  settings: RoomSettings;
}

export interface Participant {
  id: string;
  meeting_id?: string;
  user_id?: string;
  name: string;
  role: Role;
  isLocal: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  stream?: MediaStream;
  handRaised?: boolean;
  joined_at?: string;
  left_at?: string | null;
  status?: UserStatus;
  avatarUrl?: string; // Derived from profile
}

export interface Message {
  id: string;
  meeting_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
  type: MessageType;
  senderName?: string; // Derived for UI
}

export interface CaptionSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
}

export interface RoomSettings {
  title: string;
  code: string;
  targetLang: string;
  sourceLang: string;
  captionsEnabled: boolean;
  readAloudEnabled: boolean;
}

export enum MixMode {
  ORIGINAL = 'ORIGINAL',
  DUCK = 'DUCK',
  TRANSLATION_ONLY = 'TRANSLATION_ONLY'
}
