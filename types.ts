export interface Chapter {
  title: string;
  content: string;
  index: number;
}

export interface Book {
  id: string;
  title: string;
  content: string; // Raw content, though usually we parse it
  chapters: Chapter[];
  fileName: string;
  lastReadChapterIndex: number;
  progress: number; // 0-100
  isStatic?: boolean; // New flag: true if loaded from server public folder
}

export enum ThemeMode {
  LIGHT = 'light',
  SEPIA = 'sepia',
  DARK = 'dark',
}

export interface ReaderSettings {
  theme: ThemeMode;
  fontSize: number;
  lineHeight: number;
  width: number; // Max width percentage
}

export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Extend HTMLInputElement to support webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}