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
  AlertTriangle,
  PlusCircle,
  UserCheck,
  Dumbbell,
  Stethoscope,
  UserPlus,
  Calendar
} from 'lucide-react';
import { AthleteProfile, TrainingSession, WellnessEntry, DailyLoadCalculation } from '@/types/athlete';
import { calculateLoadMetrics, calculateWellnessReadiness } from '../utils/sportsScience';
import { requestPersonalizedCoaching, LocalCoachingDirectiveResponse } from '../services/coachingAdvisor';
import { pushAthletesToSupabase, pushTrainingSessionsToSupabase, pushWellnessToSupabase, fetchAthleteDashboardData } from '../services/supabaseService';

// Lazy-load sub-modules to prevent chunk file clipping
import RoleRegistration from './RoleRegistration';
import MedicalHub from './MedicalHub';
import HistoryLedger from './HistoryLedger';

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
  // Navigation matrix controller routing hook
  const [activeTab, setActiveTab] = useState<'overview' | 'log-session' | 'log-wellness' | 'register' | 'medical' | 'history'>('overview');
  
  const [athlete, setAthlete] = useState<AthleteProfile>(DEFAULT_ATHLETE);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [coachingAdvice, setCoachingAdvice] = useState<LocalCoachingDirectiveResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Form states for tracking sRPE metrics
  const [sessionForm, setSessionForm] = useState({
    title: '',
    type: 'Sprints Acceleration',
    durationMinutes: 45,
    rpe: 6,
    avgHR: '',
    maxHR: '',
    distanceKm: '',
    notes: ''
  });

  // Form states matching Hooper-Mackinnon parameters
  const [wellnessForm, setWellnessForm] = useState({
    sleepHours: 7.5,
    sleepQuality: 3,
    soreness: 3,
    selectedSorenessAreas: [] as string[],
    fatigue: 3,
    stress: 3,
    mood: 3,
    morningRHR: '',
    morningHRV: '',
    hydrationLitres: 2.5,
    notes: ''
  });

  const muscleGroups = ['Hamstrings', 'Quadriceps', 'Calves', 'Glutes', 'Hip Flexors', 'Lower Back', 'Groin', 'Achilles'];
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAthleteDashboardData(athlete.id);
        if (data.sessions.length > 0 || data.wellness.length > 0) {
          setSessions(data.sessions);
          setWellness(data.wellness);
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          setSessions([{
            id: 'sess-init-1',
            athleteId: athlete.id,
            date: todayStr,
            title: 'Max Velocity Speed Blocks',
            type: 'Sprints Acceleration',
            durationMinutes: 60,
            rpe: 8,
            sessionLoad: 480
          }]);
        }
      } catch (err) {
        console.warn('Supabase local initialization offline. Operating via runtime fallback data layers.');
      }
    }
    loadData();
  }, [athlete.id]);

  const loadCalculations: DailyLoadCalculation[] = useMemo(() => {
    return calculateLoadMetrics(sessions, 30);
  }, [sessions]);

  const latestLoad = loadCalculations[loadCalculations.length - 1];
  
  const currentReadiness = useMemo(() => {
    if (wellness.length === 0) return { score: 80, status: 'Optimal' };
    const latest = wellness[0];
    return { score: latest.readinessScore, status: latest.status };
  }, [wellness]);

  useEffect(() => {
    async function evaluateCoachingEngine() {
      const response = await requestPersonalizedCoaching(athlete, latestLoad, wellness, undefined, sessions);
      setCoachingAdvice(response);
    }
    evaluateCoachingEngine();
  }, [athlete, latestLoad, wellness, sessions]);

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    const computedLoad = sessionForm.durationMinutes * sessionForm.rpe;

    const newSession: TrainingSession = {
      id: `sess-${Date.now()}`,
      athleteId: athlete.id,
      date: todayStr,
      title: sessionForm.title || 'Track Workout',
      type: sessionForm.type,
      durationMinutes: Number(sessionForm.durationMinutes),
      rpe: Number(sessionForm.rpe),
      sessionLoad: computedLoad,
      avgHR: sessionForm.avgHR ? Number(sessionForm.avgHR) : undefined,
      maxHR: sessionForm.maxHR ? Number(sessionForm.maxHR) : undefined,
      distanceKm: sessionForm.distanceKm ? Number(sessionForm.distanceKm) : undefined,
      notes: sessionForm.notes || undefined
    };

    setSessions(prev => [newSession, ...prev]);
    setSessionForm({ title: '', type: 'Sprints Acceleration', durationMinutes: 45, rpe: 6, avgHR: '', maxHR: '', distanceKm: '', notes: '' });
    setActiveTab('overview');
    setSyncStatus({ success: true, message: 'Session added locally! Remember to sync to update your tables.' });
  };

  const handleWellnessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const partialEntry = {
      sleepHours: wellnessForm.sleepHours,
      sleepQuality: wellnessForm.sleepQuality,
      soreness: wellnessForm.soreness,
      fatigue: wellnessForm.fatigue,
      stress: wellnessForm.stress,
      mood: wellnessForm.mood,
      morningRHR: wellnessForm.morningRHR ? Number(wellnessForm.morningRHR) : undefined
    };

    const metrics = calculateWellnessReadiness(partialEntry, athlete.restingHR);

    const newWellness: WellnessEntry = {
      id: `well-${Date.now()}`,
      athleteId: athlete.id,
      date: todayStr,
      ...partialEntry,
      sorenessAreas: wellnessForm.selectedSorenessAreas,
      morningHRV: wellnessForm.morningHRV ? Number(wellnessForm.morningHRV) : undefined,
      hydrationLitres: Number(wellnessForm.hydrationLitres),
      notes: wellnessForm.notes || undefined,
      readinessScore: metrics.readinessScore,
      status: metrics.status
    };

    setWellness(prev => [newWellness, ...prev]);
    setActiveTab('overview');
    setSyncStatus({ success: true, message: 'Wellness index added locally! Remember to sync to update your tables.' });
  };

  const toggleSorenessArea = (area: string) => {
    setWellnessForm(prev => ({
      ...prev,
      selectedSorenessAreas: prev.selectedSorenessAreas.includes(area)
        ? prev.selectedSorenessAreas.filter(a => a !== area)
        : [...prev.selectedSorenessAreas, area]
    }));
  };

  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const athResult = await pushAthletesToSupabase([athlete]);
      if (!athResult.success) throw new Error(athResult.message);
      const sessResult = await pushTrainingSessionsToSupabase(sessions);
      if (!sessResult.success) throw new Error(sessResult.message);
      const wellResult = await pushWellnessToSupabase(wellness);
      if (!wellResult.success) throw new Error(wellResult.message);
      setSyncStatus({ success: true, message: 'All telemetry arrays written successfully to Supabase!' });
    } catch (error: any) {
      setSyncStatus({ success: false, message: error.message || 'Sync failed.' });
    } finally {
      setIsSyncing(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 space-y-6">
      {/* Universal Structural App Navigation Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center border border-blue-400 shadow-md">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">
              First At Sports <span className="text-blue-400 font-medium">Training Performance</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Athlete Management System (AMS) &bull; Standalone Build</p>
          </div>
        </div>

        {/* Action Panel Routing Links */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('log-session')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'log-session' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            <Dumbbell className="w-3.5 h-3.5" /> Log Session
          </button>
          <button 
            onClick={() => setActiveTab('log-wellness')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'log-wellness' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Daily Wellness
          </button>
          <button 
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'register' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Onboard Profile
          </button>
          <button 
            onClick={() => setActiveTab('medical')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'medical' ? 'bg-teal-600 text-slate-950 shadow' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            <Stethoscope className="w-3.5 h-3.5" /> Medical EMR Hub
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            <Calendar className="w-3.5 h-3.5" /> Trends History
          </button>
          <button
            onClick={handleCloudSync} disabled={isSyncing}
            className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync To Cloud</span>
          </button>
        </div>
      </header>

      {/* Database notification tracking response alerts */}
      {syncStatus && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
          syncStatus.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {syncStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{syncStatus.message}</span>
        </div>
      )}

      {/* OVERVIEW PANEL DISPLAY TRACKS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-400" /> Acute:Chronic Workload
              </span>
              <div className="text-3xl font-black text-white font-mono">{latestLoad?.acwr.toFixed(2) || '1.00'}</div>
              <p className="text-xs text-slate-400 truncate">{latestLoad?.riskCategory || 'Optimal Sweet Spot'}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" /> 7-Day Acute Load Mean
              </span>
              <div className="text-3xl font-black text-orange-400 font-mono">{latestLoad?.acuteLoad || 0} <span className="text-xs font-normal text-slate-500">AU</span></div>
              <p className="text-xs text-slate-400">Foster sRPE Training impulse value</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-teal-400" /> Subjective Readiness
              </span>
              <div className="text-3xl font-black text-teal-400 font-mono">{currentReadiness.score}<span className="text-xs font-normal text-slate-500">/100</span></div>
              <p className="text-xs text-slate-400">Hooper-Mackinnon Composite Level: {currentReadiness.status}</p>
            </div>
          </div>

          {coachingAdvice && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Local System Performance Directives
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Calculated using threshold parameters.</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono rounded font-black">{coachingAdvice.readinessVerdict}</span>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Engine Diagnosis Summary</span>
                <p className="text-sm text-slate-200 font-medium leading-relaxed">{coachingAdvice.summary}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-blue-400 font-bold uppercase">Target Workout Structure</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{coachingAdvice.sessionRecommendation}</p>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-teal-400 font-bold uppercase">Physiological Framework</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{coachingAdvice.physiologicalRationale}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* SESSION LOG PANEL */}
      {activeTab === 'log-session' && (
        <form onSubmit={handleSessionSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl mx-auto shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3"><PlusCircle className="w-5 h-5 text-blue-400" /> Log Training Session</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400">Workout Title</label>
              <input type="text" required placeholder="e.g. Block Acceleration Sprint" value={sessionForm.title} onChange={e => setSessionForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400">Category Type</label>
              <select value={sessionForm.type} onChange={e => setSessionForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"><option>Sprints Acceleration</option><option>Max Velocity Endurance</option><option>Strength &amp; Power Lift</option><option>Plyometric Block</option></select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between"><span>Duration</span><span className="text-blue-400 font-black">{sessionForm.durationMinutes}m</span></label>
              <input type="range" min="10" max="180" step="5" value={sessionForm.durationMinutes} onChange={e => setSessionForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between"><span>RPE Intensity</span><span className="text-orange-400 font-black">Borg {sessionForm.rpe}</span></label>
              <input type="range" min="1" max="10" step="1" value={sessionForm.rpe} onChange={e => setSessionForm(p => ({ ...p, rpe: Number(e.target.value) }))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-xs uppercase text-white shadow-md">Process and Save Session Metrics</button>
        </form>
      )}

      {/* HOOPER-MACKINNON COMPOSITE WELLNESS LOG */}
      {activeTab === 'log-wellness' && (
        <form onSubmit={handleWellnessSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl mx-auto shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3"><UserCheck className="w-5 h-5 text-teal-400" /> Daily Wellness Questionnaire</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between"><span>Sleep Hours</span><span className="text-teal-400 font-black">{wellnessForm.sleepHours}h</span></label>
              <input type="range" min="4" max="11" step="0.5" value={wellnessForm.sleepHours} onChange={e => setWellnessForm(p => ({ ...p, sleepHours: Number(e.target.value) }))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between"><span>Fatigue Index</span><span className="text-orange-400 font-black">{wellnessForm.fatigue}/5</span></label>
              <input type="range" min="1" max="5" step="1" value={wellnessForm.fatigue} onChange={e => setWellnessForm(p => ({ ...p, fatigue: Number(e.target.value) }))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 block">Sore Muscle Areas</label>
            <div className="flex flex-wrap gap-1.5">{muscleGroups.map(group => { const isActive = wellnessForm.selectedSorenessAreas.includes(group); return ( <button key={group} type="button" onClick={() => toggleSorenessArea(group)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isActive ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}>{group}</button> ); })}</div>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-black text-xs uppercase text-white shadow-md">Evaluate Wellness Index</button>
        </form>
      )}

      {/* MODULE ROUTING SEGMENTS SUB-VIEWS */}
      {activeTab === 'register' && (
        <div className="animate-fadeIn">
          <RoleRegistration onOnboardingComplete={(prof) => { setSyncStatus({ success: true, message: `Profile initialized: ${prof.role.toUpperCase()} (ID: ${prof.id})` }); setActiveTab('overview'); }} />
        </div>
      )}

      {activeTab === 'medical' && (
        <div className="animate-fadeIn">
          <MedicalHub athleteId={athlete.id} clinicianId="med-staff-default" onRecordCommitted={() => setSyncStatus({ success: true, message: 'Clinical EMR entries committed successfully!' })} />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-fadeIn">
          <HistoryLedger athleteId={athlete.id} />
        </div>
      )}
    </div>
  );
}
