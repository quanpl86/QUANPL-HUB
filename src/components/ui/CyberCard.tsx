import React from 'react';
import { CyberCardAnimation } from './CyberCardAnimation';

interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const CyberCard: React.FC<CyberCardProps> = ({ 
  children, 
  className = '',
  delay = 0 
}) => {
  return (
    <CyberCardAnimation 
      delay={delay} 
      className={`brutalist-card brutalist-card-hover relative ${className}`}
    >
      {/* Decorative inner corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-orange/20" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-orange/20" />
      
      {children}
    </CyberCardAnimation>
  );
};
