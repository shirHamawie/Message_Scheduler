import redis from '../redisClient';
import { IHashCacheStore } from '../types';
import { MESSAGE_KEY_PREFIX } from './redisMessageStore';

export class RedisCacheStore implements IHashCacheStore {
  private redisClient: typeof redis;

  constructor(redisClient: typeof redis) {
    this.redisClient = redisClient;
  }

  async set(key: string, value: Record<string, any>): Promise<void> {
    await this.redisClient.hset(key, value);
  }

  async add(set: string, score: number, member: string): Promise<void> {
    await this.redisClient.zadd(set, score, member);
  }

  async getRangeByScore(set: string, min: number, max: number): Promise<string[]> {
    return this.redisClient.zrangebyscore(set, min, max);
  }

  async remove(set: string, member: string): Promise<void> {
    const multi = this.redisClient.multi();
    multi.zrem(set, member);
    multi.del(`${MESSAGE_KEY_PREFIX}${member}`);
    await multi.exec();
  }

  pipeline() {
    return this.redisClient.pipeline();
  }
}