import Redis from 'ioredis';
import { env } from '../config/env';

export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  tls: env.REDIS_TLS ? {} : undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
});

export function getHourWindowKey(senderEmail: string, date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  return `ratelimit:${senderEmail}:${year}${month}${day}_${hour}`;
}

export function getMsUntilNextHourWindow(date: Date = new Date()): number {
  const nextHour = new Date(date);
  nextHour.setUTCHours(date.getUTCHours() + 1, 0, 0, 0);
  return nextHour.getTime() - date.getTime() + 1000; // 1 second buffer into next hour
}

export async function checkAndIncrementHourlyLimit(
  senderEmail: string,
  hourlyLimit: number
): Promise<{ allowed: boolean; remainingMs: number; currentCount: number }> {
  const key = getHourWindowKey(senderEmail);

  // Lua script to atomically check and increment if under limit
  const luaScript = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local current = tonumber(redis.call('GET', key) or "0")

    if current >= limit then
      return {0, current}
    else
      local nextVal = redis.call('INCR', key)
      if nextVal == 1 then
        redis.call('EXPIRE', key, 7200) -- 2 hours TTL
      end
      return {1, nextVal}
    end
  `;

  const result = (await redisClient.eval(luaScript, 1, key, hourlyLimit.toString())) as [number, number];
  const allowed = result[0] === 1;
  const currentCount = result[1];
  const remainingMs = getMsUntilNextHourWindow();

  return { allowed, remainingMs, currentCount };
}
