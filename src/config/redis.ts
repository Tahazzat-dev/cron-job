import Redis from 'ioredis';  // Redis is the class

let redisInstance: Redis | null = null;  // Redis here is the class type

function getRedisInstance(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis();

    redisInstance.on('connect', () => {
      console.log('Redis client connected');
    });

    redisInstance.on('error', (err) => {
      console.error('Redis client error:', err);
    });
  }

  return redisInstance;
}

export default getRedisInstance;
