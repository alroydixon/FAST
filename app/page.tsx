'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

// Dynamically bundle the layout client-side to keep rendering fast and stable
const LocalAthletePortal = dynamic(() => import('@/components/MainDashboard'), { ssr: false });

export default function Page() {
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  if (!isClientReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">
        Compiling Offline Sports Science Module Environment...
      </div>
    );
  }

  return <LocalAthletePortal />;
}
