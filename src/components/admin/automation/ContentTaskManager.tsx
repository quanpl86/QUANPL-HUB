'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, RefreshCw, X, ExternalLink, RotateCcw,
  Loader2, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createContentTask,
  cancelTask,
  retryTask,
  deleteTask
} from '@/app/actions/content-tasks';

interface ContentTask {
  id: string;
  topic_name: string;
  notebook_id: string | null;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  logs: string | null;
  result_post_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  tasks: ContentTask[];
  notebooks: { key_name: string; key_value: string }[];
  workerStatus: { online: boolean; lastSeen: string | null };
  onRefresh: () => void;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'CHỜ XỬ LÝ' },
  processing: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', label: 'ĐANG XỬ LÝ' },
  completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', label: 'HOÀN THÀNH' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'THẤT BẠI' },
  cancelled: { icon: X, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30', label: 'ĐÃ HỦY' },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
};

export function ContentTaskManager({ tasks, notebooks, workerStatus, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState('');
  const [notebookId, setNotebookId] = useState('');
  const [priority, setPriority] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const defaultNotebook = notebooks.find(n => n.key_name === 'NOTEBOOK_DEFAULT_ID')?.key_value || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await createContentTask(topic, notebookId || defaultNotebook, priority);
      if (result.success) {
        toast.success('Đã tạo đơn hàng AI thành công!');
        setTopic('');
        setPriority(5);
        setShowForm(false);
        onRefresh();
      } else {
        toast.error(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi hệ thống.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (taskId: string) => {
    const result = await cancelTask(taskId);
    if (result.success) {
      toast.success('Đã hủy tác vụ.');
      onRefresh();
    }
  };

  const handleRetry = async (taskId: string) => {
    const result = await retryTask(taskId);
    if (result.success) {
      toast.success('Đã gửi lại tác vụ.');
      onRefresh();
    }
  };

  const handleDelete = async (taskId: string) => {
    const result = await deleteTask(taskId);
    if (result.success) {
      toast.success('Đã xóa tác vụ.');
      onRefresh();
    }
  };

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const processingCount = tasks.filter(t => t.status === 'processing').length;

  return (
    <div className="space-y-6">
      {/* Worker Status Bar */}
      <div className="flex items-center justify-between p-4 border-2 border-[var(--card-border)] bg-[var(--card-bg)]">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-none ${workerStatus.online ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-[var(--foreground)]">
            Local Worker: {workerStatus.online ? 'TRỰC TUYẾN' : 'NGOẠI TUYẾN'}
          </span>
          {workerStatus.lastSeen && (
            <span className="font-mono text-[9px] text-[var(--muted)] uppercase">
              // Liên lạc cuối: {new Date(workerStatus.lastSeen).toLocaleTimeString('vi-VN')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] text-yellow-400 uppercase font-bold">
            Hàng đợi: {pendingCount} | Đang xử lý: {processingCount}
          </span>
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-white/5 transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={12} className="text-[var(--muted)]" />
          </button>
        </div>
      </div>

      {/* Header + New Task Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-orbitron font-bold text-xs uppercase tracking-widest text-[var(--foreground)]">
          Đơn hàng nội dung AI
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white font-black uppercase text-[10px] font-mono border-2 border-slate-900 dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <Plus size={12} />
          ĐẶT HÀNG AI
        </button>
      </div>

      {/* New Task Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={handleSubmit}
          >
            <div className="p-6 border-2 border-brand-orange/30 bg-[var(--card-bg)] space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-6 bg-brand-orange" />
                <h4 className="font-orbitron font-bold text-[10px] uppercase tracking-widest text-brand-orange">
                  Yêu cầu bài viết mới
                </h4>
              </div>

              {/* Topic */}
              <div>
                <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)] font-bold block mb-2">
                  Chủ đề bài viết *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="VD: Kỹ thuật điều khiển robot múa rối nước bằng LEGO EV3"
                  className="w-full bg-[var(--background)] border-2 border-[var(--card-border)] focus:border-brand-orange p-3 font-mono text-xs text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)]/50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Notebook */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)] font-bold block mb-2">
                    NotebookLM ID
                  </label>
                  <input
                    type="text"
                    value={notebookId}
                    onChange={(e) => setNotebookId(e.target.value)}
                    placeholder={defaultNotebook || 'Nhập Notebook ID hoặc để trống (dùng mặc định)'}
                    className="w-full bg-[var(--background)] border-2 border-[var(--card-border)] focus:border-brand-orange p-3 font-mono text-xs text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)]/50"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)] font-bold block mb-2">
                    Độ ưu tiên: {priority}/10
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="w-full accent-brand-orange h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between font-mono text-[8px] text-[var(--muted)] mt-1">
                    <span>THẤP</span>
                    <span>CAO</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !topic.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-black uppercase text-[10px] font-mono border-2 border-slate-900 shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  GỬI YÊU CẦU
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  HỦY
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[var(--card-border)] text-[var(--muted)]"
            >
              <Clock size={24} className="mb-3 opacity-40" />
              <p className="font-mono text-[10px] uppercase tracking-widest font-bold">
                Chưa có đơn hàng nào
              </p>
              <p className="font-mono text-[9px] mt-1 opacity-60">
                Nhấn &quot;ĐẶT HÀNG AI&quot; để bắt đầu
              </p>
            </motion.div>
          ) : (
            tasks.map((task) => {
              const config = statusConfig[task.status];
              const StatusIcon = config.icon;
              const isExpanded = expandedTask === task.id;

              return (
                <motion.div
                  key={task.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className={`border-2 ${config.bg} transition-all`}
                >
                  {/* Main Row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    {/* Status Icon */}
                    <StatusIcon
                      size={16}
                      className={`${config.color} flex-shrink-0 ${task.status === 'processing' ? 'animate-spin' : ''}`}
                    />

                    {/* Topic */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-orbitron font-bold text-[11px] text-[var(--foreground)] truncate uppercase">
                        {task.topic_name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`font-mono text-[8px] ${config.color} font-bold uppercase`}>
                          {config.label}
                        </span>
                        {task.notebook_id && (
                          <span className="font-mono text-[8px] text-[var(--muted)] uppercase">
                            NB: {task.notebook_id.substring(0, 12)}...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Priority Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-[8px] text-[var(--muted)] uppercase font-bold">
                        P{task.priority}
                      </span>
                      <span className="font-mono text-[8px] text-[var(--muted)]">
                        {new Date(task.created_at).toLocaleDateString('vi-VN')}
                      </span>
                      <ChevronDown
                        size={12}
                        className={`text-[var(--muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-[var(--card-border)]">
                          {/* Logs */}
                          {task.logs && (
                            <div className="mt-3 p-3 bg-[var(--background)] font-mono text-[10px] text-[var(--muted)] whitespace-pre-wrap leading-relaxed">
                              {task.logs}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            {task.status === 'completed' && task.result_post_id && (
                              <a
                                href={`/admin/posts/edit/${task.result_post_id}`}
                                target="_blank"
                                rel="noopener"
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white font-mono text-[9px] font-bold uppercase border border-green-700 hover:bg-green-500 transition-colors"
                              >
                                <ExternalLink size={10} />
                                XEM BẢN NHÁP
                              </a>
                            )}
                            {task.status === 'failed' && (
                              <button
                                onClick={() => handleRetry(task.id)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-mono text-[9px] font-bold uppercase border border-blue-700 hover:bg-blue-500 transition-colors"
                              >
                                <RotateCcw size={10} />
                                THỬ LẠI
                              </button>
                            )}
                            {task.status === 'pending' && (
                              <button
                                onClick={() => handleCancel(task.id)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-600 text-white font-mono text-[9px] font-bold uppercase border border-gray-700 hover:bg-gray-500 transition-colors"
                              >
                                <X size={10} />
                                HỦY
                              </button>
                            )}
                            {(task.status === 'pending' || task.status === 'cancelled') && (
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="flex items-center gap-1.5 px-4 py-2 text-red-400 font-mono text-[9px] font-bold uppercase hover:text-red-300 transition-colors"
                              >
                                <Trash2 size={10} />
                                XÓA
                              </button>
                            )}
                          </div>

                          {/* Meta */}
                          <div className="font-mono text-[8px] text-[var(--muted)] mt-3 uppercase">
                            ID: {task.id} | Cập nhật: {new Date(task.updated_at).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
