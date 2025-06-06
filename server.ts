import express from 'express';
import redis from './redisClient';
import { RedisMessageStore } from './messageStores/redisMessageStore';
import { MessageService } from './services/messageService';
import { MessageScheduler } from './schedulers/messageScheduler';
import { APIController } from './controllers/APIController';

const app = express();
app.use(express.json());

const redisRepository = new RedisMessageStore(redis);
const messageService = new MessageService(redisRepository);
const messageScheduler = new MessageScheduler(messageService, console);
const apiController = new APIController(messageService);

app.post('/echoAtTime', (req, res) => apiController.echoAtTime(req, res));

messageScheduler.start();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});