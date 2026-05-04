import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

async function run() {
    const redis = new IORedis(REDIS_CONFIG);
    console.log("Connecting to Redis...");
    await redis.flushall();
    console.log("✅ Redis Flushed");
    process.exit(0);
}
run().catch(err => {
    console.error(err);
    process.exit(1);
});
