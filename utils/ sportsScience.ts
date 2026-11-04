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
