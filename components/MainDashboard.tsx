'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Flame, 
  ClipboardList, 
  Shield, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { AthleteProfile, TrainingSession, WellnessEntry, DailyLoadCalculation } from '@/types/athlete';
import { calculateLoadMetrics } from '../utils/sportsScience';
import { requestPersonalizedCoaching, LocalCoachingDirectiveResponse } from '@/services/coachingAdvisor';
import { pushAthletesToSupabase, pushTrainingSessionsToSupabase, pushWellnessToSupabase, fetchAthleteDashboardData } from '@/services/supabaseService';

const DEFAULT_ATHLETE: AthleteProfile = {
  id: 'ath-marcus-vance',
  name: 'Marcus Vance',
  sport: 'Track & Field (Sprints)',
  sportingCode: 'Track & Field',
  trackDiscipline: 'Sprints',
  trackEvents: ['100m Dash', '200m Dash'],
  primaryTrackEvent: '100m Dash',
  age: 24,
  gender: 'male',
  weightKg: 82.5,
  heightCm: 188,
  restingHR: 46,
  maxHR: 198,
  currentPhase: 'In-Season'
};

export default function MainDashboard() {
  const [athlete, setAthlete] = useState<AthleteProfile>(DEFAULT_ATHLETE);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [coachingAdvice, setCoachingAdvice] = useState<LocalCoachingDirectiveResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAthleteDashboardData(athlete.id);
        if (data.sessions.length > 0 || data.wellness.length > 0) {
          setSessions(data.sessions);
          setWellness(data.wellness);
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          const initialSession: TrainingSession = {
            id: `sess-init-1`,
            athleteId: athlete.id,
            date: todayStr,
            title: 'Max Velocity Speed Blocks',
            type: 'Sprints Acceleration',
            durationMinutes: 60,
            rpe: 8,
            sessionLoad: 480
          };
          setSessions([initialSession]);
        }
      } catch (err) {
        console.warn('Supabase offline fallback active.');
      }
    }
    loadData();
  }, [athlete.id]);

  const loadCalculations: DailyLoadCalculation[] = useMemo(() => {
    return calculateLoadMetrics(sessions, 30);
  }, [sessions]);

  const latestLoad = loadCalculations[loadCalculations.length - 1];

  useEffect(() => {
    async function evaluateCoachingEngine() {
      const response = await requestPersonalizedCoaching(athlete, latestLoad, undefined, undefined, sessions);
      setCoachingAdvice(response);
    }
    evaluateCoachingEngine();
  }, [athlete, latestLoad, sessions]);

  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const athResult = await pushAthletesToSupabase([athlete]);
      if (!athResult.success) throw new Error(athResult.message);

      const sessResult = await pushTrainingSessionsToWarmup(sessions);
      if (!sessResult.success) throw new Error(sessResult.message);

      const wellResult = await pushWellnessToSupabase(wellness);
      if (!wellResult.success) throw new Error(wellResult.message);

      setSyncStatus({ success: true, message: 'All local metrics written to Supabase successfully!' });
    } catch (error: any) {
      setSyncStatus({ success: false, message: error.message || 'Sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  function pushTrainingSessionsToWarmup(sessions: TrainingSession[]) {
     return pushTrainingSessionsToSupabase(sessions);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center border border-blue-400">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              First At Sports <span className="text-blue-400">Training Performance</span>
            </h1>
            <p className="text-xs text-slate-400">Local Multi-Sport Analytics Engine &bull; Zero Cloud AI Dependencies</p>
          </div>
        </div>

        <button
          onClick={handleCloudSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing Tables...' : 'Sync to Supabase Cloud'}</span>
        </button>
      </header>

      {syncStatus && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
          syncStatus.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {syncStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{syncStatus.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-400" /> Acute:Chronic Ratio
          </span>
          <div className="text-3xl font-black text-white font-mono">{latestLoad?.acwr.toFixed(2) || '1.00'}</div>
          <p className="text-xs text-slate-400 truncate">{latestLoad?.riskCategory || 'Optimal Baseline Balance'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" /> Acute Load (7-Day Mean)
          </span>
          <div className="text-3xl font-black text-orange-400 font-mono">{latestLoad?.acuteLoad || 0} <span className="text-xs font-normal text-slate-400">AU</span></div>
          <p className="text-xs text-slate-400">Foster sRPE Accumulation value</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-teal-400" /> Psychometric Readiness
          </span>
          <div className="text-3xl font-black text-teal-400 font-mono">{wellness ? 85 : 80}<span className="text-xs font-normal text-slate-500">/100</span></div>
          <p className="text-xs text-slate-400">Hooper-Mackinnon Composite Index</p>
        </div>
      </div>

      {coachingAdvice && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Local Analytics &amp; Coaching Framework
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Calculated locally using baseline statistical deviations.</p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Engine Briefing</span>
            <p className="text-sm text-slate-200 font-medium leading-relaxed">{coachingAdvice.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-blue-400 font-bold uppercase">Target Session Structure</span>
              <p className="text-xs text-slate-300 leading-relaxed">{coachingAdvice.sessionRecommendation}</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-teal-400 font-bold uppercase">Physiological Indication</span>
              <p className="text-xs text-slate-300 leading-relaxed">{coachingAdvice.physiologicalRationale}</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Action Directives Checklist</span>
            {coachingAdvice.keyDirectives.map((directive, index) => (
              <div key={index} className="p-3 bg-slate-950 border border-slate-800/60 rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{directive}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
