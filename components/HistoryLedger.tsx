'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clipboard, Dumbbell, ShieldAlert, TrendingUp } from 'lucide-react';
import { TrainingSession, MedicalRecord, TrackPerformanceRecord } from '@/types/athlete';
import { calculateLoadMetrics } from '../utils/sportsScience';
import { supabase } from '../services/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface HistoryLedgerProps {
  athleteId: string;
}

export default function HistoryLedger({ athleteId }: HistoryLedgerProps) {
  const [currentView, setCurrentView] = useState<'charts' | 'sessions' | 'medical-soap'>('charts');
  const [sessionLogs, setSessionLogs] = useState<TrainingSession[]>([]);
  const [medicalLogs, setMedicalLogs] = useState<MedicalRecord[]>([]);
  const [trackRecords, setTrackRecords] = useState<TrackPerformanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydration guard to force client-only graph layout assembly
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function pullHistoricalLogs() {
      setIsLoading(true);
      try {
        const [sessRes, medRes, trackRes] = await Promise.all([
          supabase.from('training_sessions').select('*').eq('athlete_id', athleteId).order('date', { ascending: true }),
          supabase.from('medical_records').select('*').eq('athlete_id', athleteId).order('date', { ascending: false }),
          supabase.from('track_performances').select('*').eq('athlete_id', athleteId).order('date', { ascending: true })
        ]);

        if (sessRes.data) {
          setSessionLogs(sessRes.data.map((row: any) => ({
            id: row.id, athleteId: row.athlete_id, date: row.date, title: row.title, type: row.type, durationMinutes: Number(row.duration_minutes), rpe: row.rpe, sessionLoad: Number(row.session_load), avgHR: row.avg_hr, maxHR: row.max_hr, distanceKm: row.distance_km, notes: row.notes
          })));
        }

        if (medRes.data) {
          setMedicalLogs(medRes.data.map((row: any) => ({
            id: row.id, athleteId: row.athlete_id, clinicianId: row.clinician_id, date: row.date, encounterType: row.encounter_type, primaryComplaint: row.primary_complaint, objectiveFindings: row.objective_findings, assessmentDiagnosis: row.assessment_diagnosis, treatmentPlan: row.treatment_plan, clearanceStatus: row.clearance_status, restrictionNotes: row.restriction_notes
          })));
        }

        if (trackRes.data) {
          setTrackRecords(trackRes.data.map((row: any) => ({
            id: row.id, athleteId: row.athlete_id, date: row.date, eventType: row.event_type, sessionType: row.session_type, timeSeconds: Number(row.time_seconds), velocityMs: row.velocity_ms, windReading: row.wind_reading, venueNotes: row.venue_notes
          })));
        }
      } catch (err) {
        console.error('Data pull metrics exception:', err);
      } finally {
        setIsLoading(false);
      }
    }
    pullHistoricalLogs();
  }, [athleteId]);

  const workloadChartData = useMemo(() => {
    if (sessionLogs.length === 0) return [];
    const analytics = calculateLoadMetrics(sessionLogs, 30);
    return analytics.map(item => ({
      date: item.date.slice(5), 
      'ACWR': item.acwr,
      'Acute Load': item.acuteLoad,
      'Chronic Load': item.chronicLoad
    }));
  }, [sessionLogs]);

  const trackChartData = useMemo(() => {
    return trackRecords.map(rec => ({
      date: rec.date.slice(5),
      'Time (s)': rec.timeSeconds,
      'Speed (m/s)': rec.velocityMs || 0
    }));
  }, [trackRecords]);
  if (isLoading) {
    return <div className="text-center py-12 text-xs font-mono text-slate-500 animate-pulse">Querying longitudinal athlete archives...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-400" /> Performance Analytics Ledger
          </h2>
          <p className="text-[11px] text-slate-400">First At Sports Training Performance Longitudinal Records</p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button type="button" onClick={() => setCurrentView('charts')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${currentView === 'charts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}><TrendingUp className="w-3.5 h-3.5" /> Analytics Charts</button>
          <button type="button" onClick={() => setCurrentView('sessions')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${currentView === 'sessions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}><Dumbbell className="w-3.5 h-3.5" /> Workout History</button>
          <button type="button" onClick={() => setCurrentView('medical-soap')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${currentView === 'medical-soap' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}><Clipboard className="w-3.5 h-3.5" /> Clinical SOAP</button>
        </div>
      </div>

      {currentView === 'charts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart Card 1: ACWR Workload Overlays */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-72">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider block mb-3">Rolling ACWR Workload Curve</span>
            {mounted && workloadChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={workloadChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="ACWR" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-600 py-20 text-xs font-mono">Insufficient training log data mapping points.</div>
            )}
          </div>

          {/* Chart Card 2: Track Sprint Timings Progressions */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-72">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider block mb-3">Track Event Speed Progression (m/s)</span>
            {mounted && trackChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={trackChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="Speed (m/s)" stroke="#f97316" strokeWidth={2.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-600 py-20 text-xs font-mono">Log track metrics times to see performance curves.</div>
            )}
          </div>
        </div>
      )}

      {currentView === 'sessions' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Session Details</th>
                <th className="p-3 text-center">Duration</th>
                <th className="p-3 text-center">RPE</th>
                <th className="p-3 text-right">Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {sessionLogs.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500 font-mono">No data marks logged.</td></tr>
              ) : (
                sessionLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/30">
                    <td className="p-3 font-mono text-slate-400">{log.date}</td>
                    <td className="p-3"><strong>{log.title}</strong><div className="text-[10px] text-slate-500">{log.type}</div></td>
                    <td className="p-3 text-center font-mono">{log.durationMinutes}m</td>
                    <td className="p-3 text-center"><span className="px-1.5 py-0.5 rounded font-bold font-mono bg-orange-500/10 text-orange-400">{log.rpe}</span></td>
                    <td className="p-3 text-right font-bold text-white font-mono">{log.sessionLoad}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {currentView === 'medical-soap' && (
        <div className="space-y-3">
          {medicalLogs.length === 0 ? (
            <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl text-center text-slate-500 font-mono">No active clinical EMR history logs.</div>
          ) : (
            medicalLogs.map(med => (
              <div key={med.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-mono text-slate-500 block">{med.date} &bull; Case File: {med.id}</span>
                <span className="text-xs font-black text-white uppercase">{med.encounterType} &bull; {med.clearanceStatus}</span>
                <p className="text-slate-300 text-[11px] font-medium"><strong>Complaint:</strong> {med.primaryComplaint}</p>
                <p className="text-slate-400 text-[11px]"><strong>Plan:</strong> {med.treatmentPlan}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
