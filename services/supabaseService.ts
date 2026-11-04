import { supabase } from './supabase';
import { AthleteProfile, TrainingSession, WellnessEntry, DailyLoadCalculation } from '../types/athlete';

export interface SupabaseSyncResult {
  success: boolean;
  message: string;
  rowsCount?: number;
  errorDetails?: string;
}

/**
 * Pushes multiple athlete profiles to the cloud with automatic duplicate overrides (upsert).
 */
export async function pushAthletesToSupabase(athletes: AthleteProfile[]): Promise<SupabaseSyncResult> {
  if (athletes.length === 0) return { success: true, message: 'No athlete records to sync.', rowsCount: 0 };

  const dbRows = athletes.map((a) => ({
    id: a.id,
    name: a.name,
    sport: a.sport,
    sporting_code: a.sportingCode || 'Track & Field',
    track_discipline: a.trackDiscipline || null,
    track_events: a.trackEvents || [],
    primary_track_event: a.primaryTrackEvent || null,
    position: a.position || null,
    age: a.age,
    gender: a.gender,
    weight_kg: a.weightKg,
    height_cm: a.heightCm,
    resting_hr: a.restingHR,
    max_hr: a.maxHR,
    current_phase: a.currentPhase,
    coach_id: a.coachId || null,
    email: a.email || null,
    phone: a.phone || null,
    date_of_birth: a.dateOfBirth || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('athletes')
    .upsert(dbRows, { onConflict: 'id' });

  if (error) {
    return { success: false, message: 'Failed to sync athletes to database.', errorDetails: error.message };
  }

  return { success: true, message: `Synchronized ${dbRows.length} athletes successfully!`, rowsCount: dbRows.length };
}

/**
 * Syncs training logs to database. Accumulates sRPE loads seamlessly.
 */
export async function pushTrainingSessionsToSupabase(sessions: TrainingSession[]): Promise<SupabaseSyncResult> {
  if (sessions.length === 0) return { success: true, message: 'No training sessions to sync.', rowsCount: 0 };

  const dbRows = sessions.map((s) => ({
    id: s.id,
    athlete_id: s.athleteId,
    date: s.date,
    title: s.title,
    type: s.type,
    duration_minutes: s.durationMinutes,
    rpe: s.rpe,
    session_load: s.sessionLoad,
    avg_hr: s.avgHR || null,
    max_hr: s.maxHR || null,
    trimp: s.trimp || null,
    distance_km: s.distanceKm || null,
    notes: s.notes || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('training_sessions')
    .upsert(dbRows, { onConflict: 'id' });

  if (error) {
    return { success: false, message: 'Failed to sync training sessions.', errorDetails: error.message };
  }

  return { success: true, message: `Synchronized ${dbRows.length} sessions successfully!`, rowsCount: dbRows.length };
}

/**
 * Pushes psychometric wellness entries to database. Clears conflict overhead natively.
 */
export async function pushWellnessToSupabase(wellness: WellnessEntry[]): Promise<SupabaseSyncResult> {
  if (wellness.length === 0) return { success: true, message: 'No wellness items to sync.', rowsCount: 0 };

  const dbRows = wellness.map((w) => ({
    id: w.id,
    athlete_id: w.athleteId,
    date: w.date,
    sleep_hours: w.sleepHours,
    sleep_quality: w.sleepQuality,
    soreness: w.soreness,
    soreness_areas: w.sorenessAreas || [],
    fatigue: w.fatigue,
    stress: w.stress,
    mood: w.mood,
    morning_rhr: w.morningRHR || null,
    morning_hrv: w.morningHRV || null,
    hydration_litres: w.hydrationLitres || null,
    readiness_score: w.readinessScore,
    status: w.status,
    notes: w.notes || null,
  }));

  const { error } = await supabase
    .from('wellness_logs')
    .upsert(dbRows, { onConflict: 'id' });

  if (error) {
    return { success: false, message: 'Failed to sync daily wellness logs.', errorDetails: error.message };
  }

  return { success: true, message: `Synchronized ${dbRows.length} wellness entries successfully!`, rowsCount: dbRows.length };
}

/**
 * Fetches an isolated athlete's historical dashboard data completely offline-ready.
 */
export async function fetchAthleteDashboardData(athleteId: string): Promise<{
  sessions: TrainingSession[];
  wellness: WellnessEntry[];
}> {
  // Query both tables concurrently to maximize system execution speeds
  const [sessionsRes, wellnessRes] = await Promise.all([
    supabase.from('training_sessions').select('*').eq('athlete_id', athleteId).order('date', { ascending: false }),
    supabase.from('wellness_logs').select('*').eq('athlete_id', athleteId).order('date', { ascending: false })
  ]);

  const sessions: TrainingSession[] = (sessionsRes.data || []).map((row: any) => ({
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
    trimp: row.trimp,
    distanceKm: row.distance_km,
    notes: row.notes,
  }));

  const wellness: WellnessEntry[] = (wellnessRes.data || []).map((row: any) => ({
    id: row.id,
    athleteId: row.athlete_id,
    date: row.date,
    sleepHours: Number(row.sleep_hours),
    sleepQuality: row.sleep_quality,
    soreness: row.soreness,
    sorenessAreas: row.soreness_areas || [],
    fatigue: row.fatigue,
    stress: row.stress,
    mood: row.mood,
    morningRHR: row.morning_rhr,
    morningHRV: row.morning_hrv,
    hydrationLitres: row.hydration_litres,
    notes: row.notes,
    readinessScore: row.readiness_score,
    status: row.status as any,
  }));

  return { sessions, wellness };
}
