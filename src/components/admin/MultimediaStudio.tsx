'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, Video, Play, Loader2, CheckCircle2, 
  AlertCircle, Music, Film, ExternalLink, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';
import { createContentTask } from '@/app/actions/content-tasks';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  title: string;
  audio_url?: string | null;
  video_url?: string | null;
  notebook_id?: string | null;
}

interface Props {
  post: Post;
  onTaskCreated?: () => void;
}

export function MultimediaStudio({ post, onTaskCreated }: Props) {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [currentTasks, setCurrentTasks] = useState<any[]>([]);

  // Task 4.2: Theo dõi tiến độ AI thời gian thực
  React.useEffect(() => {
    // 1. Lấy danh sách task hiện có cho bài này
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('content_tasks')
        .select('*')
        .eq('result_post_id', post.id)
        .in('type', ['AUDIO', 'VIDEO'])
        .order('created_at', { ascending: false });
      if (data) setCurrentTasks(data);
    };
    fetchTasks();

    // 2. Đăng ký kênh Realtime
    const channel = supabase
      .channel(`multimedia-tasks-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_tasks',
          filter: `result_post_id=eq.${post.id}`
        },
        (payload) => {
          console.log('[Realtime] Task update received:', payload);
          fetchTasks(); // Refresh danh sách khi có thay đổi
          if (payload.new && (payload.new as any).status === 'completed') {
            toast.success('Hệ thống AI đã hoàn tất yêu cầu!');
            // Reload trang nhẹ để lấy URL mới (hoặc có thể dùng callback để update post state)
            window.location.reload(); 
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  const handleGenerate = async (type: 'AUDIO' | 'VIDEO') => {
    if (type === 'AUDIO') setIsGeneratingAudio(true);
    else setIsGeneratingVideo(true);

    try {
      const result = await createContentTask(
        `[${type}] ${post.title}`, 
        post.notebook_id || '', 
        8, 
        type,
        post.id
      );

      if (result.success) {
        toast.success(`Đã gửi yêu cầu tạo ${type === 'AUDIO' ? 'Podcast' : 'Video Heritage'}!`);
        onTaskCreated?.();
      } else {
        toast.error(`Lỗi: ${result.error}`);
      }
    } catch (err) {
      toast.error('Không thể kết nối với AI Worker.');
    } finally {
      if (type === 'AUDIO') setIsGeneratingAudio(false);
      else setIsGeneratingVideo(false);
    }
  };

  const cleanupTasks = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tiến trình của bài viết này?')) return;
    
    try {
      const { error } = await supabase
        .from('content_tasks')
        .delete()
        .eq('result_post_id', post.id);

      if (error) throw error;
      toast.success('Đã dọn dẹp hàng đợi.');
      setCurrentTasks([]);
    } catch (err) {
      toast.error('Không thể dọn dẹp.');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & STATUS */}
      <div className="flex items-center justify-between p-4 bg-brand-orange/5 border-2 border-brand-orange/20 cyber-cut-sm">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-brand-orange animate-pulse" />
          <h2 className="text-sm font-orbitron font-bold tracking-widest uppercase text-brand-orange">
            AI Multimedia Studio
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={cleanupTasks}
            className="text-[10px] font-mono font-bold text-slate-500 hover:text-red-500 transition-colors uppercase"
          >
            [ DỌN DẸP HÀNG ĐỢI ]
          </button>
          <div className="h-4 w-px bg-brand-orange/20" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            <span className="text-[10px] font-mono text-green-500 uppercase font-bold">Realtime</span>
          </div>
        </div>
      </div>

      {/* ACTIVE TASKS PROGRESS */}
      {currentTasks.length > 0 && (
        <div className="space-y-3">
          {currentTasks.map((task) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 border-l-4 font-mono text-[10px] ${
                task.status === 'completed' ? 'border-green-500 bg-green-500/5' :
                task.status === 'failed' ? 'border-red-500 bg-red-500/5' :
                'border-brand-orange bg-brand-orange/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold uppercase tracking-wider">
                  {task.status === 'processing' ? '⚡ Đang xử lý:' : task.status === 'completed' ? '✅ Hoàn tất:' : '❌ Thất bại:'} {task.topic_name}
                </span>
                <span className="opacity-50">{new Date(task.created_at).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-3">
                {task.status === 'processing' && <Loader2 size={12} className="animate-spin text-brand-orange" />}
                <p className="opacity-80 italic truncate">{task.logs || 'Đang khởi tạo luồng công việc...'}</p>
              </div>
              {task.status === 'processing' && (
                <div className="mt-3 h-1 bg-brand-orange/10 overflow-hidden">
                  <motion.div 
                    className="h-full bg-brand-orange"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PODCAST STUDIO CARD */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="p-6 border-2 border-[var(--card-border)] bg-[var(--card-bg)] relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Mic size={80} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-orange/20 text-brand-orange">
              <Mic size={20} />
            </div>
            <h3 className="font-orbitron font-bold text-xs uppercase tracking-widest">
              Podcast Studio
            </h3>
          </div>

          <p className="font-mono text-[10px] text-[var(--muted)] mb-6 leading-relaxed uppercase">
            Tạo bản tin âm thanh tóm tắt nội dung bài viết bằng AI. 
            Giọng đọc chuyên nghiệp, hỗ trợ nghe offline.
          </p>

          {post.audio_url ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="font-mono text-[9px] text-green-400 font-bold uppercase">PODCAST ĐÃ SẴN SÀNG</span>
              </div>
              <audio controls className="w-full h-10 accent-brand-orange">
                <source src={post.audio_url} type="audio/mpeg" />
              </audio>
              <button 
                onClick={() => handleGenerate('AUDIO')}
                className="w-full py-2 border-2 border-[var(--card-border)] font-mono text-[9px] font-bold uppercase hover:bg-white/5 transition-colors"
              >
                Tạo lại bản mới
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleGenerate('AUDIO')}
              disabled={isGeneratingAudio}
              className="w-full flex items-center justify-center gap-3 py-3 bg-brand-orange text-white font-black uppercase text-[10px] font-mono border-2 border-slate-900 shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50"
            >
              {isGeneratingAudio ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isGeneratingAudio ? 'ĐANG KHỞI TẠO...' : 'KÍCH HOẠT PODCAST AI'}
            </button>
          )}
        </div>
      </motion.div>

      {/* VIDEO HERITAGE STUDIO CARD */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="p-6 border-2 border-[var(--card-border)] bg-[var(--card-bg)] relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Video size={80} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 text-blue-400">
              <Video size={20} />
            </div>
            <h3 className="font-orbitron font-bold text-xs uppercase tracking-widest">
              Video Heritage Studio
            </h3>
          </div>

          <p className="font-mono text-[10px] text-[var(--muted)] mb-6 leading-relaxed uppercase">
            Dựng Video tóm tắt phong cách Di sản văn hóa. 
            Kết hợp hình ảnh, nhạc nền và hiệu ứng chuyên sâu.
          </p>

          {post.video_url ? (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
                <CheckCircle2 size={16} className="text-blue-400" />
                <span className="font-mono text-[9px] text-blue-400 font-bold uppercase">VIDEO ĐÃ SẴN SÀNG</span>
              </div>
              <div className="aspect-video bg-black border border-[var(--card-border)] flex items-center justify-center relative group/video">
                <video src={post.video_url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/video:opacity-100 transition-opacity">
                  <a href={post.video_url} target="_blank" rel="noopener" className="p-3 bg-white text-black rounded-full">
                    <Play size={20} fill="currentColor" />
                  </a>
                </div>
              </div>
              <button 
                onClick={() => handleGenerate('VIDEO')}
                className="w-full py-2 border-2 border-[var(--card-border)] font-mono text-[9px] font-bold uppercase hover:bg-white/5 transition-colors"
              >
                Dựng lại video mới
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleGenerate('VIDEO')}
              disabled={isGeneratingVideo}
              className="w-full flex items-center justify-center gap-3 py-3 bg-blue-600 text-white font-black uppercase text-[10px] font-mono border-2 border-slate-900 shadow-[4px_4px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50"
            >
              {isGeneratingVideo ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Film size={14} />
              )}
              {isGeneratingVideo ? 'ĐANG DỰNG VIDEO...' : 'DỰNG VIDEO HERITAGE'}
            </button>
          )}
        </div>
      </motion.div>
      </div>
    </div>
  );
}
