import { Worker } from 'bullmq';
import axios from 'axios';
import getRedisInstance from '../config/redis';
// import { io } from '../socket'; // Socket.IO instance
import { TDomain } from '../types/types';

const redis = getRedisInstance();

export const autoCronWorker = new Worker(
  'auto-cron-queue',
  async job => {
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
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      const duration = Date.now() - start;

      let status = 0;
      let message = 'Unknown error';

      if (err.response) {
        status = err.response.status;
        message = err.response.statusText || err.message;
      } else if (err.request) {
        message = 'No response received';
      } else {
        message = err.message;
      }

      log = {
        userId,
        domain: domain.url,
        status,
        success: false,
        responseTime: duration,
        message,
        timestamp: new Date().toISOString()
      };
    }

    // Store in Redis and emit via Socket.IO
    await redis.lpush(logKey, JSON.stringify(log));
    await redis.ltrim(logKey, 0, 99);
    // io.to(userId).emit('cron-log', log);

    console.log('[Cron Log]', log);
  },
  { connection: redis }
);
