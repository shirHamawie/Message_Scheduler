export interface ScheduledMessage {
  id: string;
  message: string;
  timestamp: number;
}

export interface IMessageStore {
  addMessage(time: string | number | Date, message: string): Promise<string>;
  getDueMessages(): Promise<ScheduledMessage[]>;
  removeMessage(id: string): Promise<void>;
}

export interface IMessageService {
  scheduleMessage(time: string | number | Date, message: string): Promise<void>;
  getDueMessages(): Promise<ScheduledMessage[]>;
  removeMessage(id: string): Promise<void>;
}

export interface Logger {
  log: (message: string) => void;
  error?: (message: string) => void;
}