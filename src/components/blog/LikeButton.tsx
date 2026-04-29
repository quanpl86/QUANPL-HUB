'use client';

import React, { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleLike } from '@/app/actions/interactions';
import { toast } from 'sonner';

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  isLikedInitially: boolean;
}

export function LikeButton({ postId, initialLikes, isLikedInitially }: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(isLikedInitially);
  const [count, setCount] = useState(initialLikes);

  const handleLike = () => {
    // Optimistic UI
    const newLiked = !liked;
    setLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : prev - 1);

    startTransition(async () => {
      try {
        await toggleLike(postId);
      } catch (error) {
        // Rollback
        setLiked(!newLiked);
        setCount(prev => !newLiked ? prev + 1 : prev - 1);
        toast.error('SYSTEM_ERROR: Thao tác thất bại');
      }
    });
  };

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className={`
        group flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-300
        ${liked 
          ? 'bg-brand-orange/20 border-brand-orange text-brand-orange shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
          : 'bg-cyber-black/40 border-brand-orange/20 text-muted hover:border-brand-orange/60 hover:text-foreground'
        }
      `}
    >
      <Heart 
        className={`w-5 h-5 transition-transform duration-300 ${liked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} 
      />
      <span className="font-orbitron font-bold text-sm tracking-widest">
        {count} {count === 1 ? 'LIKE' : 'LIKES'}
      </span>
      
    </button>
  );
}
