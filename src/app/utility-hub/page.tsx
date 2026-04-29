'use client';

import React from 'react';
import Link from 'next/link';

export default function UtilityHubPage() {
  return (
    <div className="container mx-auto px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center">
      <h1 className="cyber-h1 mb-8 text-center">
        UTILITY <span className="cyber-text-gradient">HUB</span>
      </h1>
      <p className="font-mono text-slate-400 mb-12 text-center max-w-lg uppercase tracking-widest">
        // ACCESS_RESTRICTED: MODULE_RECOVERY_IN_PROGRESS //
      </p>
      <Link href="/">
        <button className="brutalist-border px-8 py-3 bg-brand-orange text-cyber-black font-orbitron font-bold uppercase hover:scale-105 transition-all">
          Return to Hub
        </button>
      </Link>
    </div>
  );
}
