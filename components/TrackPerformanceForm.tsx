'use client';

import React, { useState } from 'react';
import { PlusCircle, Timer, Zap, CheckCircle2 } from 'lucide-react';
import { TrackPerformanceRecord } from '@/types/athlete';
import { pushTrackPerformance } from '../services/supabaseService';

interface TrackFormProps {
  athleteId: string;
  onRecordAdded: () => void;
}

export default function TrackPerformanceForm({ athleteId, onRecordAdded }: TrackFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    eventType: '100m' as TrackPerformanceRecord['eventType'],
    sessionType: 'Training Trial' as TrackPerformanceRecord['sessionType'],
    timeSeconds: '',
    windReading: '',
    venueNotes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);

    const seconds = Number(form.timeSeconds);
    let distance = 100;
    if (form.eventType === '60m') distance = 60;
    if (form.eventType === '200m') distance = 200;
    if (form.eventType === '400m') distance = 400;
    
    const computedVelocity = Number((distance / seconds).toFixed(2));

    const record: TrackPerformanceRecord = {
      id: `perf-${Date.now()}`,
      athleteId,
      date: new Date().toISOString().split('T')[0],
      eventType: form.eventType,
      sessionType: form.sessionType,
      timeSeconds: seconds,
      velocityMs: computedVelocity,
      windReading: form.windReading ? Number(form.windReading) : undefined,
      venueNotes: form.venueNotes || undefined
    };

    const res = await pushTrackPerformance(record);
    setIsSaving(false);
    if (res.success) {
      setMsg('Track sprint time recorded successfully!');
      setForm({ eventType: '100m', sessionType: 'Training Trial', timeSeconds: '', windReading: '', venueNotes: '' });
      onRecordAdded();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
      <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2 border-b border-slate-800 pb-2">
        <Timer className="w-4 h-4 text-blue-400" /> Log Track Event Data Mark
      </h3>
      
      {msg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase text-slate-400">Event Track</label>
          <select value={form.eventType} onChange={e => setForm(p => ({ ...p, eventType: e.target.value as any }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
            <option>60m</option>
            <option>100m</option>
            <option>200m</option>
            <option>400m</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase text-slate-400">Session Environment</label>
          <select value={form.sessionType} onChange={e => setForm(p => ({ ...p, sessionType: e.target.value as any }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
            <option>Training Trial</option>
            <option>Competition</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase text-slate-400">Time Duration (Seconds)</label>
          <input type="number" step="0.01" required placeholder="e.g. 10.45" value={form.timeSeconds} onChange={e => setForm(p => ({ ...p, timeSeconds: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase text-slate-400">Wind Gauge Reading (m/s)</label>
          <input type="number" step="0.1" placeholder="e.g. +1.2" value={form.windReading} onChange={e => setForm(p => ({ ...p, windReading: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-bold uppercase text-slate-400">Venue &amp; Context Notes</label>
        <input type="text" placeholder="Track elevation conditions, starting blocks adjustments..." value={form.venueNotes} onChange={e => setForm(p => ({ ...p, venueNotes: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
      </div>

      <button type="submit" disabled={isSaving} className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1">
        <Zap className="w-3.5 h-3.5" /> Save Performance Time Mark
      </button>
    </form>
  );
}
