'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const BinaryRain = () => {
  const [columns, setColumns] = useState<number[]>([]);

  useEffect(() => {
    // Generate 20 columns of binary rain
    const cols = Array.from({ length: 20 }, (_, i) => i);
    setColumns(cols);
  }, []);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-48 overflow-hidden pointer-events-none z-0 opacity-20 dark:opacity-30">
      <div className="flex gap-4 px-2 h-full justify-end">
        {columns.map((col) => (
          <RainColumn key={col} delay={col * 0.8} />
        ))}
      </div>
    </div>
  );
};

const RainColumn = ({ delay }: { delay: number }) => {
  const [chars, setChars] = useState<string[]>([]);

  useEffect(() => {
    // Each column has 20-30 characters
    const binaryChars = Array.from({ length: 25 }, () => (Math.random() > 0.5 ? '1' : '0'));
    setChars(binaryChars);
  }, []);

  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: '100%' }}
      transition={{
        duration: 10 + Math.random() * 10,
        repeat: Infinity,
        ease: 'linear',
        delay: delay,
      }}
      className="flex flex-col font-mono text-[10px] text-brand-orange leading-none gap-2 whitespace-nowrap"
    >
      {chars.map((char, i) => (
        <span 
          key={i} 
          style={{ 
            opacity: 1 - (i / chars.length),
            textShadow: '0 0 5px #f97316'
          }}
        >
          {char}
        </span>
      ))}
    </motion.div>
  );
};
