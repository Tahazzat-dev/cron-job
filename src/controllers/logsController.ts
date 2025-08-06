import Transaction from '../models/Transaction';
import getRedisInstance from '../config/redis';
import CronLog from '../models/CronLog';

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
}


// admin cron logs
export const getAdminCronHistoryController = async (req: any, res: any) => {
  try {
    const {
      userId,
      domainType,
      domainUrl,
      status,
      page: rawPage = '1',
      limit: rawLimit = '20',
    } = req.query;

    const page = parseInt(rawPage as string, 10);
    const limit = parseInt(rawLimit as string, 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (userId) query.userId = userId;
    if (domainType) query['domainType'] = domainType;
    if (domainUrl) query['domain'] = domainUrl;
    if (status) query.status = Number(status);

    const [logs, total] = await Promise.all([
      CronLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CronLog.countDocuments(query),
    ]);

    return res.json({
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error('Error fetching cron history:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export const clearCronHistoryController = async (req: any, res: any) => {
  try {
    const { userId, domainType, domainUrl, status } = req.query;

    const query: any = {};

    if (userId) query.userId = userId;
    if (domainType) query.domainType = domainType;
    if (domainUrl) query.domain = domainUrl;
    if (status) query.status = Number(status);

    const result = await CronLog.deleteMany(query);

    return res.json({
      message: 'Cron history cleared successfully',
      deletedCount: result.deletedCount,
    });

  } catch (err) {
    console.error('Error clearing cron history:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// transaction history
export const getAllTransactionHistoryController = async (req: any, res: any) => {
  try {
    const {
      userId,
      status,
      packageId,
      page: rawPage = '1',
      limit: rawLimit = '20',
    } = req.query;

    const page = parseInt(rawPage as string, 10);
    const limit = parseInt(rawLimit as string, 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (userId) query.userId = userId;
    if (packageId) query.packageId = packageId;
    if (status) query.status = Number(status);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return res.json({
      transactions,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error('Error fetching transactions history:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export const clearAllTransactionHistoryController = async (req: any, res: any) => {
  try {
    const {  userId,status,packageId } = req.query;

    const query: any = {};

    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (packageId) query.packageId = packageId;

    const result = await CronLog.deleteMany(query);

    return res.json({
      message: 'Cron history cleared successfully',
      deletedCount: result.deletedCount,
    });

  } catch (err) {
    console.error('Error clearing cron history:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}


// cron history for user
export const getUserCronHistoryController = async (req: any, res: any) => {
  try {
    const {
      domainType,
      domainUrl,
      status,
      page: rawPage = '1',
      limit: rawLimit = '20',
    } = req.query;

    const page = parseInt(rawPage as string, 10);
    const limit = parseInt(rawLimit as string, 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    query.userId = req.user.id;;
    if (domainType) query['domainType'] = domainType;
    if (domainUrl) query['domain'] = domainUrl;
    if (status) query.status = Number(status);

    const [logs, total] = await Promise.all([
      CronLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CronLog.countDocuments(query),
    ]);

    return res.json({
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error('Error fetching cron history:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export const clearUserCronHistoryController = async (req: any, res: any) => {
  try {
    const { domainType, domainUrl, status } = req.query;

    const query: any = {userId:req.user.id};

    if (domainType) query.domainType = domainType;
    if (domainUrl) query.domain = domainUrl;
    if (status) query.status = Number(status);

    const result = await CronLog.deleteMany(query);

    return res.json({
      message: 'Cron history cleared successfully',
      deletedCount: result.deletedCount,
    });

  } catch (err) {
    console.error('Error clearing cron history:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// transaction hisotry
export const getTransactionHistoryController = async (req: any, res: any) => {
  try {
    const {
      status,
      transactionHash,
      page: rawPage = '1',
      limit: rawLimit = '20',
    } = req.query;

    const page = parseInt(rawPage as string, 10);
    const limit = parseInt(rawLimit as string, 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    query.userId = req.user.id;;
    if (transactionHash) query['transactionHash'] = transactionHash;
    if (status) query.status = Number(status);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return res.json({
      transactions,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error('Error fetching transaction history:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

