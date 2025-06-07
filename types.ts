export interface ScheduledMessage {
  id: string;
  message: string;
  timestamp: number;
}

export interface IHashCacheStore {
  set(key: string, value: Record<string, any>): Promise<void>;
  add(set: string, score: number, member: string): Promise<void>;
  getRangeByScore(set: string, min: number, max: number): Promise<string[]>;
  remove(set: string, member: string): Promise<void>;
  pipeline(): any;
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
  error: (message: string) => void;
}

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
};