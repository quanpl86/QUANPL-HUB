import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

interface SyncLogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warn';
}

const syncLogs: SyncLogEntry[] = [];
const MAX_LOGS = 100; // Tăng nhẹ để an toàn

export function addSyncLog(message: string, type: SyncLogEntry['type'] = 'info') {
  const logEntry: SyncLogEntry = {
    timestamp: new Date().toISOString(),
    message,
    type
  };

  syncLogs.unshift(logEntry);

  // Giới hạn số lượng log
  if (syncLogs.length > MAX_LOGS) {
    syncLogs.pop();
  }

  // Log ra console theo mức độ
  switch (type) {
    case 'error':
      logger.error(message);
      break;
    case 'warn':
      logger.warn(message);
      break;
    case 'success':
      logger.info(`✅ ${message}`);
      break;
    default:
      logger.info(message);
  }
}

export function getSyncLogs(limit = 50): SyncLogEntry[] {
  return syncLogs.slice(0, limit);
}

// Optional: Clear logs
export function clearSyncLogs() {
  syncLogs.length = 0;
  logger.info('🧹 Sync logs cleared');
}

export default {
  addSyncLog,
  getSyncLogs,
  clearSyncLogs
};
