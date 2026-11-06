'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle, ShieldAlert, Clock, PlusCircle } from 'lucide-react';
import { ReturnToPlayStepper } from '@/types/athlete';
import { fetchRtpStepper } from '../services/supabaseService';

interface MedicalStepperProps {
  athleteId: string;
}

export default function MedicalStepperView({ athleteId }: MedicalStepperProps) {
  const [stepper, setStepper] = useState<ReturnToPlayStepper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStepper() {
      try {
        const data = await fetchRtpStepper(athleteId);
        setStepper(data);
      } catch (e) {
        console.warn('Clinical stepper context error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStepper();
  }, [athleteId]);

  const stages = [
    { nr: 1, name: 'Acute Protection', desc: 'Pain Modulation Sequence' },
    { nr: 2, name: 'Mechanotherapy', desc: 'Range of Motion Expansion' },
    { nr: 3, name: 'Biokinetic Force', desc: 'Strength Symmetry Test' },
    { nr: 4, name: 'Sport-Specific', desc: 'High-Speed Conditioning' },
    { nr: 5, name: 'Full Clearance', desc: 'Match/Competition Clearance' },
  ];

  // Default fallback mock array tracking matching exactly your medical encounter image view
  const currentActiveStage = stepper?.currentStage || 3;
  const statusTrack = stepper?.stageStatuses || ['Cleared', 'Cleared', 'Active Block', 'Pending', 'Pending'];

  if (loading) return <div className="text-center py-6 text-xs text-slate-500 font-mono">Querying Clinical Stepper Diagnostics...</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5"><Stethoscope className="w-4 h-4 text-teal-400" /> Return-To-Play Progression Stepper</h3>
          <p className="text-xs text-slate-400 font-sans">Multidisciplinary alignment tracks and functional milestones tracking</p>
        </div>
        <span className="text-xs font-mono font-black text-blue-400">Current: Stage {currentActiveStage} of 5</span>
      </div>

      {/* HORIZONTAL STEP MATRIX WIDGET BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {stages.map((st, idx) => {
          const status = statusTrack[idx];
          const isActive = currentActiveStage === st.nr;
          
          return (
            <div key={st.nr} className={`p-4 rounded-xl border transition-all ${
              status === 'Cleared' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
              isActive ? 'bg-blue-600/10 border-blue-500 text-blue-400 ring-1 ring-blue-500/30' :
              'bg-slate-950 border-slate-800/80 text-slate-500'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900">Stage {st.nr}</span>
                {status === 'Cleared' && <CheckCircle className="w-3.5 h-3.5" />}
                {isActive && <Clock className="w-3.5 h-3.5 animate-pulse" />}
              </div>
              <h4 className="text-xs font-bold text-white tracking-tight mt-1">{st.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* CLINICAL NOTE LOG TRANSCRIPTS FOOTER LIST */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-[10px] font-black uppercase text-slate-400">Multidisciplinary Clinical Notes Log</span>
          <button type="button" className="text-[10px] font-bold text-teal-400 flex items-center gap-1 hover:underline"><PlusCircle className="w-3 h-3" /> New Booking</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1">
              <span className="font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Sports Physician / MD</span>
              <span className="text-slate-500">2026-10-21</span>
            </div>
            <strong className="text-xs text-white font-sans block">Dr. Aris Thorne, MD</strong>
            <p className="text-slate-400 text-[11px] font-medium leading-relaxed mt-1">Subjective: Athlete reported sudden grab in right proximal hamstring muscle tissue layers during high-velocity 60m acceleration sequence execution block. Palpation yields localized discomfort.</p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1">
              <span className="font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">Biokineticist / Physio</span>
              <span className="text-slate-500">2026-10-28</span>
            </div>
            <strong className="text-xs text-white font-sans block">FAST Olympic Medical Institute</strong>
            <p className="text-slate-400 text-[11px] font-medium leading-relaxed mt-1">Objective: Active range of motion symmetric within 95% of contralateral limb value baseline bounds. Eccentric force asymmetry matching under 10% bounds checked on NordBord testing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
