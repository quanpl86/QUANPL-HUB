import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import pino from 'pino';
import { processTaskDispatcher, TaskPayload } from './worker.js';

// Sử dụng logger đồng nhất với hệ thống
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
  enableReadyCheck: true,
  reconnectOnError: (err: Error) => {
    logger.warn({ err: err.message }, '🔄 Redis connection error, attempting to reconnect...');
    return true;
  },
};

const redisConnection = new IORedis(REDIS_CONFIG);

redisConnection.on('error', (err) => logger.error({ err }, '❌ Redis Connection Error'));
redisConnection.on('connect', () => logger.info('🔌 Redis Connected'));

/**
 * 1. Khởi tạo Queue
 */
export const taskQueue = new Queue('content-tasks', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 15000 },
    removeOnComplete: { age: 3600 * 24 * 7 },   // Giữ log 7 ngày
    removeOnFail: { age: 3600 * 24 * 30 },     // Giữ lỗi 30 ngày
    priority: 10,
  }
});

/**
 * 2. Khởi tạo Worker xử lý Task
 */
export const createTaskWorker = () => {
  const worker = new Worker('content-tasks', async (job: Job<TaskPayload>) => {
    const { id: taskId, type, topic_name } = job.data;
    
    logger.info({ jobId: job.id, taskId, type, topic: topic_name }, '🚀 Job picked up by worker');

    try {
      await processTaskDispatcher(job.data);
      
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error: any) {
      logger.error({ 
        jobId: job.id, 
        taskId, 
        error: error.message,
        stack: error.stack 
      }, '❌ Job processing failed');
      
      // Throw để BullMQ thực hiện retry theo cấu hình
      throw error;
    }
  }, {
    connection: redisConnection,
    concurrency: 1, // BẮT BUỘC: NotebookLM MCP không thể mở 2 trình duyệt cùng lúc với 1 profile
    limiter: {
      max: 10,
      duration: 60000 
    }
  });

  // Theo dõi các sự kiện của Worker
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, taskId: job.data.id }, '✅ Job completed successfully');
  });

  worker.on('failed', (job, err) => {
    logger.error({ 
      jobId: job?.id, 
      taskId: job?.data?.id, 
      error: err.message 
    }, '❌ Job failed after all retries');
  });

  worker.on('error', (err) => {
    logger.error({ err }, '🔥 Worker unexpected error');
  });

  return worker;
};

/**
 * 3. Thiết lập Dashboard (Bull Board)
 */
export function setupBullBoardUI(app: any) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(taskQueue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
  const port = process.env.PORT || 3005;
  logger.info(`📊 Bull Board UI ready at http://localhost:${port}/admin/queues`);
}

/**
 * 4. Graceful Shutdown cho BullMQ & Redis
 */
export const closeBullMQ = async () => {
  logger.info('🛑 Closing BullMQ connections...');
  try {
    await taskQueue.close();
    await redisConnection.quit();
    logger.info('✅ BullMQ & Redis shutdown complete');
  } catch (err) {
    logger.error({ err }, 'Error during BullMQ shutdown');
  }
};
