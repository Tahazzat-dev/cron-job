import CronLog from '../models/CronLog';
import getRedisInstance from '../config/redis';

const redis = getRedisInstance();

export const getCombinedLogs = async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const redisLogs = await redis.lrange(`cronlogs:${userId}`, 0, -1);
    const parsedRedisLogs = redisLogs.map(l => JSON.parse(l));

    const mongoLogs = await CronLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    const combinedLogs = [...parsedRedisLogs, ...mongoLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);

    res.json({ logs: combinedLogs });
  } catch (err) {
    console.error('[Get Logs Error]', err);
    res.status(500).json({ error: true, message: 'Failed to fetch logs' });
  }
};
