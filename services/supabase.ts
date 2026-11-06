import { createClient } from '@supabase/supabase-js';
import { AthleteProfile } from '../types/athlete';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Pull directly using your matching .env.local string key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing public Supabase keys in environment settings (.env.local)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { TrackPerformanceRecord } from '../types/athlete';

/**
 * Pushes a timed track velocity interval record to Supabase.
 */
export async function pushTrackPerformance(record: TrackPerformanceRecord): Promise<any> {
  const { error } = await supabase
    .from('track_performances')
    .insert({
      id: record.id,
      athlete_id: record.athleteId,
      date: record.date,
      event_type: record.eventType,
      session_type: record.sessionType,
      time_seconds: record.timeSeconds,
      velocity_ms: record.velocityMs || null,
      wind_reading: record.windReading || null,
      venue_notes: record.venueNotes || null
    });
  return { success: !error, message: error ? error.message : 'Track metric logged!' };
}

/**
 * Queries all coaches to populate onboarding choice lists.
 */
export async function fetchAllCoachesList(): Promise<any[]> {
  const { data } = await supabase.from('staff_profiles').select('*').eq('role_type', 'coach');
  return data || [];
}

/**
 * Queries all athletes explicitly bound to a specific coach's ID.
 */
export async function fetchRosterAthletes(coachId: string): Promise<AthleteProfile[]> {
  const { data } = await supabase.from('athletes').select('*').eq('coach_id', coachId);
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    sport: row.sport,
    sportingCode: row.sporting_code,
    trackDiscipline: row.track_discipline,
    age: row.age,
    gender: row.gender,
    weightKg: Number(row.weight_kg),
    heightCm: Number(row.height_cm),
    restingHR: row.resting_hr,
    maxHR: row.max_hr,
    currentPhase: row.current_phase,
    coachId: row.coach_id
  }));
}

/**
 * Pulls historical track performance timings to populate progression charts.
 */
export async function fetchTrackPerformances(athleteId: string): Promise<TrackPerformanceRecord[]> {
  const { data } = await supabase
    .from('track_performances')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('date', { ascending: true });
    
  return (data || []).map((row: any) => ({
    id: row.id,
    athleteId: row.athlete_id,
    date: row.date,
    eventType: row.event_type,
    sessionType: row.session_type,
    timeSeconds: Number(row.time_seconds),
    velocityMs: row.velocity_ms,
    windReading: row.wind_reading,
    venueNotes: row.venue_notes
  }));
}
