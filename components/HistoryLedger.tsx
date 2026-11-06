'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clipboard, Dumbbell, ShieldAlert, Heart, Activity } from 'lucide-react';
import { TrainingSession, MedicalRecord } from '@/types/athlete';
import { supabase } from '../services/supabase';

interface HistoryLedgerProps {
  athleteId: string;
}

export default function HistoryLedger({ athleteId }: HistoryLedgerProps) {
  // Tab Controller: 'sessions' | 'medical-soap'
  const [currentView, setCurrentView] = useState<'sessions' | 'medical-soap'>('sessions');
  const [sessionLogs, setSessionLogs] = useState<TrainingSession[]>([]);
  const [medicalLogs, setMedicalLogs] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function pullHistoricalLogs() {
      setIsLoading(true);
      try {
        const [sessRes, medRes] = await Promise.all([
          supabase.from('training_sessions').select('*').eq('athlete_id', athleteId).order('date', { ascending: false }),
          supabase.from('medical_records').select('*').eq('athlete_id', athleteId).order('date', { ascending: false })
        ]);

        if (sessRes.data) {
          setSessionLogs(sessRes.data.map((row: any) => ({
            id: row.id,
            athleteId: row.athlete_id,
            date: row.date,
            title: row.title,
            type: row.type,
            durationMinutes: Number(row.duration_minutes),
            rpe: row.rpe,
            sessionLoad: Number(row.session_load),
            avgHR: row.avg_hr,
            maxHR: row.max_hr,
            distanceKm: row.distance_km,
            notes: row.notes
          })));
        }

        if (medRes.data) {
          setMedicalLogs(medRes.data.map((row: any) => ({
            id: row.id,
            athleteId: row.athlete_id,
            clinicianId: row.clinician_id,
            date: row.date,
            encounterType: row.encounter_type,
            primaryComplaint: row.primary_complaint,
            objectiveFindings: row.objective_findings,
            assessmentDiagnosis: row.assessment_diagnosis,
            treatmentPlan: row.treatment_plan,
            clearanceStatus: row.clearance_status,
            restrictionNotes: row.restriction_notes
          })));
        }
      } catch (err) {
        console.error('History mapping error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    pullHistoricalLogs();
  }, [athleteId]);
  if (isLoading) {
    return <div className="text-center py-6 text-xs font-mono text-slate-500">Loading historical data registers...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-400" /> Performance Trends Ledger
          </h2>
          <p className="text-[11px] text-slate-400">Review log logs stored inside cloud database tables.</p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button" onClick={() => setCurrentView('sessions')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${currentView === 'sessions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Dumbbell className="w-3.5 h-3.5" /> Training Logs
          </button>
          <button
            type="button" onClick={() => setCurrentView('medical-soap')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${currentView === 'medical-soap' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Clipboard className="w-3.5 h-3.5" /> Clinical Records
          </button>
        </div>
      </div>

      {/* SESSIONS DATA MATRIX */}
      {currentView === 'sessions' ? (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Activity Details</th>
                <th className="p-3 text-center">Duration</th>
                <th className="p-3 text-center">RPE</th>
                <th className="p-3 text-right">Load (AU)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {sessionLogs.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500 font-mono text-[11px]">No workouts logged yet.</td></tr>
              ) : (
                sessionLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-400">{log.date}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{log.title}</div>
                      <div className="text-[10px] text-slate-500">{log.type}</div>
                    </td>
                    <td className="p-3 text-center font-mono">{log.durationMinutes}m</td>
                    <td className="p-3 text-center"><span className="px-1.5 py-0.5 rounded font-bold font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">{log.rpe}</span></td>
                    <td className="p-3 text-right font-black text-white font-mono">{log.sessionLoad}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* MEDICAL RECORDS TIMELINE MATRIX */
        <div className="space-y-3">
          {medicalLogs.length === 0 ? (
            <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl text-center text-slate-500 font-mono text-[11px]">No clinical documentation found.</div>
          ) : (
            medicalLogs.map((med) => (
              <div key={med.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-start border-b border-slate-800/60 pb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block">{med.date} &bull; ID: {med.id}</span>
                    <span className="text-xs font-black text-white uppercase">{med.encounterType}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wide ${
                    med.clearanceStatus === 'FULL_CLEARANCE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {med.clearanceStatus}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                  <div><span className="text-[10px] text-slate-500 block uppercase font-bold">Subjective History</span><p className="text-slate-300 font-medium">{med.primaryComplaint}</p></div>
                  <div><span className="text-[10px] text-slate-500 block uppercase font-bold">Objective Findings</span><p className="text-slate-300 font-medium">{med.objectiveFindings}</p></div>
                </div>
                {med.restrictionNotes && (
                  <div className="p-2.5 bg-rose-500/5 border border-rose-500/20 rounded-lg text-[11px] flex items-center gap-2 text-rose-400 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>Active Modification restriction:</strong> {med.restrictionNotes}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
