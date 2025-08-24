import { Worker } from 'bullmq';
import axios from 'axios';
import getRedisInstance from '../config/redis';
import { IJobType, TDomain } from '../types/types';
import { ICronLog } from '../models/CronLog';
import mongoose from 'mongoose';

const redis = getRedisInstance();

export const autoCronWorker = new Worker(
  'auto-cron-queue',
  async job => {
    console.log(job.data, ' job from worker')
    
    const { userId, domain, type }:IJobType  = job.data;
    
    if(domain?.status && domain.status !=='enabled') return;


    const start = Date.now();
    const logKey = `cronlogs:${userId}`;

    let log: ICronLog;

    try {
      const res = await axios.get(domain.url, { timeout: 5000 });

      const duration = Date.now() - start;
      const message = "success"
      log = {
        userId: new mongoose.Types.ObjectId(userId),
        domain: domain.url,
        status: res.status,
        message,
        responseTime: duration,
        domainType: type,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {

      let message: string = ''
      if (err.code === 'ENOTFOUND') {
        message = "Oops! We can't connect to this domain."
      } else {
        message = err?.response?.statusText ||
          err?.message ||
          (err?.request ? 'No response received' : 'Unknown error');
      }

      const duration = Date.now() - start;
      const status = err?.response?.status || 0;
      log = {
        userId: new mongoose.Types.ObjectId(userId),
        domain: domain.url,
        status,
        responseTime: duration,
        message,
        domainType: type,
        timestamp: new Date().toISOString(),
      };
    }

    // Save log to Redis (last 100 logs)
    console.log(log, ' log before push')
    await redis.lpush(logKey, JSON.stringify(log));
    await redis.ltrim(logKey, 0, 99);
  },
  {
    connection: redis,
  }
);
