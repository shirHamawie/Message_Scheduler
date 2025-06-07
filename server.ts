import express from 'express';
import redis from './redisClient';
import { RedisCacheStore } from './messageStores/redisCacheStore';
import { RedisMessageStore } from './messageStores/redisMessageStore';
import { MessageService } from './services/messageService';
import { MessageScheduler } from './schedulers/messageScheduler';
import { APIController } from './controllers/APIController';

const ROUTE_ECHO_AT_TIME = '/echoAtTime';
const SERVER_RUNNING_MSG = 'Server running on port';
const DEFAULT_PORT = 3000;

const app = express();
app.use(express.json());

const redisCache = new RedisCacheStore(redis);
const redisMessageStore = new RedisMessageStore(redisCache);
const messageService = new MessageService(redisMessageStore);
const messageScheduler = new MessageScheduler(messageService, console);
const apiController = new APIController(messageService);

app.post(ROUTE_ECHO_AT_TIME, (req, res) => apiController.echoAtTime(req, res));

messageScheduler.start();

const PORT = process.env.PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`${SERVER_RUNNING_MSG} ${PORT}`);
});