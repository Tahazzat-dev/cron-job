import getRedisInstance from '../config/redis'
import CronLog from '../models/CronLog';
import { connectDB } from '../config/db';

const redis = getRedisInstance();

// Connect to MongoDB
const init = async () => {
  await connectDB();
}
init()

export async function flushLogsToMongo() {
  const keys = await redis.keys('cronlogs:*');

  for (const key of keys) {
    // const userId = key.split(':')[1];
    const logs = await redis.lrange(key, 0, -1);
    if (logs.length > 0) {
      const parsedLogs = logs.map(l => JSON.parse(l));
      console.log(parsedLogs,' parsed logs')
      // Save to MongoDB
      await CronLog.insertMany(parsedLogs);

      // Clear Redis after persisting
      await redis.del(key);
    }
  }
  console.log(`[Batch Flush] Flushed ${keys.length} users' logs`);
}
