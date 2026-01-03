export interface CampusEvent {
  id: string;
  title: string;
  location: string;
  description: string;
  startDate: string; // ISO String
  endDate: string; // ISO String
  sourceUrl?: string;
  foundAt: string; // Timestamp when we found it
}

export enum ScanStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}