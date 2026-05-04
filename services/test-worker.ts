import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
});

const taskQueue = new Queue('content-tasks', { connection: redisConnection });

async function run() {
  const id = 'test-task-' + Date.now();
  console.log('Adding test task', id);
  await taskQueue.add('process-task', {
    id,
    type: 'blog',
    topic_name: 'TEST TASK FROM SCRIPT',
  }, { jobId: id });
  console.log('Done');
  process.exit(0);
}
run();
