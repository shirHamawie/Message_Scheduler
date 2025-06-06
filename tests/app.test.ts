import request from 'supertest';
import express from 'express';
import redis from '../redisClient';
import { RedisMessageStore } from '../messageStores/redisMessageStore';
import { MessageService } from '../services/messageService';
import { MessageScheduler } from '../schedulers/messageScheduler';
import { APIController } from '../controllers/APIController';

jest.setTimeout(10000);

describe('Message Scheduler System', () => {
  let app: express.Express;
  let redisStore: RedisMessageStore;
  let messageService: MessageService;
  let apiController: APIController;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    redisStore = new RedisMessageStore(redis);
    messageService = new MessageService(redisStore);
    apiController = new APIController(messageService);

    app.post('/echoAtTime', (req, res) => apiController.echoAtTime(req, res));

    await redis.flushdb();
  });

  beforeEach(async () => {
    await redis.flushdb();
  });

  it('should schedule a message and retrieve it as due', async () => {
    const now = Date.now();
    const message = 'Test message';
    await messageService.scheduleMessage(now - 1000, message);

    const due = await messageService.getDueMessages();
    expect(due.length).toBeGreaterThan(0);
    expect(due[0].message).toBe(message);
  });

  it('should remove a message after processing', async () => {
    const now = Date.now();
    const message = 'To be removed';
    await messageService.scheduleMessage(now - 1000, message);

    let due = await messageService.getDueMessages();
    expect(due.find(m => m.message === message)).toBeTruthy();

    await messageService.removeMessage(due[0].id);

    due = await messageService.getDueMessages();
    expect(due.find(m => m.message === message)).toBeFalsy();
  });

  it('should schedule a message via API and return success', async () => {
    const response = await request(app)
      .post('/echoAtTime')
      .send({ time: new Date(Date.now() + 1000), message: 'API message' });

    expect(response.status).toBe(200);
    expect(response.text).toMatch(/Message scheduled successfully/);
  });

  it('should print due messages using the scheduler', async () => {
    const now = Date.now();
    const message = 'Scheduler test';
    await messageService.scheduleMessage(now - 1000, message);

    const logs: string[] = [];
    const logger = { log: (msg: string) => logs.push(msg) };

    const scheduler = new MessageScheduler(messageService, logger, 500);
    scheduler.start();

    await new Promise(resolve => setTimeout(resolve, 1200));

    expect(logs).toContain(message);
  });

  it('should not process the same message twice with concurrent schedulers', async () => {
    const now = Date.now();
    const message = 'No duplicates!';
    await messageService.scheduleMessage(now - 1000, message);

    const logs1: string[] = [];
    const logs2: string[] = [];
    const logger1 = { log: (msg: string) => logs1.push(msg) };
    const logger2 = { log: (msg: string) => logs2.push(msg) };

    const scheduler1 = new MessageScheduler(messageService, logger1, 200);
    const scheduler2 = new MessageScheduler(messageService, logger2, 200);

    scheduler1.start();
    scheduler2.start();

    await new Promise(resolve => setTimeout(resolve, 1200));

    const totalLogs = logs1.concat(logs2).filter(msg => msg === message);
    expect(totalLogs.length).toBe(1);
  });

  it('should return 400 for missing message or time', async () => {
    let response = await request(app)
      .post('/echoAtTime')
      .send({ message: 'Missing time' });
    expect(response.status).toBe(400);

    response = await request(app)
      .post('/echoAtTime')
      .send({ time: new Date() });
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid time format', async () => {
    const response = await request(app)
      .post('/echoAtTime')
      .send({ time: 'not-a-date', message: 'Bad time' });
    expect(response.status).toBe(400);
  });

  it('should persist messages across service restarts', async () => {
    const now = Date.now();
    const message = 'Persistent message';
    await messageService.scheduleMessage(now - 1000, message);

    // Simulate restart by creating new service and scheduler
    const newStore = new RedisMessageStore(redis);
    const newService = new MessageService(newStore);
    const logs: string[] = [];
    const logger = { log: (msg: string) => logs.push(msg) };
    const scheduler = new MessageScheduler(newService, logger, 200);

    scheduler.start();
    await new Promise(resolve => setTimeout(resolve, 1200));

    expect(logs).toContain(message);
  });

  it('should not process messages scheduled for the future', async () => {
    const future = Date.now() + 5000;
    const message = 'Future message';
    await messageService.scheduleMessage(future, message);

    const logs: string[] = [];
    const logger = { log: (msg: string) => logs.push(msg) };
    const scheduler = new MessageScheduler(messageService, logger, 200);

    scheduler.start();
    await new Promise(resolve => setTimeout(resolve, 1200));

    expect(logs).not.toContain(message);
  });
});