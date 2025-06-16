// workers/autoCron.worker.ts
import { Worker } from 'bullmq';
import { connection } from '../queues/autoCron.queue';
import axios from 'axios';
import CronLog from '../models/CronLog';

export const autoCronWorker = new Worker(
  'auto-cron-queue',
  async job => {
    const { userId, domain } = job.data;

    const start = Date.now();
    try {
      const res = await axios.get(domain, { timeout: 5000 });
      const duration = Date.now() - start;

      await CronLog.create({
        userId,
        domain,
        status: res.status,
        responseTime: duration,
        message:"Success"
      });
    } catch (err: any) {
      const duration = Date.now() - start;
      await CronLog.create({
        userId,
        domain,
        responseTime: duration,
        message: err.message,
      });
    }
  },
  { connection }
);
