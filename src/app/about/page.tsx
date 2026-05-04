'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-6 py-12 min-h-[70vh] flex flex-col items-center justify-center">
      <h1 className="cyber-h1 mb-8 text-center">
        ABOUT <span className="cyber-text-gradient">D.ARCHITECT</span>
      </h1>
      <p className="font-mono text-slate-400 mb-12 text-center max-w-lg uppercase tracking-widest">
        // PROTOCOL_NAME: KING DRAGON // ROLE: TECH_EVANGELIST //
      </p>
      <Link href="/">
        <button className="brutalist-border px-8 py-3 bg-brand-orange text-cyber-black font-orbitron font-bold uppercase hover:scale-105 transition-all">
          Return to Hub
        </button>
      </Link>
    </div>
  );
}
