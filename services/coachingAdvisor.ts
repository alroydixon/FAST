import {
  AthleteProfile,
  DailyLoadCalculation,
  HealthMetricDaily,
  TrainingSession,
  WellnessEntry,
  CoachingTip
} from '../types/athlete';
import { generateSportsScienceTips } from '../utils/sportsScience';

export interface LocalCoachingDirectiveResponse {
  source: string;
  summary: string;
  readinessVerdict: 'GREEN_LIGHT' | 'AMBER_MODULATION' | 'RED_DELOAD';
  sessionRecommendation: string;
  physiologicalRationale: string;
  keyDirectives: string[];
  recoveryNutritionalTip: string;
}

/**
 * High-Performance offline coaching engine executing 100% locally.
 * Replaces remote server endpoints with deterministic sports science rule matching.
 */
export async function requestPersonalizedCoaching(
  athlete: AthleteProfile,
  latestLoad?: DailyLoadCalculation,
  latestWellness?: WellnessEntry[], // Updated to accept the array from your state cleanly
  latestHealth?: HealthMetricDaily,
  recentSessions: TrainingSession[] = [],
  userQuestion?: string
): Promise<LocalCoachingDirectiveResponse> {
  
  // 1. Gather active rules engine warnings calculated via sports science utilities
  const ruleTips = generateSportsScienceTips(athlete, latestLoad, latestWellness);
  const primaryTip: CoachingTip | undefined = ruleTips[0];
  
  const acwr = latestLoad?.acwr ?? 1.1;
  
  // Extract the single latest item safely from the array for evaluation
  const activeWellness = latestWellness && latestWellness.length > 0 ? latestWellness[0] : undefined;
  const readiness = activeWellness?.readinessScore ?? 80;
  const soreness = activeWellness?.soreness ?? 5;
  const sleep = activeWellness?.sleepHours ?? 8.0;

  // 2. Classify training gate verdict based on absolute baseline variations
  let verdict: 'GREEN_LIGHT' | 'AMBER_MODULATION' | 'RED_DELOAD' = 'GREEN_LIGHT';
  if (acwr > 1.5 || readiness < 55 || sleep < 6.0) {
    verdict = 'RED_DELOAD';
  } else if (acwr > 1.3 || acwr < 0.8 || readiness < 75 || soreness <= 2) {
    verdict = 'AMBER_MODULATION';
  }

  // 3. Select preset workout structures tailored to the current loading envelope
  let recommendation = 'Full capacity structural block. Authorized for high-velocity sprint drills, explosive plyometric sets, or match-intensity work.';
  if (verdict === 'RED_DELOAD') {
    recommendation = 'Compulsory offline active recovery block. Zone 1 active recovery ride/flush, extensive mobility, or hydrotherapy flushes (< 45 min). Avoid rapid accelerations.';
  } else if (verdict === 'AMBER_MODULATION') {
    recommendation = 'Modified modulation session. Cap overall volume at 70% of peak cycle volume. Focus on movement mechanics and extended warm-ups.';
  }

  // 4. Construct high-fidelity, actionable checklists
  const directives = [
    primaryTip?.actionableStep || 'Maintain scheduled training volume. Target optimal baseline electrolyte balance.',
    activeWellness?.sorenessAreas && activeWellness.sorenessAreas.length > 0
      ? `Allocate 10-15 minutes for explicit recovery release targeting localized clusters: ${activeWellness.sorenessAreas.join(', ')}.`
      : 'Execute standard 15-minute dynamic neuromuscular activation protocol before loaded speed/power movements.',
    'Log your rating of perceived exertion (Borg CR-10 sRPE) within 30 minutes of session conclusion for precise acute load metrics.'
  ];

  return {
    source: 'Local Sports Science Rule Engine (Offline)',
    summary: primaryTip 
      ? `${primaryTip.title}: ${primaryTip.recommendation}`
      : `All biometrics tracking within normal variance. ACWR is stable at ${acwr} and readiness score evaluates to ${readiness}/100.`,
    readinessVerdict: verdict,
    sessionRecommendation: recommendation,
    physiologicalRationale: primaryTip?.scientificRationale || 'Parasympathetic autonomic tracking and subjective psychometric markers confirm supercompensation and recovery status.',
    keyDirectives: directives,
    recoveryNutritionalTip: athlete.weightKg 
      ? `Consume a post-workout recovery bolus providing ~${Math.round(athlete.weightKg * 0.4)}g high-leucine protein and ~${Math.round(athlete.weightKg * 1.0)}g fast-acting carbohydrates within 45 minutes.`
      : 'Ingest a standard 3:1 complex carbohydrate to fast-digesting protein meal within the immediate post-training recovery window.'
  };
}
