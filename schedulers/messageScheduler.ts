import redis from '../redisClient';
import { IMessageService, ScheduledMessage, Logger } from '../types';

export class MessageScheduler {
  messageService: IMessageService;
  pollInterval: number;
  isPolling: boolean;
  logger: Logger;

  constructor(
    messageService: IMessageService,
    logger: Logger,
    pollInterval = 1000,
  ) {
    this.messageService = messageService;
    this.pollInterval = pollInterval;
    this.isPolling = false;
    this.logger = logger;
  }

  async poll(): Promise<void> {
    if (this.isPolling) {
      return;
    }
    this.isPolling = true;

    try {
      const dueMessages: ScheduledMessage[] = await this.messageService.getDueMessages();

      for (const msg of dueMessages) {
        const { id, message } = msg;
        const lockKey = `lock:${id}`;

        const acquired = await redis.set(lockKey, 'locked', 'PX', 5000, 'NX');

        if (acquired) {
          this.logger.log(message);
          await this.messageService.removeMessage(id);
        }
      }
    } catch (err) {
      console.error('Error in scheduler:', err);
    } finally {
      this.isPolling = false;
      setTimeout(() => this.poll(), this.pollInterval);
    }
  }

  start(): void {
    this.poll();
  }
}