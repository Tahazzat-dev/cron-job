import getRedisInstance from '../config/redis';

const redis = getRedisInstance();

// POST: Set value
export const addRedisValue = async (req:any, res:any) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Missing key or value.' });
  }

  try {
    await redis.set(key, value.toString());
    return res.json({ message: `Set value for '${key}'` });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to set value in Redis.', details: (error as Error).message });
  }
};

// GET: Get value
export const getRedisValue = async (req:any, res:any)  => {
  const { key } = req.query;

  if (typeof key !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid key.' });
  }

  try {
    const value = await redis.get(key);
    return res.json({ key, value });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get value from Redis.', details: (error as Error).message });
  }
};

// PUT: Update value (same logic as add)
export const updateRedisValue = async (req:any, res:any)  => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Missing key or value.' });
  }

  try {
    await redis.set(key, value.toString());
    return res.json({ message: `Updated value for '${key}'` });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update value in Redis.', details: (error as Error).message });
  }
};
