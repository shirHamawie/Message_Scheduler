import { Request, Response } from 'express';
import { IMessageService } from '../types';

export class APIController {
  messageService: IMessageService;

  constructor(messageService: IMessageService) {
    this.messageService = messageService;
  }

  async echoAtTime(req: Request, res: Response): Promise<void> {
    try {
      const { time, message } = req.body;

      if (!time || !message) {
        res.status(400).send('Missing time or message');
        return;
      }

      const timestamp = new Date(time).getTime();
      if (isNaN(timestamp)) {
        res.status(400).send('Invalid time format');
        return;
      }

      await this.messageService.scheduleMessage(time, message);
      res.status(200).send('Message scheduled successfully');
    } catch (err) {
      console.error('Error scheduling message:', err);
      res.status(500).send('Internal server error');
    }
  }
}