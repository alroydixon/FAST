import { AthleteProfile, TrainingSession, WellnessEntry, DailyLoadCalculation, CoachingTip } from '../types/athlete';

export function calculateSessionRPE(durationMinutes: number, rpe: number): number {
  return Math.round(durationMinutes * Math.max(1, Math.min(10, rpe)));
}

export function calculateWellnessReadiness(
  entry: Partial<WellnessEntry>, 
  baselineRHR: number = 50
): { readinessScore: number; status: 'Optimal' | 'Moderate' | 'High Risk' } {
  const sleepQ = entry.sleepQuality ?? 3;
  const soreness = entry.soreness ?? 3;
  const fatigue = entry.fatigue ?? 3;
  const stress = entry.stress ?? 3;
  const mood = entry.mood ?? 3;

  const rawSum = sleepQ + soreness + fatigue + stress + mood;
  let score = Math.round(((rawSum - 5) / 20) * 100);

  if ((entry.sleepHours ?? 7.5) < 6) score -= 8;
  if (entry.morningRHR && entry.morningRHR > baselineRHR + 5) score -= 10;

  score = Math.max(10, Math.min(100, score));
  const status = score >= 75 ? 'Optimal' : score >= 55 ? 'Moderate' : 'High Risk';
  return { readinessScore: score, status };
}

export function calculateLoadMetrics(sessions: TrainingSession[], daysCount: number = 60): DailyLoadCalculation[] {
  const loadMap: Record<string, number> = {};
  const today = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    loadMap[d.toISOString().split('T')[0]] = 0;
  }

  sessions.forEach((s) => {
    if (loadMap[s.date] !== undefined) loadMap[s.date] += s.sessionLoad;
  });

  const sortedDates = Object.keys(loadMap).sort();
  return sortedDates.map((currentDate, i) => {
    const dailyLoad = loadMap[currentDate];

    const acuteSlice = sortedDates.slice(Math.max(0, i - 6), i + 1).map((d) => loadMap[d]);
    const acuteLoad = Math.round(acuteSlice.reduce((a, b) => a + b, 0) / Math.min(7, acuteSlice.length));

    const chronicSlice = sortedDates.slice(Math.max(0, i - 27), i + 1).map((d) => loadMap[d]);
    const chronicLoad = Math.round(chronicSlice.reduce((a, b) => a + b, 0) / Math.min(28, chronicSlice.length));

    const acwr = chronicLoad > 0 ? Number((acuteLoad / chronicLoad).toFixed(2)) : 1.0;
    const riskCategory = acwr > 1.5 ? 'Spike / High Injury Risk' : acwr > 1.3 ? 'Elevated Fatigue' : acwr >= 0.8 ? 'Optimal (Sweet Spot)' : 'Under-training';

    return { date: currentDate, dailyLoad, acuteLoad, chronicLoad, acwr, riskCategory };
  });
}

export function generateSportsScienceTips(athlete: AthleteProfile, latestLoad?: DailyLoadCalculation, latestWellness?: WellnessEntry[]): CoachingTip[] {
  const tips: CoachingTip[] = [];

  if (latestLoad && latestLoad.acwr > 1.5) {
    tips.push({
      id: 'acwr-spike',
      title: 'Workload Spike Warning',
      category: 'Load Management',
      urgency: 'red',
      recommendation: 'Acute workload has rapidly outpaced chronic tolerance baseline capacity.',
      scientificRationale: 'Gabbett ACWR Model (2016): Values exceeding 1.5 create an exponential exposure factor toward soft-tissue injury risk.',
      actionableStep: 'Downgrade today s session intensity or substitute with recovery/mobility blocks.',
      metricsCited: [`ACWR: ${latestLoad.acwr}`],
    });
  }
  return tips;
}
/**
 * Ebben & Gullett Biomechanics Model: Computes dynamic mechanical force 
 * and power outputs from body mass and repetitions volume parameters.
 */
export function calculateBiomechanicalForce(
  testType: 'Push-ups' | 'Pull-ups' | 'Air Squats',
  reps: number,
  bodyWeightKg: number,
  durationSeconds: number = 60
): { forceNewtons: number; powerWatts: number; tier: 'Elite' | 'Advanced' | 'Intermediate' | 'Baseline' } {
  const gravity = 9.81;
  let forceValue = 0;
  
  // Dynamic weight distribution constant values per movement type
  if (testType === 'Push-ups') {
    forceValue = bodyWeightKg * 0.65 * gravity;
  } else if (testType === 'Air Squats') {
    forceValue = bodyWeightKg * 0.85 * gravity;
  } else {
    forceValue = bodyWeightKg * gravity; // Pull-ups handles full load countermove
  }

  const baseForce = Math.round(forceValue + (reps * 1.5));
  const workDone = baseForce * (reps * 0.5); // Estimated mechanical displacement
  const powerOutput = Math.round(workDone / durationSeconds);

  let tier: 'Elite' | 'Advanced' | 'Intermediate' | 'Baseline' = 'Baseline';
  if (reps >= 45) tier = 'Elite';
  else if (reps >= 30) tier = 'Advanced';
  else if (reps >= 15) tier = 'Intermediate';

  return { forceNewtons: baseForce, powerWatts: powerOutput, tier };
}

/**
 * Computes split phase breakdowns (Acceleration, Max Velocity, and Speed Endurance)
 * across a standard 100m sprint timeline profile.
 */
export function computeSprintSplitBreakdown(timeSeconds: number) {
  const segment = timeSeconds / 3;
  return {
    drivePhase: Number((segment * 0.95).toFixed(2)),       // 0-30m Acceleration block
    maxVelocity: Number((segment * 1.02).toFixed(2)),      // 30-60m Peak Volume tier
    speedEndurance: Number((segment * 1.03).toFixed(2))    // 60-100m Maintenance allocation
  };
}
