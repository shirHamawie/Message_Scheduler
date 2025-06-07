import { v4 as uuidv4 } from 'uuid';
import { IMessageStore, ScheduledMessage, IHashCacheStore } from '../types';

const SCHEDULED_MESSAGES_SET = 'scheduled_messages';
export const MESSAGE_KEY_PREFIX = 'message:';

export class RedisMessageStore implements IMessageStore {
  private cache: IHashCacheStore;

  constructor(cache: IHashCacheStore) {
    this.cache = cache;
  }

  async addMessage(time: string | number | Date, message: string): Promise<string> {
    const timestamp = new Date(time).getTime();
    const id = uuidv4();

    await this.cache.set(`${MESSAGE_KEY_PREFIX}${id}`, {
      message,
      timestamp
    });

    await this.cache.add(SCHEDULED_MESSAGES_SET, timestamp, id);
    return id;
  }

  async getDueMessages(): Promise<ScheduledMessage[]> {
    const now = Date.now();
    const ids: string[] = await this.cache.getRangeByScore(SCHEDULED_MESSAGES_SET, 0, now);

    const pipeline = this.cache.pipeline();
    ids.forEach(id => pipeline.hgetall(`${MESSAGE_KEY_PREFIX}${id}`));
    const results = await pipeline.exec();

    const messages: ScheduledMessage[] = [];

    if (results) {
      results.forEach(([, data]: [any, any], idx: number) => {
        const hash = data as Record<string, string>;
        if (hash && hash.message && hash.timestamp) {
          messages.push({
            id: ids[idx],
            message: hash.message,
            timestamp: Number(hash.timestamp)
          });
        }
      });
    }
    return messages;
  }

  async removeMessage(id: string): Promise<void> {
    await this.cache.remove(SCHEDULED_MESSAGES_SET, id);
  }
}