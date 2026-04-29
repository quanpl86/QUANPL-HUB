import React from 'react';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const CyberButton: React.FC<CyberButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseClasses = "relative font-orbitron font-bold uppercase tracking-wider px-6 py-3 transition-all duration-300 ease-in-out active:scale-95 flex items-center justify-center gap-2 group";
  
  const variants = {
    primary: "bg-brand-orange text-cyber-black brutalist-border hover:glow-orange cyber-cut",
    secondary: "bg-midnight-blue text-slate-50 brutalist-border-midnight hover:glow-midnight cyber-cut",
    outline: "bg-transparent text-brand-orange border-2 border-brand-orange cyber-cut hover:bg-brand-orange/10 hover:glow-orange"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-2 h-2 bg-slate-50/50 group-hover:bg-slate-50 transition-colors" />
      {children}
    </button>
  );
};
