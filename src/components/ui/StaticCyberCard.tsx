import React from 'react';

interface StaticCyberCardProps {
  children: React.ReactNode;
  className?: string;
}

export const StaticCyberCard: React.FC<StaticCyberCardProps> = ({ 
  children, 
  className = ''
}) => {
  return (
    <div className={`brutalist-card relative ${className}`}>
      {/* Decorative inner corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-orange/40 dark:border-brand-orange/20" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-orange/40 dark:border-brand-orange/20" />
      
      {children}
    </div>
  );
};
