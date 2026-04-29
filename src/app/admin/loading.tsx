import React from 'react';

export default function AdminLoading() {
  return (
    <div className="w-full animate-pulse space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-64 bg-brand-orange/10 border border-brand-orange/20"></div>
        <div className="h-3 w-40 bg-cyber-black border border-brand-orange/5"></div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="h-[300px] bg-cyber-black border border-brand-orange/10"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-cyber-black border border-brand-orange/5"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
