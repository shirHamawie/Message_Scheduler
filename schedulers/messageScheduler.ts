import redis from '../redisClient';
import { IMessageService, ScheduledMessage, Logger } from '../types';

const LOCK_EXPIRY_MS = 5000;
const LOCK_EXPIRY_UNIT = 'PX';
const LOCK_OPTION = 'NX';
const POLL_INTERVAL_DEFAULT = 1000;
const LOCK_VALUE = 'locked';
const ERROR_SCHEDULER = 'Error in scheduler:';

export class MessageScheduler {
  messageService: IMessageService;
  pollInterval: number;
  isPolling: boolean;
  logger: Logger;
  private stopped = false;

  constructor(
    messageService: IMessageService,
    logger: Logger,
    pollInterval = POLL_INTERVAL_DEFAULT,
  ) {
    this.messageService = messageService;
    this.pollInterval = pollInterval;
    this.isPolling = false;
    this.logger = logger;
  }

  async poll(): Promise<void> {
    if (this.isPolling || this.stopped) {
      return;
    }
    this.isPolling = true;

    try {
      const dueMessages: ScheduledMessage[] = await this.messageService.getDueMessages();

      for (const msg of dueMessages) {
        const { id, message } = msg;
        const lockKey = `lock:${id}`;

        const acquired = await redis.set(lockKey, LOCK_VALUE, LOCK_EXPIRY_UNIT, LOCK_EXPIRY_MS, LOCK_OPTION);

        if (acquired) {
          this.logger.log(message);
          await this.messageService.removeMessage(id);
        }
      }
    } catch (err) {
      this.logger.error(`${ERROR_SCHEDULER} ${err}`);
    } finally {
      this.isPolling = false;
      if (!this.stopped) {
        setTimeout(() => this.poll(), this.pollInterval);
      }
    }
  }

  start(): void {
    this.stopped = false;
    this.poll();
  }

  stop(): void {
    this.stopped = true;
  }
}