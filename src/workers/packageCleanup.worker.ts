// workers/packageCleanup.worker.ts
import { Worker } from 'bullmq';
import getRedisInstance from '../config/redis';
import { autoCronQueue } from '../queues/autoCron.queue';

export const packageCleanupWorker = new Worker(
  'package-cleanup-queue',
  async (job) => {
    const { userId } = job.data;
    const jobSchedulers = await autoCronQueue.getJobSchedulers();

    for (const repeatJob of jobSchedulers) {
      const jobUserId = repeatJob.template?.data?.userId;

      if (jobUserId === userId) {
        await autoCronQueue.removeJobScheduler(repeatJob.key);
      }
    }

    // TODO: have to disable this console.
    console.log(`[${new Date().toISOString()}] Removed repeatable jobs for user ${userId}`);
  },
  { connection: getRedisInstance() }
);
