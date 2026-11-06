'use client';

import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';

export default function TeamAttendance() {
  const [squad, setSquad] = useState([
    { id: 'ath-1', name: 'Marcus Vance', status: 'Present' },
    { id: 'ath-2', name: 'Tyrone Briggs', status: 'Present' },
    { id: 'ath-3', name: 'Devon Cole', status: 'Modified' },
    { id: 'ath-4', name: 'Chase Miller', status: 'Absent' },
  ]);

  const updateStatus = (id: string, nextStatus: 'Present' | 'Absent' | 'Modified') => {
    setSquad(prev => prev.map(ath => ath.id === id ? { ...ath, status: nextStatus } : ath));
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
      <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-emerald-400" />
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Daily Microcycle Attendance Roster</h3>
          <p className="text-[11px] text-slate-400">First At Sports Training Performance Squad Tracking</p>
        </div>
      </div>

      <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        {squad.map((athlete) => (
          <div key={athlete.id} className="p-4 flex items-center justify-between transition-colors hover:bg-slate-900/20">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-slate-200">{athlete.name}</span>
            </div>
            
            <div className="flex gap-1.5">
              <button
                type="button" onClick={() => updateStatus(athlete.id, 'Present')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${athlete.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-500 border-transparent hover:border-slate-800'}`}
              >
                Present
              </button>
              <button
                type="button" onClick={() => updateStatus(athlete.id, 'Modified')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${athlete.status === 'Modified' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-900 text-slate-500 border-transparent hover:border-slate-800'}`}
              >
                Modified
              </button>
              <button
                type="button" onClick={() => updateStatus(athlete.id, 'Absent')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${athlete.status === 'Absent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-900 text-slate-500 border-transparent hover:border-slate-800'}`}
              >
                Absent
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
