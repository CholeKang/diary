export interface DiaryEntry {
  id: string;
  text: string;
  timestamp: number;
  audioBlob?: Blob; // Optional: if we want to play it back later (not persisted in localstorage fully in this demo due to size, but kept in memory)
  isTranscribing: boolean;
}

export interface User {
  username: string;
  lastLogin: number;
}

export enum RecorderState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR'
}

export interface VisualizationData {
  dataArray: Uint8Array;
}