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
  Calendar,
  Clock,
  Dumbbell
} from 'lucide-react';
import { AthleteProfile, TrainingSession, WellnessEntry, DailyLoadCalculation } from '@/types/athlete';
import { calculateLoadMetrics, calculateWellnessReadiness } from '../utils/sportsScience';
import { requestPersonalizedCoaching, LocalCoachingDirectiveResponse } from '../services/coachingAdvisor';
import { pushAthletesToSupabase, pushTrainingSessionsToSupabase, pushWellnessToSupabase, fetchAthleteDashboardData } from '../services/supabaseService';

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
  // Navigation: 'overview' | 'log-session' | 'log-wellness'
  const [activeTab, setActiveTab] = useState<'overview' | 'log-session' | 'log-wellness'>('overview');
  
  const [athlete, setAthlete] = useState<AthleteProfile>(DEFAULT_ATHLETE);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [coachingAdvice, setCoachingAdvice] = useState<LocalCoachingDirectiveResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Form States for Training Session Log
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

  // Form States for Wellness Questionnaire
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
        console.warn('Supabase initialization idle. Running on local runtime parameters.');
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
    return { score: wellness[0].readinessScore, status: wellness[0].status };
  }, [wellness]);

  useEffect(() => {
    async function evaluateCoachingEngine() {
      const currentWellnessEntry = wellness.length > 0 ? wellness[0] : undefined;
      const response = await requestPersonalizedCoaching(
        athlete, 
        latestLoad, 
        currentWellnessEntry ? [currentWellnessEntry] : undefined, 
        undefined, 
        sessions
      );
      setCoachingAdvice(response);
    }
    evaluateCoachingEngine();
  }, [athlete, latestLoad, wellness, sessions]);

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
      setSyncStatus({ success: true, message: 'All local records successfully written to your Supabase tables!' });
    } catch (error: any) {
      setSyncStatus({ success: false, message: error.message || 'Synchronization error.' });
    } finally {
      setIsSyncing(false);
    }
  };
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
    setSessionForm({
      title: '',
      type: 'Sprints Acceleration',
      durationMinutes: 45,
      rpe: 6,
      avgHR: '',
      maxHR: '',
      distanceKm: '',
      notes: ''
    });
    setActiveTab('overview');
    setSyncStatus({ success: true, message: 'Session calculated locally! Remember to sync to update cloud database.' });
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
    setSyncStatus({ success: true, message: 'Hooper-Mackinnon index processed! Remember to sync to update cloud database.' });
  };

  const toggleSorenessArea = (area: string) => {
    setWellnessForm(prev => ({
      ...prev,
      selectedSorenessAreas: prev.selectedSorenessAreas.includes(area)
        ? prev.selectedSorenessAreas.filter(a => a !== area)
        : [...prev.selectedSorenessAreas, area]
    }));
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 space-y-6">
      {/* Platform Header Row */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center border border-blue-400 shadow-md">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">
              ApexTrack <span className="text-blue-400 font-medium">Performance</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Athlete Management Portal &bull; Machine Native Engine</p>
          </div>
        </div>

        {/* View Segment Controllers */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
          >
            Dashboard Overview
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
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync to Cloud</span>
          </button>
        </div>
      </header>

      {/* Dynamic Feedback Banner */}
      {syncStatus && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
          syncStatus.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {syncStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{syncStatus.message}</span>
        </div>
      )}

      {/* OVERVIEW VIEW PANEL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-400" /> Acute:Chronic Ratio (ACWR)
              </span>
              <div className="text-3xl font-black text-white font-mono">{latestLoad?.acwr.toFixed(2) || '1.00'}</div>
              <p className="text-xs text-slate-400 truncate">{latestLoad?.riskCategory || 'Optimal Sweet Spot'}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" /> Acute Workload (7-Day Avg)
              </span>
              <div className="text-3xl font-black text-orange-400 font-mono">{latestLoad?.acuteLoad || 0} <span className="text-xs font-normal text-slate-500">AU</span></div>
              <p className="text-xs text-slate-400">Foster sRPE Training Impulse</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-teal-400" /> Readiness Score
              </span>
              <div className="text-3xl font-black text-teal-400 font-mono">{currentReadiness.score}<span className="text-xs font-normal text-slate-500">/100</span></div>
              <p className="text-xs text-slate-400">Hooper-Mackinnon Index Status: {currentReadiness.status}</p>
            </div>
          </div>

          {coachingAdvice && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Local System Directives Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Calculated locally using real-time baseline threshold analysis.</p>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black font-mono tracking-wider ${
                  coachingAdvice.readinessVerdict === 'GREEN_LIGHT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                  coachingAdvice.readinessVerdict === 'AMBER_MODULATION' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {coachingAdvice.readinessVerdict}
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Engine Diagnosis</span>
                <p className="text-sm text-slate-200 font-medium leading-relaxed">{coachingAdvice.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Target Workout Prescription</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{coachingAdvice.sessionRecommendation}</p>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Physiological Mechanism</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{coachingAdvice.physiologicalRationale}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Action Directives Checklist</span>
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
      )}
      {/* LOG TRAINING SESSION PANEL VIEW */}
      {activeTab === 'log-session' && (
        <form onSubmit={handleSessionSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl mx-auto shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <PlusCircle className="w-5 h-5 text-blue-400" /> Log Custom Training Session
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400">Workout Title</label>
              <input 
                type="text" placeholder="e.g. Block Starts Acceleration"
                value={sessionForm.title}
                onChange={e => setSessionForm(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400">Session Type</label>
              <select 
                value={sessionForm.type}
                onChange={e => setSessionForm(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option>Sprints Acceleration</option>
                <option>Max Velocity Endurance</option>
                <option>Strength &amp; Power Lift</option>
                <option>Plyometric / Elasticity Block</option>
                <option>Active Tissue Recovery</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between">
                <span>Duration</span>
                <span className="font-mono text-blue-400 font-black">{sessionForm.durationMinutes} min</span>
              </label>
              <input 
                type="range" min="10" max="180" step="5" value={sessionForm.durationMinutes}
                onChange={e => setSessionForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between">
                <span>Subjective RPE (1-10)</span>
                <span className="font-mono text-orange-400 font-black">Borg {sessionForm.rpe}</span>
              </label>
              <input 
                type="range" min="1" max="10" step="1" value={sessionForm.rpe}
                onChange={e => setSessionForm(p => ({ ...p, rpe: Number(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Avg HR (BPM)</label>
              <input 
                type="number" placeholder="Optional" value={sessionForm.avgHR}
                onChange={e => setSessionForm(p => ({ ...p, avgHR: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Max HR (BPM)</label>
              <input 
                type="number" placeholder="Optional" value={sessionForm.maxHR}
                onChange={e => setSessionForm(p => ({ ...p, maxHR: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Distance (Km)</label>
              <input 
                type="number" step="0.1" placeholder="Optional" value={sessionForm.distanceKm}
                onChange={e => setSessionForm(p => ({ ...p, distanceKm: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-400">Technical Session Notes</label>
            <textarea 
              rows={2} placeholder="Log biomechanics elements, fatigue markers or spike indicators..."
              value={sessionForm.notes}
              onChange={e => setSessionForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button type="submit" className="w-full py-2.5 rounded-xl font-black text-xs uppercase bg-blue-600 hover:bg-blue-500 text-white tracking-wider shadow-md transition-all">
            Process Workout Metrics &amp; Save
          </button>
        </form>
      )}
      {/* LOG WELLNESS QUESTIONNAIRE PANEL VIEW */}
      {activeTab === 'log-wellness' && (
        <form onSubmit={handleWellnessSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl mx-auto shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserCheck className="w-5 h-5 text-teal-400" /> Hooper-Mackinnon Questionnaire
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between">
                <span>Sleep Duration</span>
                <span className="font-mono text-teal-400 font-black">{wellnessForm.sleepHours} Hours</span>
              </label>
              <input 
                type="range" min="4" max="11" step="0.5" value={wellnessForm.sleepHours}
                onChange={e => setWellnessForm(p => ({ ...p, sleepHours: Number(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between">
                <span>Sleep Quality</span>
                <span className="font-mono text-slate-300 font-bold">{wellnessForm.sleepQuality}/5</span>
              </label>
              <input 
                type="range" min="1" max="5" step="1" value={wellnessForm.sleepQuality}
                onChange={e => setWellnessForm(p => ({ ...p, sleepQuality: Number(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between">
                <span>Muscle Soreness</span>
                <span className="font-mono text-amber-400 font-black">{wellnessForm.soreness}/5</span>
              </label>
              <input 
                type="range" min="1" max="5" step="1" value={wellnessForm.soreness}
                onChange={e => setWellnessForm(p => ({ ...p, soreness: Number(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between">
                <span>Subjective Fatigue</span>
                <span className="font-mono text-orange-400 font-black">{wellnessForm.fatigue}/5</span>
              </label>
              <input 
                type="range" min="1" max="5" step="1" value={wellnessForm.fatigue}
                onChange={e => setWellnessForm(p => ({ ...p, fatigue: Number(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between">
                <span>Psychological Stress</span>
                <span className="font-mono text-purple-400 font-black">{wellnessForm.stress}/5</span>
              </label>
              <input 
                type="range" min="1" max="5" step="1" value={wellnessForm.stress}
                onChange={e => setWellnessForm(p => ({ ...p, stress: Number(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex justify-between">
                <span>Subjective Mood</span>
                <span className="font-mono text-pink-400 font-black">{wellnessForm.mood}/5</span>
              </label>
              <input 
                type="range" min="1" max="5" step="1" value={wellnessForm.mood}
                onChange={e => setWellnessForm(p => ({ ...p, mood: Number(e.target.value) }))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 block">Sore Muscle Groups</label>
            <div className="flex flex-wrap gap-1.5">
              {['Hamstrings', 'Quadriceps', 'Calves', 'Glutes', 'Hip Flexors', 'Lower Back', 'Groin', 'Achilles'].map(group => {
                const isActive = wellnessForm.selectedSorenessAreas.includes(group);
                return (
                  <button
                    key={group} type="button" onClick={() => toggleSorenessArea(group)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      isActive ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {group}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Morning Resting HR</label>
              <input 
                type="number" placeholder="Baseline: 46" value={wellnessForm.morningRHR}
                onChange={e => setWellnessForm(p => ({ ...p, morningRHR: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Morning HRV (ms)</label>
              <input 
                type="number" placeholder="Optional" value={wellnessForm.morningHRV}
                onChange={e => setWellnessForm(p => ({ ...p, morningHRV: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 rounded-xl font-black text-xs uppercase bg-teal-600 hover:bg-teal-500 text-white tracking-wider shadow-md transition-all">
            Process Wellness Index &amp; Log
          </button>
        </form>
      )}
    </div>
  );
}
