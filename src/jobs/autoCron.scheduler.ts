import getRedisInstance from '../config/redis';
import AdminConfig from '../models/AdminConfig';
import User from '../models/User';
import { autoCronQueue } from '../queues/autoCron.queue';
import { TDomain } from '../types/types';

const redis = getRedisInstance();
let cronScheduleIntervalHandle: NodeJS.Timeout | null = null;
let currentCronIntervalMs = 3000;
const REDIS_KEY = 'autoCronIntervalMs';
const CONFIG_CHECK_INTERVAL_MS = 3000;

async function fetchIntervalFromDB(): Promise<number> {
    try {
        const config = await AdminConfig.findOne();
        return (config?.autoCronIntervalSec ?? 3) * 1000;
    } catch (err) {
        console.error('Error fetching interval from DB:', err);
        return 3 * 1000;
    }
}

async function getInterval(): Promise<number> {
    try {
        const redisValue = await redis.get(REDIS_KEY);
        if (redisValue) {
            const parsedInterval = parseInt(redisValue, 10);
            if (!isNaN(parsedInterval) && parsedInterval > 0) {
                return parsedInterval;
            }
        }
    } catch (err) {
        console.error('Redis GET error in getInterval, falling back to DB:', err);
    }

    const intervalFromSource = await fetchIntervalFromDB();

    try {
        await redis.set(REDIS_KEY, intervalFromSource.toString());
    } catch (err) {
        console.error('Redis SET error in getInterval, value not cached:', err);
    }

    return intervalFromSource;
}

async function scheduleAutoCrons() {
  try {
    const users = await User.find({
      packageExpiresAt: { $gte: new Date() },
      $or: [
        { defaultDomains: { $elemMatch: { status: 'enabled' } } },
        { manualDomains: { $elemMatch: { status: 'enabled' } } }
      ]
    });

    if (users.length === 0) {
      console.log(`[${new Date().toISOString()}] No eligible users for auto-cron.`);
      return;
    }

    for (const user of users) {
      const activeDefaultDomains = user.defaultDomains.filter((d:TDomain) => d.status === 'enabled');
      const activeManualDomains = user.manualDomains.filter((d:TDomain) => d.status === 'enabled');

      const combinedDomains = [...activeDefaultDomains, ...activeManualDomains];

      if (combinedDomains.length === 0) continue;

      for (const domain of combinedDomains) {
        await autoCronQueue.add('auto-execute', {
          userId: user._id,
          domain,
        });
      }
    }

    // console.log(`[${new Date().toISOString()}] Auto-cron scheduled jobs for ${users.length} users.`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error during scheduleAutoCrons:`, err);
  }
}

 
async function manageCronScheduler() {
    const newDesiredIntervalMs = await getInterval();

    if (newDesiredIntervalMs !== currentCronIntervalMs || !cronScheduleIntervalHandle) {
        if (newDesiredIntervalMs !== currentCronIntervalMs) {
            console.log(`[${new Date().toISOString()}] Auto-cron interval updated from ${currentCronIntervalMs / 1000}s to ${newDesiredIntervalMs / 1000}s`);
        } else if (!cronScheduleIntervalHandle) {
            console.log(`[${new Date().toISOString()}] Initializing auto-cron scheduler with interval ${newDesiredIntervalMs / 1000}s`);
        }

        if (cronScheduleIntervalHandle) {
            clearInterval(cronScheduleIntervalHandle);
            cronScheduleIntervalHandle = null;
        }

        currentCronIntervalMs = newDesiredIntervalMs;
        cronScheduleIntervalHandle = setInterval(scheduleAutoCrons, currentCronIntervalMs);
    }
}

export async function initializeAutoScheduler() {
    console.log(`[${new Date().toISOString()}] Auto-scheduler initialization started.`);

    await manageCronScheduler();

    setInterval(manageCronScheduler, CONFIG_CHECK_INTERVAL_MS);

    console.log(`[${new Date().toISOString()}] Auto-scheduler initialization complete. Checking for config changes every ${CONFIG_CHECK_INTERVAL_MS / 1000}s.`);
}