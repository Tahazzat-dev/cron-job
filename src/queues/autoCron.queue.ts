// queues/autoCron.queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new IORedis();

export const autoCronQueue = new Queue('auto-cron-queue', {
  connection,
});
