import { Request, Response } from 'express';
import { IMessageService, HTTP_STATUS } from '../types';

const ERROR_MISSING_FIELDS = 'Missing time or message';
const ERROR_INVALID_TIME = 'Invalid time format';
const ERROR_INTERNAL = 'Internal server error';
const SUCCESS_MESSAGE = 'Message scheduled successfully';
const ERROR_SCHEDULING = 'Error scheduling message:';

export class APIController {
  messageService: IMessageService;

  constructor(messageService: IMessageService) {
    this.messageService = messageService;
  }

  async echoAtTime(req: Request, res: Response): Promise<void> {
    try {
      const { time, message } = req.body;

      if (!time || !message) {
        res.status(HTTP_STATUS.BAD_REQUEST).send(ERROR_MISSING_FIELDS);
        return;
      }

      const timestamp = new Date(time).getTime();
      if (isNaN(timestamp)) {
        res.status(HTTP_STATUS.BAD_REQUEST).send(ERROR_INVALID_TIME);
        return;
      }

      await this.messageService.scheduleMessage(time, message);
      res.status(HTTP_STATUS.OK).send(SUCCESS_MESSAGE);
    } catch (err) {
      console.error(ERROR_SCHEDULING, err);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(ERROR_INTERNAL);
    }
  }
}