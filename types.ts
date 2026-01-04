export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export enum ResponseMode {
  TEXT = 'text',
  AUDIO = 'audio',
  MIXED = 'mixed',
  PCM = 'pcm'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  audioUrl?: string; // For TTS playback
  isTyping?: boolean; // For UI state
}

export interface AccountingRecord {
  id: string;
  date: string;
  amount: number;
  category: string;
  merchant: string;
  imageUrl?: string;
  timestamp: number;
}

export interface AppSettings {
  responseMode: ResponseMode;
  theme: Theme;
  fontSize: 'small' | 'medium' | 'large';
  autoPlayAudio: boolean;
  deviceId: string;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messages: Message[];
}

export interface MusicState {
  isPlaying: boolean;
  title: string;
  artist: string;
  progress: number;
  duration: number;
  isVisible: boolean;
}
