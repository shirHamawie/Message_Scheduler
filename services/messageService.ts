import { IMessageStore, IMessageService, ScheduledMessage } from '../types';

export class MessageService implements IMessageService {
  messageStore: IMessageStore;

  constructor(messageStore: IMessageStore) {
    this.messageStore = messageStore;
  }

  async scheduleMessage(time: string | number | Date, message: string): Promise<void> {
    await this.messageStore.addMessage(time, message);
  }

  async getDueMessages(): Promise<ScheduledMessage[]> {
    return this.messageStore.getDueMessages();
  }

  async removeMessage(id: string): Promise<void> {
    await this.messageStore.removeMessage(id);
  }
}