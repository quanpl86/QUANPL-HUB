'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Mic, Video, Volume2, 
  Maximize2, Share2, Sparkles, Film, Music 
} from 'lucide-react';

interface Props {
  audioUrl?: string | null;
  videoUrl?: string | null;
  title: string;
}

export function PremiumMultimedia({ audioUrl, videoUrl, title }: Props) {
  const [activeTab, setActiveTab] = useState<'none' | 'audio' | 'video'>(
    videoUrl ? 'video' : audioUrl ? 'audio' : 'none'
  );

  if (!audioUrl && !videoUrl) return null;

  return (
    <div className="my-16 space-y-6">
      {/* Tab Selector */}
      <div className="flex gap-4">
        {audioUrl && (
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-3 px-6 py-3 font-orbitron text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${
              activeTab === 'audio' 
                ? 'bg-brand-orange text-white border-brand-orange shadow-[0_5px_15px_rgba(249,115,22,0.3)]' 
                : 'bg-transparent text-brand-orange border-brand-orange/20 hover:bg-brand-orange/5'
            }`}
          >
            <Mic size={14} /> PODCAST AI
          </button>
        )}
        {videoUrl && (
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-3 px-6 py-3 font-orbitron text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${
              activeTab === 'video' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-[0_5px_15px_rgba(37,99,235,0.3)]' 
                : 'bg-transparent text-blue-500 border-blue-500/20 hover:bg-blue-500/5'
            }`}
          >
            <Video size={14} /> VIDEO HERITAGE
          </button>
        )}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'audio' && audioUrl && (
          <motion.div
            key="audio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 bg-cyber-black border-2 border-brand-orange/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Music size={120} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 bg-brand-orange/10 border-2 border-brand-orange/30 flex items-center justify-center shadow-inner">
                <Mic size={40} className="text-brand-orange animate-pulse" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-orbitron font-bold text-xs text-brand-orange tracking-widest uppercase">Podcast AI Overview</h4>
                  <p className="text-foreground/80 text-sm italic">&quot;{title}&quot;</p>
                </div>
                <audio controls className="w-full h-12 accent-brand-orange">
                  <source src={audioUrl} type="audio/mpeg" />
                </audio>
                <p className="font-mono text-[9px] text-muted uppercase tracking-widest">
                  // BẢN TIN ÂM THANH ĐƯỢC TỰ ĐỘNG TẠO BỞI QUAN-PL AI AGENT //
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'video' && videoUrl && (
          <motion.div
            key="video"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="group relative aspect-video bg-cyber-black border-2 border-blue-500/20 overflow-hidden"
          >
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-blue-600 px-4 py-1">
              <Film size={12} className="text-white" />
              <span className="font-orbitron text-[9px] font-bold text-white uppercase tracking-widest">Heritage Experience</span>
            </div>
            
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              poster="/video-poster.jpg" // Có thể thay bằng ảnh đại diện bài viết
            />

            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">
                Visualizing Neural Knowledge: {title}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
