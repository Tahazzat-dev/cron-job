// queues/autoCron.queue.ts
import { Queue } from 'bullmq';
import getRedisInstance from '../config/redis';

const connection = getRedisInstance()

export const autoCronQueue = new Queue('auto-cron-queue', {
  connection,
});
