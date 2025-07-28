import { Worker } from 'bullmq';
import axios from 'axios';
import getRedisInstance from '../config/redis';
import { TDomain } from '../types/types';

const redis = getRedisInstance();

export const autoCronWorker = new Worker(
  'auto-cron-queue',
  async job => {
    console.log(job.data,' job from worker')
    return;
    const { userId, domain }: { userId: string; domain: TDomain } = job.data;
    const start = Date.now();
    const logKey = `cronlogs:${userId}`;

    let log;

    try {
      const res = await axios.get(domain.url, { timeout: 4000 });
      const duration = Date.now() - start;

      log = {
        userId,
        domain: domain.url,
        status: res.status,
        success: true,
        responseTime: duration,
        message: 'Success',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      const duration = Date.now() - start;

      const status = err?.response?.status || 0;
      const message =
        err?.response?.statusText ||
        err?.message ||
        (err?.request ? 'No response received' : 'Unknown error');

      log = {
        userId,
        domain: domain.url,
        status,
        success: false,
        responseTime: duration,
        message,
        timestamp: new Date().toISOString(),
      };
    }

    // Save log to Redis (last 100 logs)
    await redis.lpush(logKey, JSON.stringify(log));
    await redis.ltrim(logKey, 0, 99);

    console.log('[Cron Log]', log);
  },
  {
    connection: redis,
  }
);
