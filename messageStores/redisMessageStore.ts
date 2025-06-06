import { v4 as uuidv4 } from 'uuid';
import redis from '../redisClient';
import { IMessageStore, ScheduledMessage } from '../types';

export class RedisMessageStore implements IMessageStore {
  private redisClient: typeof redis;

  constructor(redisClient: typeof redis) {
    this.redisClient = redisClient;
  }

  async addMessage(time: string | number | Date, message: string): Promise<string> {
    const timestamp = new Date(time).getTime();
    const id = uuidv4();

    await this.redisClient.hmset(`message:${id}`, {
      message,
      timestamp
    });

    await this.redisClient.zadd('scheduled_messages', timestamp, id);
    return id;
  }

  async getDueMessages(): Promise<ScheduledMessage[]> {
    const now = Date.now();
    const ids: string[] = await this.redisClient.zrangebyscore('scheduled_messages', 0, now);

    const pipeline = this.redisClient.pipeline();
    ids.forEach(id => pipeline.hgetall(`message:${id}`));
    const results = await pipeline.exec();

    const messages: ScheduledMessage[] = [];

    if (results) {
      results.forEach(([, data], idx) => {
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
    const multi = this.redisClient.multi();
    multi.zrem('scheduled_messages', id);
    multi.del(`message:${id}`);
    await multi.exec();
  }
}