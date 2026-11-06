export type TrainingPhase = 'Off-Season' | 'Pre-Season' | 'In-Season' | 'Taper' | 'Peaking';
export type UserRole = 'coach' | 'athlete';

export interface CoachProfile {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  teamName: string;
  avatarUrl?: string;
  athleteIds: string[];
  sportingCode?: SportingCode;
  specialization?: string;
}

export type SportingCode =
  | 'Track & Field'
  | 'Social Running / Road'
  | 'Cycling'
  | 'Football / Soccer'
  | 'Rugby / Field Sports'
  | 'Triathlon / Endurance'
  | 'Swimming & Aquatic'
  | 'Court Sports'
  | 'Combat & Martial Arts'
  | 'Strength & Functional'
  | 'Other';

export interface AthleteProfile {
  id: string;
  name: string;
  sport: string;
  sportingCode?: SportingCode;
  trackDiscipline?: 'Sprints' | 'Middle Distance';
  trackEvents?: string[];
  primaryTrackEvent?: string;
  position?: string;
  age: number;
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  restingHR: number;
  maxHR: number;
  currentPhase: TrainingPhase;
  avatarUrl?: string;
  coachId?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface TrainingSession {
  id: string;
  athleteId: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: string;
  durationMinutes: number;
  rpe: number; // 1 to 10
  sessionLoad: number; // duration * rpe
  avgHR?: number;
  maxHR?: number;
  trimp?: number;
  distanceKm?: number;
  notes?: string;
}

export interface WellnessEntry {
  id: string;
  athleteId: string;
  date: string;
  sleepHours: number;
  sleepQuality: number; // 1-5
  soreness: number; // 1-5
  sorenessAreas: string[];
  fatigue: number; // 1-5
  stress: number; // 1-5
  mood: number; // 1-5
  morningRHR?: number;
  morningHRV?: number;
  hydrationLitres?: number;
  notes?: string;
  readinessScore: number;
  status: 'Optimal' | 'Moderate' | 'High Risk';
}

export interface DailyLoadCalculation {
  date: string;
  dailyLoad: number;
  acuteLoad: number;
  chronicLoad: number;
  acwr: number;
  monotony?: number;
  strain?: number;
  riskCategory: 'Under-training' | 'Optimal (Sweet Spot)' | 'Elevated Fatigue' | 'Spike / High Injury Risk';
}

export interface CoachingTip {
  id: string;
  title: string;
  category: string;
  recommendation: string;
  scientificRationale: string;
  urgency: 'green' | 'amber' | 'red';
  actionableStep: string;
  metricsCited: string[];
}

export interface HealthMetricDaily {
  id: string;
  athleteId: string;
  date: string;
  steps: number;
  activeCalories: number;
  restingHR: number;
  hrvAverageMs: number;
  sleepHoursTotal: number;
  sourceDevice: string;
  lastSyncedAt: string;
}
export type StaffRole = 'coach' | 'medical_staff';
export type ClearanceStatus = 'FULL_CLEARANCE' | 'MODIFIED_RESTRICTION' | 'COMPULSORY_REMOVAL';

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  roleType: StaffRole;
  specialization: string;
  licenseNumber?: string;
}

export interface MedicalRecord {
  id: string;
  athleteId: string;
  clinicianId: string;
  date: string;
  encounterType: 'Initial Assessment' | 'Follow-up Consultation' | 'Emergency Triage' | 'Pre-Participation Screen';
  primaryComplaint: string;
  objectiveFindings: string;
  assessmentDiagnosis: string;
  treatmentPlan: string;
  clearanceStatus: ClearanceStatus;
  restrictionNotes?: string;
}

export interface InjuryLog {
  id: string;
  athleteId: string;
  injuryDate: string;
  anatomicalSite: string;
  injuryType: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  estimatedDaysOut?: number;
  status: 'Acute Recovery' | 'Functional Rehabilitation' | 'Return-to-Play Protocol' | 'Fully Resolved';
}
