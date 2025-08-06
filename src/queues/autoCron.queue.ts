// queues/autoCron.queue.ts
import { Queue } from 'bullmq';
import getRedisInstance from '../config/redis';

const connection = getRedisInstance()

export const autoCronQueue = new Queue('auto-cron-queue', { connection });
export const packageCleanupQueue = new Queue('package-cleanup-queue', { connection });
// Add more queues here as needed

// Optionally export them as a map or array if you want to iterate over them
export const allQueues = {
  autoCronQueue,
  packageCleanupQueue,
};

