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
      // Gọi action để tạo task multimedia
      // Note: createContentTask cần được update để nhận tham số 'type' và 'result_post_id'
      // Ở đây tạm dùng metadata để truyền thông tin
      const result = await createContentTask(
        `[${type}] ${post.title}`, 
        post.notebook_id || '', 
        8, // Ưu tiên cao cho multimedia
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

  return (
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
  );
}
