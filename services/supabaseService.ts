import { supabase } from './supabase';
import { AthleteProfile, TrainingSession, WellnessEntry, StaffProfile, MedicalRecord, InjuryLog, TrackPerformanceRecord } from '../types/athlete';

export interface SupabaseSyncResult {
  success: boolean;
  message: string;
  rowsCount?: number;
  errorDetails?: string;
}

export async function pushAthletesToSupabase(athletes: AthleteProfile[]): Promise<SupabaseSyncResult> {
  if (athletes.length === 0) return { success: true, message: 'No records.', rowsCount: 0 };
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
  const { error } = await supabase.from('athletes').upsert(dbRows, { onConflict: 'id' });
  return { success: !error, message: error ? error.message : 'Athletes synced.', rowsCount: dbRows.length };
}

export async function pushTrainingSessionsToSupabase(sessions: TrainingSession[]): Promise<SupabaseSyncResult> {
  if (sessions.length === 0) return { success: true, message: 'No records.', rowsCount: 0 };
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
  const { error } = await supabase.from('training_sessions').upsert(dbRows, { onConflict: 'id' });
  return { success: !error, message: error ? error.message : 'Sessions synced.' };
}

export async function pushWellnessToSupabase(wellness: WellnessEntry[]): Promise<SupabaseSyncResult> {
  if (wellness.length === 0) return { success: true, message: 'No records.', rowsCount: 0 };
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
  const { error } = await supabase.from('wellness_logs').upsert(dbRows, { onConflict: 'id' });
  return { success: !error, message: error ? error.message : 'Wellness entries synced.' };
}

export async function fetchAthleteDashboardData(athleteId: string): Promise<{ sessions: TrainingSession[]; wellness: WellnessEntry[] }> {
  const [sessionsRes, wellnessRes] = await Promise.all([
    supabase.from('training_sessions').select('*').eq('athlete_id', athleteId).order('date', { ascending: false }),
    supabase.from('wellness_logs').select('*').eq('athlete_id', athleteId).order('date', { ascending: false })
  ]);
  return {
    sessions: (sessionsRes.data || []).map((row: any) => ({
      id: row.id, athleteId: row.athlete_id, date: row.date, title: row.title, type: row.type, durationMinutes: Number(row.duration_minutes), rpe: row.rpe, sessionLoad: Number(row.session_load), avgHR: row.avg_hr, maxHR: row.max_hr, trimp: row.trimp, distanceKm: row.distance_km, notes: row.notes,
    })),
    wellness: (wellnessRes.data || []).map((row: any) => ({
      id: row.id, athleteId: row.athlete_id, date: row.date, sleepHours: Number(row.sleep_hours), sleepQuality: row.sleep_quality, soreness: row.soreness, sorenessAreas: row.soreness_areas || [], fatigue: row.fatigue, stress: row.stress, mood: row.mood, morningRHR: row.morning_rhr, morningHRV: row.morning_hrv, hydrationLitres: row.hydration_litres, notes: row.notes, readinessScore: row.readiness_score, status: row.status as any,
    }))
  };
}

export async function pushStaffProfileToSupabase(staff: StaffProfile): Promise<any> {
  const { error } = await supabase.from('staff_profiles').upsert({
    id: staff.id, name: staff.name, email: staff.email, role_type: staff.roleType, specialization: staff.specialization, license_number: staff.licenseNumber || null
  }, { onConflict: 'id' });
  return { success: !error, message: error ? error.message : 'Staff profile registered!' };
}

export async function pushMedicalRecordToSupabase(record: MedicalRecord): Promise<any> {
  const { error } = await supabase.from('medical_records').insert({
    id: record.id, athlete_id: record.athleteId, clinician_id: record.clinicianId, date: record.date, encounter_type: record.encounterType, primary_complaint: record.primaryComplaint, objective_findings: record.objectiveFindings, assessment_diagnosis: record.assessmentDiagnosis, treatment_plan: record.treatmentPlan, clearance_status: record.clearanceStatus, restriction_notes: record.restrictionNotes || null
  });
  return { success: !error, message: error ? error.message : 'EMR added!' };
}

export async function pushInjuryLogToSupabase(log: InjuryLog): Promise<any> {
  const { error } = await supabase.from('injury_logs').upsert({
    id: log.id, athlete_id: log.athleteId, injury_date: log.injuryDate, anatomical_site: log.anatomicalSite, injury_type: log.injuryType, severity: log.severity, estimated_days_out: log.estimatedDaysOut || null, status: log.status
  }, { onConflict: 'id' });
  return { success: !error, message: error ? error.message : 'Injury logged!' };
}

export async function pushTrackPerformance(record: TrackPerformanceRecord): Promise<any> {
  const { error } = await supabase.from('track_performances').insert({
    id: record.id, athlete_id: record.athleteId, date: record.date, event_type: record.eventType, session_type: record.sessionType, time_seconds: record.timeSeconds, velocity_ms: record.velocityMs || null, wind_reading: record.windReading || null, venue_notes: record.venueNotes || null
  });
  return { success: !error, message: error ? error.message : 'Track mark added!' };
}

export async function fetchRosterAthletes(coachId: string): Promise<AthleteProfile[]> {
  const { data } = await supabase.from('athletes').select('*').eq('coach_id', coachId);
  return (data || []).map((row: any) => ({
    id: row.id, name: row.name, sport: row.sport, sportingCode: row.sporting_code, trackDiscipline: row.track_discipline, age: row.age, gender: row.gender, weightKg: Number(row.weight_kg), heightCm: Number(row.height_cm), restingHR: row.resting_hr, maxHR: row.max_hr, currentPhase: row.current_phase, coachId: row.coach_id
  }));
}

export async function fetchTrackPerformances(athleteId: string): Promise<TrackPerformanceRecord[]> {
  const { data } = await supabase.from('track_performances').select('*').eq('athlete_id', athleteId).order('date', { ascending: true });
  return (data || []).map((row: any) => ({
    id: row.id, athleteId: row.athlete_id, date: row.date, eventType: row.event_type, sessionType: row.session_type, timeSeconds: Number(row.time_seconds), velocityMs: row.velocity_ms, windReading: row.wind_reading, venueNotes: row.venue_notes
  }));
}
