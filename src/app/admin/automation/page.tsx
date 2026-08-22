'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Radio, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Import các sub-components
import { AutomationStats } from '@/components/admin/automation/AutomationStats';
import { ConnectionHub } from '@/components/admin/automation/ConnectionHub';
import { AgentBrainSetup } from '@/components/admin/automation/AgentBrainSetup';
import { LiveSystemLog } from '@/components/admin/automation/LiveSystemLog';
import { KnowledgeHub } from '@/components/admin/automation/KnowledgeHub';
import { OutlineEditor } from '@/components/admin/automation/OutlineEditor';
import { TopicPromptModal } from '@/components/admin/automation/TopicPromptModal';
import { ContentTaskManager } from '@/components/admin/automation/ContentTaskManager';

// Import Server Actions
import { 
  getAutomationSettings, 
  updateAutomationSetting, 
  getAutomationLogs, 
  getMCPKnowledgeFiles,
  getMCPNodes 
} from '@/app/actions/automation';
import { generateContentOutline, runFullContentPipelineFromOutline } from '@/app/actions/ai_workflow';
import { getContentTasks, getAutomationNotebooks, getWorkerStatus } from '@/app/actions/content-tasks';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<'connections' | 'agents' | 'knowledge' | 'workflow'>('connections');
  const [settings, setSettings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [mcpFiles, setMcpFiles] = useState<string[]>([]);
  const [selectedMcpFiles, setSelectedMcpFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // State cho Phê duyệt Lặp
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showOutlineEditor, setShowOutlineEditor] = useState(false);
  const [outlineData, setOutlineData] = useState<{ topic: string, outline: string, research: string } | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const [mcpNodes, setMcpNodes] = useState<any[]>([]);

  // Hybrid Mode State
  const [contentTasks, setContentTasks] = useState<any[]>([]);
  const [notebookConfigs, setNotebookConfigs] = useState<any[]>([]);
  const [workerStatus, setWorkerStatus] = useState<{ online: boolean; lastSeen: string | null }>({ online: false, lastSeen: null });

  // Callback để refresh Hybrid Mode data
  const refreshContentTasks = useCallback(async () => {
    try {
      const [tasksData, wStatus, logsData, nbConfigs] = await Promise.all([
        getContentTasks(),
        getWorkerStatus(),
        getAutomationLogs(20),
        getAutomationNotebooks()
      ]);
      setContentTasks(tasksData || []);
      setWorkerStatus(wStatus);
      setLogs(logsData || []);
      setNotebookConfigs(nbConfigs || []);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [settingsData, logsData, mcpFilesData, mcpNodesData, tasksData, nbConfigs, wStatus] = await Promise.all([
          getAutomationSettings(),
          getAutomationLogs(20),
          getMCPKnowledgeFiles(),
          getMCPNodes(),
          getContentTasks(),
          getAutomationNotebooks(),
          getWorkerStatus()
        ]);
        setSettings(settingsData || []);
        setLogs(logsData || []);
        setMcpFiles(mcpFilesData || []);
        setSelectedMcpFiles(mcpFilesData || []); 
        setMcpNodes(mcpNodesData || []);
        setContentTasks(tasksData || []);
        setNotebookConfigs(nbConfigs || []);
        setWorkerStatus(wStatus);
      } catch (error) {
        console.error('Failed to load automation data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Task 4.2: Đăng ký Realtime để cập nhật Task tự động
    const channel = supabase.channel('automation-tasks-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_tasks' },
        () => {
          console.log('[Realtime] Cập nhật tiến trình AI...');
          refreshContentTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshContentTasks]);

  const handleUpdateSetting = async (key: string, value: string) => {
    startTransition(async () => {
      const result = await updateAutomationSetting(key, value);
      if (result.success) {
        setSettings(prev => {
          const exists = prev.find(s => s.key_name === key);
          if (exists) {
            return prev.map(s => s.key_name === key ? { ...s, key_value: value } : s);
          }
          return [...prev, { key_name: key, key_value: value }];
        });
        toast.success(`Đã cập nhật ${key}`);
      } else {
        toast.error('Lỗi cập nhật cấu hình');
      }
    });
  };

  const handleStartPipeline = async () => {
    setShowTopicModal(true);
  };

  const handleConfirmTopic = async (topic: string) => {
    startTransition(async () => {
      toast.info(`Giai đoạn 1: Đang lập dàn ý cho: ${topic}...`);
      const result = await generateContentOutline(topic, selectedMcpFiles);
      
      if (result.success && result.data) {
        setOutlineData({
          topic,
          outline: result.data.outline,
          research: result.data.research
        });
        setShowOutlineEditor(true);
      } else {
        toast.error(`Lỗi lập dàn ý: ${result.error}`);
      }
    });
  };

  const handleConfirmOutline = async (editedOutline: string) => {
    if (!outlineData) return;
    
    setIsGeneratingContent(true);
    toast.info("Giai đoạn 2: Đang triển khai bài viết chi tiết...");

    try {
      const result = await runFullContentPipelineFromOutline(
        outlineData.topic,
        editedOutline,
        outlineData.research
      );

      if (result.success && result.data) {
        toast.success(`Pipeline hoàn thành! Bài viết đã sẵn sàng.`, {
          action: {
            label: 'XEM BẢN NHÁP',
            onClick: () => window.open(`/admin/posts/edit/${result.data.slug}`, '_blank')
          },
        });
        setShowOutlineEditor(false);
        setOutlineData(null);
        // Reload logs
        const logsData = await getAutomationLogs(20);
        setLogs(logsData || []);
      } else {
        toast.error(`Lỗi tạo bài viết: ${result.error}`);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi hệ thống.");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  return (
    <div className="transition-colors duration-300 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <span className="admin-eyebrow">AI & tích hợp</span>
          <h1 className="cyber-h1 text-3xl md:text-4xl">
            Quản lý <span className="cyber-text-gradient">tự động hóa</span>
          </h1>
          <p className="text-[var(--muted)] mt-2 text-sm">
            Kết nối dịch vụ, cấu hình AI Agent và theo dõi luồng xử lý. {isPending ? 'Đang xử lý...' : ''}
          </p>
        </div>
        
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[var(--card-bg)] border-2 border-slate-900 dark:border-brand-orange transition-all font-mono text-[10px] font-black uppercase shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#f97316] group active:translate-x-1 active:translate-y-1 active:shadow-none">
            <Radio size={14} className="group-hover:text-brand-orange" />
            Kiểm tra kết nối
          </button>
          <button 
            onClick={handleStartPipeline}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-white font-black uppercase text-[10px] font-mono border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
            Chạy quy trình
          </button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-4 gap-8"
      >
        <AutomationStats />

        <div className="lg:col-span-3 space-y-8">
          <div className="flex border-b-2 border-[var(--card-border)] gap-10 mb-6 font-orbitron">
            {[
              { id: 'connections', label: 'KẾT NỐI' },
              { id: 'agents', label: 'AI Agent' },
              { id: 'knowledge', label: 'Kho tri thức' },
              { id: 'workflow', label: 'Luồng xử lý' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 text-xs font-black tracking-widest uppercase transition-all relative ${
                  activeTab === tab.id ? 'text-brand-orange' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-[-2px] left-0 right-0 h-1 bg-brand-orange shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[450px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 font-mono text-[10px] text-[var(--muted)] uppercase tracking-widest">
                <Loader2 className="animate-spin mb-4 text-brand-orange" size={32} />
                Đang tải cấu hình...
              </div>
            ) : (
              <>
                {activeTab === 'connections' && <ConnectionHub settings={settings} onUpdate={handleUpdateSetting} mcpNodes={mcpNodes} />}
                {activeTab === 'agents' && <AgentBrainSetup settings={settings} onUpdate={handleUpdateSetting} />}
                {activeTab === 'knowledge' && (
                  <KnowledgeHub 
                    files={mcpFiles} 
                    selectedFiles={selectedMcpFiles} 
                    onToggleFile={(file) => {
                      setSelectedMcpFiles(prev => 
                        prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]
                      );
                    }} 
                  />
                )}
                {activeTab === 'workflow' && (
                  <ContentTaskManager
                    tasks={contentTasks}
                    notebooks={notebookConfigs}
                    workerStatus={workerStatus}
                    onRefresh={refreshContentTasks}
                  />
                )}
              </>
            )}
          </div>

          <LiveSystemLog logs={logs} />
        </div>
      </motion.div>

      {/* Outline Editor Modal */}
      {showOutlineEditor && outlineData && (
        <OutlineEditor 
          initialOutline={outlineData.outline}
          isGenerating={isGeneratingContent}
          onConfirm={handleConfirmOutline}
          onCancel={() => setShowOutlineEditor(false)}
        />
      )}

      {/* Topic Selection Modal */}
      <TopicPromptModal 
        isOpen={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        onConfirm={handleConfirmTopic}
      />
    </div>
  );
}
