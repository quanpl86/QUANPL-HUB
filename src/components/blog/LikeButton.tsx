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
      } catch {
        // Rollback
        setLiked(!newLiked);
        setCount(prev => !newLiked ? prev + 1 : prev - 1);
        toast.error('Không thể cập nhật lượt thích. Vui lòng thử lại.');
      }
    });
  };

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className={`
        group flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all duration-300
        ${liked 
          ? 'bg-brand-orange/20 border-brand-orange text-brand-orange shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
          : 'bg-background border-foreground/15 text-foreground/60 hover:border-brand-orange/60 hover:text-brand-orange'
        }
      `}
    >
      <Heart 
        className={`w-5 h-5 transition-transform duration-300 ${liked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} 
      />
      <span className="text-sm font-semibold">
        {count} lượt thích
      </span>
      
    </button>
  );
}
