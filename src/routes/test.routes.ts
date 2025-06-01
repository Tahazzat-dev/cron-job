import { Router, Request, Response } from 'express';
import getRedisInstance from '../config/redis';

const router = Router();
const redis = getRedisInstance();

// POST: Set value
router.post('/set-redis-val', (req, res) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Missing key or value.' });
  }

  await redis.set(key, value);
  return res.json({ message: `Set value for '${key}'` });
});

// GET: Get value
router.get('/get-redis-val', async (req: Request, res: Response) => {
  const { key } = req.query;

  if (typeof key !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid key.' });
  }

  const value = await redis.get(key);
  return res.json({ key, value });
});

// PUT: Update value
router.put('/update-redis-val', async (req: Request, res: Response) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Missing key or value.' });
  }

  await redis.set(key, value);
  return res.json({ message: `Updated value for '${key}'` });
});

export default router;
