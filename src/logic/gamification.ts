import { PhaseId } from '../components/HeaderBar';

export const PHASE_TIME_LIMITS: Record<PhaseId, number> = {
  1: 120, // 2:00
  2: 180, // 3:00
  3: 300, // 5:00
};

export interface PhaseTimingMap {
  1: number;
  2: number;
  3: number;
}

export interface PhaseCompletionTimes {
  1: number | null;
  2: number | null;
  3: number | null;
}

export interface PhaseScoreDetail {
  phase: PhaseId;
  title: string;
  accuracyPoints: number;
  timeBonusPoints: number;
  totalPoints: number;
  timeUsedSeconds: number | null;
  timeLimitSeconds: number;
  completed: boolean;
}

export interface GameRank {
  tier: 'oro' | 'plata' | 'bronce';
  title: string;
  description: string;
}

export interface TotalScoreSummary {
  phases: [PhaseScoreDetail, PhaseScoreDetail, PhaseScoreDetail];
  totalAccuracyPoints: number;
  totalTimeBonusPoints: number;
  totalScore: number;
  rank: GameRank;
}

export interface LeaderboardEntry {
  id: string;
  nick: string;
  score: number;
  rankTitle: string;
  totalTimeUsedSeconds: number;
  dateIso: string;
}

export function formatSecondsMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function sanitizeNick(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 20);
}

export function calculatePhase1Score(params: {
  exploredCount: number;
  totalComponents: number;
  remainingSeconds: number;
  completed: boolean;
}): PhaseScoreDetail {
  const limit = PHASE_TIME_LIMITS[1];
  const clampedExplored = Math.max(
    0,
    Math.min(params.exploredCount, params.totalComponents)
  );
  const cardPoints = clampedExplored * 50;
  const completionPoints = params.completed ? 100 : 0;
  const accuracyPoints = cardPoints + completionPoints;
  const timeBonusPoints = params.completed
    ? Math.max(0, Math.floor(params.remainingSeconds)) * 2
    : 0;
  const timeUsedSeconds = params.completed
    ? Math.max(0, limit - Math.floor(params.remainingSeconds))
    : null;

  return {
    phase: 1,
    title: 'Fase 1 · Componentes',
    accuracyPoints,
    timeBonusPoints,
    totalPoints: accuracyPoints + timeBonusPoints,
    timeUsedSeconds,
    timeLimitSeconds: limit,
    completed: params.completed,
  };
}

export function calculatePhase2Score(params: {
  placedCount: number;
  totalEquipment: number;
  completed: boolean;
  failedChecks: number;
  remainingSeconds: number;
}): PhaseScoreDetail {
  const limit = PHASE_TIME_LIMITS[2];
  const clampedPlaced = Math.max(
    0,
    Math.min(params.placedCount, params.totalEquipment)
  );
  const placementPoints = clampedPlaced * 25;
  const precisionBonus = params.completed
    ? Math.max(0, 150 - Math.max(0, params.failedChecks) * 25)
    : 0;
  const completionPoints = params.completed ? 200 : 0;
  const accuracyPoints = placementPoints + completionPoints + precisionBonus;
  const timeBonusPoints = params.completed
    ? Math.max(0, Math.floor(params.remainingSeconds)) * 3
    : 0;
  const timeUsedSeconds = params.completed
    ? Math.max(0, limit - Math.floor(params.remainingSeconds))
    : null;

  return {
    phase: 2,
    title: 'Fase 2 · Montaje Rack',
    accuracyPoints,
    timeBonusPoints,
    totalPoints: accuracyPoints + timeBonusPoints,
    timeUsedSeconds,
    timeLimitSeconds: limit,
    completed: params.completed,
  };
}

export function calculatePhase3Score(params: {
  cableCount: number;
  expectedCables: number;
  completed: boolean;
  failedPings: number;
  remainingSeconds: number;
  challengeExplored: boolean;
  usedSampleAssist: boolean;
}): PhaseScoreDetail {
  const limit = PHASE_TIME_LIMITS[3];
  const clampedCables = Math.max(
    0,
    Math.min(params.cableCount, params.expectedCables)
  );

  if (params.usedSampleAssist) {
    const assistPoints = params.completed ? 150 : 50;
    const challengePoints = params.challengeExplored ? 100 : 0;
    return {
      phase: 3,
      title: 'Fase 3 · Cableado y Red',
      accuracyPoints: assistPoints + challengePoints,
      timeBonusPoints: 0,
      totalPoints: assistPoints + challengePoints,
      timeUsedSeconds: params.completed
        ? Math.max(0, limit - Math.floor(params.remainingSeconds))
        : null,
      timeLimitSeconds: limit,
      completed: params.completed,
    };
  }

  const cablePoints = clampedCables * 30;
  const completionPoints = params.completed ? 250 : 0;
  const precisionBonus = params.completed
    ? Math.max(0, 150 - Math.max(0, params.failedPings) * 25)
    : 0;
  const challengePoints = params.challengeExplored ? 100 : 0;
  const accuracyPoints =
    cablePoints + completionPoints + precisionBonus + challengePoints;
  const timeBonusPoints = params.completed
    ? Math.max(0, Math.floor(params.remainingSeconds)) * 3
    : 0;
  const timeUsedSeconds = params.completed
    ? Math.max(0, limit - Math.floor(params.remainingSeconds))
    : null;

  return {
    phase: 3,
    title: 'Fase 3 · Cableado y Red',
    accuracyPoints,
    timeBonusPoints,
    totalPoints: accuracyPoints + timeBonusPoints,
    timeUsedSeconds,
    timeLimitSeconds: limit,
    completed: params.completed,
  };
}

export function determineRank(totalScore: number): GameRank {
  if (totalScore >= 2300) {
    return {
      tier: 'oro',
      title: 'Maestro/a de Redes · Oro',
      description:
        'Dominas el montaje del armario rack y el cableado estructurado con gran rapidez y precisión.',
    };
  }
  if (totalScore >= 1400) {
    return {
      tier: 'plata',
      title: 'Técnico/a de Taller · Plata',
      description:
        'Buen trabajo de montaje y conexión de red. Con un poco más de agilidad alcanzarás el nivel Oro.',
    };
  }
  return {
    tier: 'bronce',
    title: 'Instalador/a Junior · Bronce',
    description:
      'Has completado el montaje completo desde cero. Repite el reto para mejorar tu tiempo y sumar más puntos.',
  };
}

export function computeTotalGameScore(
  p1: PhaseScoreDetail,
  p2: PhaseScoreDetail,
  p3: PhaseScoreDetail
): TotalScoreSummary {
  const totalAccuracyPoints =
    p1.accuracyPoints + p2.accuracyPoints + p3.accuracyPoints;
  const totalTimeBonusPoints =
    p1.timeBonusPoints + p2.timeBonusPoints + p3.timeBonusPoints;
  const totalScore = totalAccuracyPoints + totalTimeBonusPoints;

  return {
    phases: [p1, p2, p3],
    totalAccuracyPoints,
    totalTimeBonusPoints,
    totalScore,
    rank: determineRank(totalScore),
  };
}
