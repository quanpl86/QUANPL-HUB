/**
 * Nhật ký đồng bộ trong bộ nhớ
 */
const syncLogs: any[] = [];

export function addSyncLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const logEntry = { 
        timestamp: new Date().toISOString(), 
        message, 
        type 
    };
    syncLogs.unshift(logEntry);
    
    // Giữ tối đa 50 bản ghi
    if (syncLogs.length > 50) syncLogs.pop();
    
    console.log(`[Log] [${type.toUpperCase()}] ${message}`);
}

export function getSyncLogs() {
    return syncLogs;
}

export default {
    addSyncLog,
    getSyncLogs
};
