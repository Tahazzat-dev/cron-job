import getRedisInstance from '../config/redis';
import User from '../models/User';
import { autoCronQueue } from '../queues/autoCron.queue';

const redis = getRedisInstance()
let intervalHandle: NodeJS.Timeout | null = null;
let currentInterval = 3000; // default 3s fallback
const REDIS_KEY = 'autoCronIntervalMs';

async function fetchIntervalFromDB(): Promise<number> {
  // Uncomment and replace this with actual DB call when ready
  // const config = await AdminConfig.findOne();
  // return (config?.autoCronIntervalSec ?? 3) * 1000;
  return 3000; // fallback default if DB disabled for now
}

async function getInterval() {
  try {
    const redisValue = await redis.get(REDIS_KEY);
    if (redisValue) {
      const interval = parseInt(redisValue, 10);
      if (!isNaN(interval)) {
        return interval;
      }
    }
  } catch (err) {
    console.error('Redis get error:', err);
  }

  // Fallback: fetch from DB if Redis key missing or error
  const intervalFromDB = await fetchIntervalFromDB();

  try {
    await redis.set(REDIS_KEY, intervalFromDB.toString());
  } catch (err) {
    console.error('Redis set error:', err);
  }

  return intervalFromDB;
}

async function scheduleAutoCrons() {
  const users = await User.find({
    'subscription.manualCronLimit': { $gt: 0 },
    packageExpiresAt: { $gte: new Date() },
  });

  for (const user of users) {
    for (const domain of user.manualCronDomains.slice(0, user.subscription.manualCronLimit)) {
      await autoCronQueue.add('auto-execute', {
        userId: user._id,
        domain,
      });
    }
  }

  console.log(`[${new Date().toISOString()}] Auto-cron scheduled for ${users.length} users`);
}

async function loadAndSchedule() {
  const intervalFromRedis = await getInterval();

  if (intervalFromRedis !== currentInterval) {
    console.log(`Updating auto-cron interval from ${currentInterval / 1000}s to ${intervalFromRedis / 1000}s`);

    if (intervalHandle) clearInterval(intervalHandle);

    currentInterval = intervalFromRedis;

    intervalHandle = setInterval(scheduleAutoCrons, currentInterval);
  }
}

async function init() {
  // Initial load & schedule
  await loadAndSchedule();

  // Check for config changes every 3 seconds (could be longer)
  setInterval(loadAndSchedule, 3000);
}

init();
